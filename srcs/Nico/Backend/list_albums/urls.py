from django.urls import path
# AJOUT de 'impress_archives' dans l'import ci-dessous :
from .views import (
    create_client_folder, 
    list_albums, 
    mail_archives, 
    impress_archives,
    confirm_cart, 
    upload_images, 
    send_email_images, 
    replace_image, 
    apply_image_edits, 
    validate_image, 
    get_app_settings, 
    update_app_settings, 
    archive_print_images,
    send_uploaded_files_direct
)

urlpatterns = [
    path("liste/", list_albums, name="list_albums"),
    path("create-client/", create_client_folder, name="create_client_folder"),
    path('confirm-cart/', confirm_cart, name='confirm_cart'),
    path('upload/', upload_images, name='upload_images'),
    path('send-email/', send_email_images, name='send_email_images'),

    path('send-video/', send_uploaded_files_direct, name='send_uploaded_files_direct'),
    
    # On garde bien la fonction originale ici :
    path('impress-archives/', impress_archives, name='impress_archives'),
    
    path('mail-archives/', mail_archives, name='mail_archives'),
    path('archive-print/', archive_print_images, name='archive_print_images'),
    path('replace-image/', replace_image, name='replace_image'),
    path('apply-edits/', apply_image_edits, name='apply_image_edits'),
    path('validate/', validate_image, name='validate_image'),
    path('app-settings/', get_app_settings, name='get_app_settings'),
    path('app-settings/update/', update_app_settings, name='update_app_settings'),
]