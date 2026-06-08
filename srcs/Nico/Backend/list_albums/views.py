import mimetypes
import os
import shutil
import tempfile
import zipfile
from datetime import datetime, timedelta
from django.conf import settings
from django.core.mail import EmailMessage
from django.http import JsonResponse
from PIL import Image, ImageEnhance, ImageOps
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import status
import requests


def get_all_files(base_path, relative_path="", url_base=None):
    """
    Parcours récursivement le dossier base_path et renvoie un tableau
    de fichiers avec leur chemin et dossier parent.

    url_base peut être spécifié pour générer des URLs à partir d'un
    préfixe différent de MEDIA_URL (utile pour les archives).
    """
    files_list = []
    if url_base is None:
        url_base = settings.MEDIA_URL.rstrip("/")

    try:
        for item in os.listdir(base_path):
            item_path = os.path.join(base_path, item)
            item_relative = os.path.join(relative_path, item)

            if os.path.isdir(item_path):
                # appel récursif pour sous-dossiers
                files_list.extend(get_all_files(item_path, item_relative, url_base=url_base))
            elif item.lower().endswith((".jpg", ".jpeg", ".png", ".gif")):
                # chemin URL propre
                file_url = os.path.join(
                    url_base,
                    item_relative.replace("\\", "/")
                )
                files_list.append({
                    "folder": relative_path.replace("\\", "/"),
                    "path": file_url
                })
    except FileNotFoundError:
        return []
    return files_list


@api_view(["GET"])
@permission_classes([AllowAny])
def list_albums(request):
    media_path = settings.MEDIA_ROOT
    all_files = get_all_files(media_path)
    return JsonResponse(all_files, safe=False)

@api_view(["GET"])
@permission_classes([AllowAny])
def mail_archives(request):
    date_key = request.GET.get('date')
    if not date_key:
        date_key = datetime.now().strftime('%d_%m_%Y')

    archive_root = os.path.join(settings.MEDIA_ROOT, 'archive mail', date_key)
    if not os.path.isdir(archive_root):
        return JsonResponse([], safe=False)

    archive_url_base = os.path.join(settings.MEDIA_URL.rstrip('/'), 'archive mail', date_key)
    archive_files = get_all_files(archive_root, url_base=archive_url_base)
    return JsonResponse(archive_files, safe=False)

@api_view(["GET"])
@permission_classes([AllowAny])
def impress_archives(request):
    date_key = request.GET.get('date')
    if not date_key:
        date_key = datetime.now().strftime('%d_%m_%Y')

    archive_root = os.path.join(settings.MEDIA_ROOT, 'archive impression', date_key)
    if not os.path.isdir(archive_root):
        return JsonResponse([], safe=False)

    archive_url_base = os.path.join(settings.MEDIA_URL.rstrip('/'), 'archive impression', date_key)
    archive_files = get_all_files(archive_root, url_base=archive_url_base)
    return JsonResponse(archive_files, safe=False)

@api_view(["POST"])
def create_client_folder(request):
    client = request.data.get("client")
    files = request.data.get("files", [])

    if not client or not files:
        return JsonResponse({"error": "Nom du client ou fichiers manquants"}, status=status.HTTP_400_BAD_REQUEST)

    moved_files = []

    for f in files:
        try:
            relative_path = f.replace("/media/", "")
            source_path = os.path.join(settings.MEDIA_ROOT, relative_path)
            if os.path.exists(source_path):
                origin_folder = os.path.dirname(source_path)
                client_folder = os.path.join(origin_folder, client)
                os.makedirs(client_folder, exist_ok=True)
                dest_path = os.path.join(client_folder, os.path.basename(source_path))
                shutil.move(source_path, dest_path)  # ✅ on déplace maintenant
                moved_files.append(dest_path)
        except Exception as e:
            print(f"❌ Erreur avec {f}: {e}")

    return JsonResponse({
        "message": f"Sous-dossier '{client}' créé avec {len(moved_files)} fichier(s)",
        "files": moved_files
    }, status=status.HTTP_201_CREATED)

