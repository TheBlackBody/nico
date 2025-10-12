from django.urls import path
from .views import create_client_folder, list_albums

urlpatterns = [
    path("liste/", list_albums, name="list_albums"),
    path("create-client/", create_client_folder, name="create_client_folder"),
]
