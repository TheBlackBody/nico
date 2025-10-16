import os
import shutil
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


def get_all_files(base_path, relative_path=""):
    """
    Parcours récursivement le dossier base_path et renvoie un tableau
    de fichiers avec leur chemin et dossier parent.
    """
    files_list = []
    try:
        for item in os.listdir(base_path):
            item_path = os.path.join(base_path, item)
            item_relative = os.path.join(relative_path, item)

            if os.path.isdir(item_path):
                # appel récursif pour sous-dossiers
                files_list.extend(get_all_files(item_path, item_relative))
            elif item.lower().endswith((".jpg", ".jpeg", ".png", ".gif")):
                # chemin URL propre
                file_url = os.path.join(
                    settings.MEDIA_URL.rstrip("/"),
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

import os
import shutil
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework import status

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
    Reçoit : { "email": "test@example.com", "files": ["/media/date/..."] }
    Crée un dossier dans MEDIA_ROOT/validated/<email>/ avec toutes les images copiées.
    """
    data = request.data
    email = data.get("email")
    files = data.get("files", [])

    if not email or not files:
        return JsonResponse({"error": "Email ou fichiers manquants"}, status=400)

    # Dossier de destination
    email_folder = os.path.join(settings.MEDIA_ROOT, "validated", email)
    os.makedirs(email_folder, exist_ok=True)

    copied_files = []

    for file_path in files:
        relative_path = file_path.replace(settings.MEDIA_URL, "").lstrip("/")
        src_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        if os.path.exists(src_path):
            dest_path = os.path.join(email_folder, os.path.basename(src_path))
            shutil.copy2(src_path, dest_path)
            copied_files.append(dest_path.replace(settings.MEDIA_ROOT, settings.MEDIA_URL))

    return JsonResponse({
        "success": True,
        "email": email,
        "copied": copied_files
    })