@api_view(["POST"])
@permission_classes([AllowAny])
def confirm_cart(request):
    """
    Reçoit : { "email": "test@example.com", "files": ["/media/date/..."], "copy_full_folders": true }
    Copie les images dans validated/<email> et, si demandé, copie l'intégralité des dossiers sources dans wab_validation/<email>.
    """
    data = request.data
    email = data.get("email")
    files = data.get("files", [])
    copy_full_folders = bool(data.get("copy_full_folders", False))

    if not email or not files:
        return JsonResponse({"error": "Email ou fichiers manquants"}, status=status.HTTP_400_BAD_REQUEST)

    email_folder = os.path.join(settings.MEDIA_ROOT, "validated", email)
    os.makedirs(email_folder, exist_ok=True)

    copied_files = []
    source_dirs = set()

    for file_path in files:
        relative_path = file_path.replace(settings.MEDIA_URL, "").lstrip("/")
        src_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        if os.path.exists(src_path):
            dest_path = os.path.join(email_folder, os.path.basename(src_path))
            shutil.copy2(src_path, dest_path)
            copied_files.append(dest_path.replace(settings.MEDIA_ROOT, settings.MEDIA_URL))
            source_dirs.add(os.path.dirname(src_path))

    wab_copied_files = []

    if copy_full_folders:
        wab_root = os.path.join(settings.MEDIA_ROOT, "wab_validation", email)
        os.makedirs(wab_root, exist_ok=True)
        for source_dir in source_dirs:
            if os.path.isdir(source_dir):
                for filename in os.listdir(source_dir):
                    src_file = os.path.join(source_dir, filename)
                    if os.path.isfile(src_file) and filename.lower().endswith((".jpg", ".jpeg", ".png", ".gif")):
                        dest_file = os.path.join(wab_root, filename)
                        base, ext = os.path.splitext(filename)
                        counter = 1
                        while os.path.exists(dest_file):
                            dest_file = os.path.join(wab_root, f"{base}_{counter}{ext}")
                            counter += 1
                        shutil.copy2(src_file, dest_file)
                        wab_copied_files.append(dest_file.replace(settings.MEDIA_ROOT, settings.MEDIA_URL))

    return JsonResponse({
        "success": True,
        "email": email,
        "copied": copied_files,
        "wab_copied": wab_copied_files,
        "copy_full_folders": copy_full_folders,
    })


def archive_directory(source_dir, archive_base):
    today = datetime.now().strftime('%d_%m_%Y')
    archive_root = os.path.join(settings.MEDIA_ROOT, archive_base, today)
    os.makedirs(archive_root, exist_ok=True)

    if not os.path.isdir(source_dir):
        return None

    dest_dir = os.path.join(archive_root, os.path.basename(source_dir))
    counter = 1
    while os.path.exists(dest_dir):
        dest_dir = os.path.join(archive_root, f"{os.path.basename(source_dir)}_{counter}")
        counter += 1

    shutil.move(source_dir, dest_dir)
    return dest_dir


@api_view(['POST'])
@permission_classes([AllowAny])
def upload_images(request):
    photographer = request.POST.get('photographer')
    if not photographer:
        return JsonResponse({'error': 'Photographer name required'}, status=400)
    
    today = datetime.now().strftime('%d_%m_%Y')
    base_path = os.path.join(settings.MEDIA_ROOT, 'date', today)
    photographer_path = os.path.join(base_path, photographer)
    os.makedirs(photographer_path, exist_ok=True)
    
    uploaded_files = []
    for file_key in request.FILES:
        files = request.FILES.getlist(file_key)
        for file in files:
            file_path = os.path.join(photographer_path, file.name)
            with open(file_path, 'wb') as f:
                for chunk in file.chunks():
                    f.write(chunk)
            uploaded_files.append(file.name)
    
    return JsonResponse({'message': f'Uploaded {len(uploaded_files)} images for {photographer}', 'files': uploaded_files})

TRANSFERNOW_API_KEY = os.environ.get('TRANSFERNOW_API_KEY')
TRANSFERNOW_API_URL = 'https://api.transfernow.net/v1/transfers'


def _fetch_transfernow_part_upload_url(transfer_id, file_id, upload_id, part_number, headers):
    url = f"{TRANSFERNOW_API_URL}/{transfer_id}/files/{file_id}/parts/{part_number}"
    params = {'uploadId': upload_id}
    response = requests.get(url, headers=headers, params=params)
    if response.status_code not in [200, 201]:
        raise ValueError(
            f'Échec de la récupération de l’uploadUrl TransferNow pour le part {part_number}: '
            f'{response.status_code} {response.text}'
        )
    upload_data = response.json()
    upload_url = upload_data.get('uploadUrl') or upload_data.get('url')
    if not upload_url:
        raise ValueError(f'Aucun uploadUrl dans la réponse TransferNow pour part {part_number}: {upload_data}')
    return upload_url


