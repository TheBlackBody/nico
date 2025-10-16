from django.urls import path
from .views import create_client_folder, list_albums, confirm_cart

urlpatterns = [
    path("liste/", list_albums, name="list_albums"),
    path("create-client/", create_client_folder, name="create_client_folder"),
    path('confirm-cart/', confirm_cart, name='confirm_cart'),
]