def _complete_transfer_file_upload(transfer_id, file_id, upload_id, headers):
    url = f"{TRANSFERNOW_API_URL}/{transfer_id}/files/{file_id}/upload-done"
    params = {'uploadId': upload_id}
    response = requests.put(url, headers=headers, params=params)
    if response.status_code not in [200, 201]:
        raise ValueError(
            f'Échec de la finalisation du fichier TransferNow {file_id}: '
            f'{response.status_code} {response.text}'
        )


def _complete_transfer_upload(transfer_id, headers):
    url = f"{TRANSFERNOW_API_URL}/{transfer_id}/upload-done"
    response = requests.put(url, headers=headers)
    if response.status_code not in [200, 201]:
        raise ValueError(
            f'Échec de la finalisation du transfert TransferNow {transfer_id}: '
            f'{response.status_code} {response.text}'
        )


def _upload_zip_to_transfer(transfer_id, zip_path, transfer_file, headers):
    multipart_upload = (
        transfer_file.get('multipartUpload')
        or transfer_file.get('multipart_upload')
        or {}
    )
    upload_id = multipart_upload.get('uploadId')
    if not upload_id:
        raise ValueError(f'Aucun uploadId trouvé dans la réponse TransferNow. transfer_file={transfer_file}')

    parts = multipart_upload.get('parts') or multipart_upload.get('Parts') or []
    if not parts:
        raise ValueError(f'Aucune partie d’upload disponible pour TransferNow. transfer_file={transfer_file}')

    file_id = transfer_file.get('id')
    if not file_id:
        raise ValueError(f'Aucun fileId trouvé dans la réponse TransferNow. transfer_file={transfer_file}')

    for part in parts:
        part_number = part.get('partNumber')
        if part_number is None:
            raise ValueError(f'PartNumber manquant dans la réponse TransferNow. part={part}')

        upload_url = _fetch_transfernow_part_upload_url(
            transfer_id,
            file_id,
            upload_id,
            part_number,
            headers
        )

        with open(zip_path, 'rb') as f:
            start = int(part.get('start', 0))
            size = int(part.get('size', 0))
            f.seek(start)
            chunk = f.read(size)

        upload_headers = {'Content-Type': 'application/octet-stream'}
        upload_response = requests.put(upload_url, data=chunk, headers=upload_headers)
        if upload_response.status_code not in [200, 201, 204]:
            raise ValueError(
                f'Erreur upload TransferNow part {part_number} : '
                f'{upload_response.status_code} {upload_response.text}'
            )

    _complete_transfer_file_upload(transfer_id, file_id, upload_id, headers)


@api_view(['POST'])
@permission_classes([AllowAny])
def send_email_images(request):
    email_to = request.data.get('email')
    files = request.data.get('files', [])
    subject = request.data.get('subject', 'Vos images sélectionnées sont disponibles')
    message = request.data.get('message', 'Une archive contenant vos images sélectionnées a été préparée.')
    validity_days = int(request.data.get('validityDays', 7))
    max_downloads = int(request.data.get('maxDownloads', 7))
    allow_preview = bool(request.data.get('allowPreview', True))
    lang_code = request.data.get('langCode', 'fr')
    folder = request.data.get('folder')

    if not email_to or not files:
        return JsonResponse({'error': 'Email ou fichiers manquants'}, status=status.HTTP_400_BAD_REQUEST)

    if not TRANSFERNOW_API_KEY:
        return JsonResponse({'error': 'TRANSFERNOW_API_KEY non configurée'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    selected_paths = []
    for file_url in files:
        relative_path = file_url.replace(settings.MEDIA_URL, '').lstrip('/')
        abs_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        if os.path.exists(abs_path) and os.path.isfile(abs_path):
            selected_paths.append(abs_path)

    if not selected_paths:
        return JsonResponse({'error': 'Aucun fichier trouvé pour l’upload'}, status=status.HTTP_400_BAD_REQUEST)

    def find_source_folder():
        if folder:
            return os.path.join(settings.MEDIA_ROOT, folder.strip('/'))
        first_file = files[0].replace(settings.MEDIA_URL, '').lstrip('/')
        parts = first_file.split('/')
        if len(parts) >= 2:
            return os.path.join(settings.MEDIA_ROOT, parts[0], parts[1])
        return None

    source_folder = find_source_folder()
    archive_path = None

    with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as temp_zip:
        zip_path = temp_zip.name

    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for abs_path in selected_paths:
                zipf.write(abs_path, os.path.basename(abs_path))

        zip_size = os.path.getsize(zip_path)

        payload = {
            'langCode': lang_code,
            'toEmails': [],
            'files': [{
                'name': 'images_selectionnees.zip',
                'size': zip_size
            }],
            'message': message,
            'subject': subject,
            'validityStart': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
            'validityEnd': (datetime.utcnow() + timedelta(days=validity_days)).strftime('%Y-%m-%dT%H:%M:%SZ'),
            'allowPreview': allow_preview,
            'maxDownloads': max_downloads
        }

        transfer_headers = {
            'Content-Type': 'application/json',
            'x-api-key': TRANSFERNOW_API_KEY
        }

        transfer_response = requests.post(TRANSFERNOW_API_URL, headers=transfer_headers, json=payload)
        if transfer_response.status_code not in [200, 201]:
            return JsonResponse({
                'error': 'Échec de la création du transfert TransferNow',
                'details': transfer_response.text
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        transfer_data = transfer_response.json()
        transfer_files = transfer_data.get('files', [])
        if not transfer_files:
            return JsonResponse({'error': 'Réponse TransferNow invalide: aucun fichier'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        transfer_id = transfer_data.get('transferId')
        if not transfer_id:
            return JsonResponse({'error': 'Impossible de récupérer transferId TransferNow'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        _upload_zip_to_transfer(transfer_id, zip_path, transfer_files[0], transfer_headers)
        _complete_transfer_upload(transfer_id, transfer_headers)

        download_link = transfer_data.get('link') or transfer_data.get('url')
        if not download_link:
            return JsonResponse({'error': 'Impossible de récupérer le lien TransferNow'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        email_body = f"""Bonjour,

{message}

Vous pouvez télécharger votre transfert ici :
{download_link}

Cordialement."""

        email = EmailMessage(subject, email_body, settings.DEFAULT_FROM_EMAIL, [email_to])
        email.send()

        if source_folder:
            try:
                archived_dir = archive_directory(source_folder, 'archive mail')
                if archived_dir:
                    archive_path = archived_dir.replace(settings.MEDIA_ROOT, settings.MEDIA_URL)
            except Exception as e:
                print(f"Erreur lors de l'archivage du dossier email : {e}")

        response_data = {
            'success': True,
            'email': email_to,
            'download_link': download_link,
            'transfer': transfer_data
        }
        if archive_path:
            response_data['archived_folder'] = archive_path

        return JsonResponse(response_data)
    finally:
        if os.path.exists(zip_path):
            os.unlink(zip_path)

@api_view(['POST'])
@permission_classes([AllowAny])
def archive_print_images(request):
    folder = request.data.get('folder')
    files = request.data.get('files', [])

    if not folder and not files:
        return JsonResponse({'error': 'Dossier ou fichiers requis'}, status=status.HTTP_400_BAD_REQUEST)

    if folder:
        source_folder = os.path.join(settings.MEDIA_ROOT, folder.strip('/'))
    else:
        first_file = files[0].replace(settings.MEDIA_URL, '').lstrip('/')
        parts = first_file.split('/')
        source_folder = os.path.join(settings.MEDIA_ROOT, parts[0], parts[1]) if len(parts) >= 2 else None

    if not source_folder or not os.path.isdir(source_folder):
        return JsonResponse({'error': 'Dossier source introuvable'}, status=status.HTTP_404_NOT_FOUND)

    try:
        archived_dir = archive_directory(source_folder, 'archive impression')
        if not archived_dir:
            return JsonResponse({'error': 'Erreur lors de l’archivage de l’impression'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return JsonResponse({
            'success': True,
            'archived_folder': archived_dir.replace(settings.MEDIA_ROOT, settings.MEDIA_URL),
            'message': 'Impression archivée avec succès',
        })
    except Exception as e:
        return JsonResponse({'error': f'Erreur lors de l’archivage de l’impression : {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def apply_image_edits(request):
    image_url = request.data.get('path')
    preset = request.data.get('preset', 'none')
    brightness = float(request.data.get('brightness', 100))
    contrast = float(request.data.get('contrast', 100))
    saturation = float(request.data.get('saturation', 100))

    if not image_url:
        return JsonResponse({'error': 'Path requis'}, status=status.HTTP_400_BAD_REQUEST)

    relative_path = image_url.replace(settings.MEDIA_URL, '').lstrip('/')
    target_path = os.path.join(settings.MEDIA_ROOT, relative_path)

    if not os.path.exists(target_path):
        return JsonResponse({'error': 'Image introuvable'}, status=status.HTTP_404_NOT_FOUND)

    try:
        image = Image.open(target_path).convert('RGB')

        if preset == 'bw':
            image = ImageOps.grayscale(image).convert('RGB')
        elif preset == 'sepia':
            image = ImageOps.colorize(ImageOps.grayscale(image), '#704214', '#C0A080')
        elif preset == 'warm':
            image = ImageOps.colorize(ImageOps.grayscale(image), '#FFDDC1', '#A85A29')
        elif preset == 'cool':
            image = ImageOps.colorize(ImageOps.grayscale(image), '#C8E6FF', '#2D6FA8')
        elif preset == 'vibrant':
            image = ImageEnhance.Color(image).enhance(1.4)

        image = ImageEnhance.Brightness(image).enhance(brightness / 100)
        image = ImageEnhance.Contrast(image).enhance(contrast / 100)
        image = ImageEnhance.Color(image).enhance(saturation / 100)

        image.save(target_path)
    except Exception as e:
        return JsonResponse({'error': f'Erreur lors de l’édition de l’image : {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return JsonResponse({'message': 'Image éditée avec succès', 'path': settings.MEDIA_URL + relative_path})

@api_view(['POST'])
@permission_classes([AllowAny])
def replace_image(request):
    image_url = request.POST.get('path')
    image_file = request.FILES.get('image')

    if not image_url or not image_file:
        return JsonResponse({'error': 'Path et fichier image requis'}, status=status.HTTP_400_BAD_REQUEST)

    relative_path = image_url.replace(settings.MEDIA_URL, '').lstrip('/')
    target_path = os.path.join(settings.MEDIA_ROOT, relative_path)

    if not os.path.exists(target_path):
        return JsonResponse({'error': 'Image introuvable'}, status=status.HTTP_404_NOT_FOUND)

    try:
        with open(target_path, 'wb') as destination:
            for chunk in image_file.chunks():
                destination.write(chunk)
    except Exception as e:
        return JsonResponse({'error': f'Erreur lors de la sauvegarde du fichier: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return JsonResponse({'message': 'Image remplacée avec succès', 'path': settings.MEDIA_URL + relative_path})

@api_view(['POST'])
@permission_classes([AllowAny])
def validate_image(request):
    image_url = request.data.get('path')
    if not image_url:
        return JsonResponse({'error': 'Path requis'}, status=status.HTTP_400_BAD_REQUEST)

    relative_path = image_url.replace(settings.MEDIA_URL, '').lstrip('/')
    src_path = os.path.join(settings.MEDIA_ROOT, relative_path)

    if not os.path.exists(src_path):
        return JsonResponse({'error': 'Image introuvable'}, status=status.HTTP_404_NOT_FOUND)

    # Assuming path is validated/email/image
    parts = relative_path.split('/')
    if len(parts) < 3 or parts[0] != 'validated':
        return JsonResponse({'error': 'Chemin invalide'}, status=status.HTTP_400_BAD_REQUEST)

    email = parts[1]
    filename = parts[2]

    dest_dir = os.path.join(settings.MEDIA_ROOT, 'wab_validation', email)
    os.makedirs(dest_dir, exist_ok=True)

    dest_path = os.path.join(dest_dir, filename)

    try:
        shutil.move(src_path, dest_path)
    except Exception as e:
        return JsonResponse({'error': f'Erreur lors du déplacement: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return JsonResponse({'message': 'Image validée et déplacée vers wab_validation'})
@api_view(['GET'])
@permission_classes([AllowAny])
def get_app_settings(request):
    """Récupère les paramètres globaux de l'application"""
    from .models import AppSettings
    settings_obj = AppSettings.get_settings()
    return JsonResponse({
        'background_image_path': settings_obj.background_image_path,
        'updated_at': settings_obj.updated_at.isoformat()
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def update_app_settings(request):
    """Met à jour les paramètres globaux de l'application"""
    from .models import AppSettings
    
    background_path = request.data.get('background_image_path')
    if not background_path:
        return JsonResponse({'error': 'background_image_path requis'}, status=400)
    
    settings_obj = AppSettings.get_settings()
    settings_obj.background_image_path = background_path
    settings_obj.save()
    
    return JsonResponse({
        'message': 'Paramètres mis à jour avec succès',
        'background_image_path': settings_obj.background_image_path,
        'updated_at': settings_obj.updated_at.isoformat()
    })
