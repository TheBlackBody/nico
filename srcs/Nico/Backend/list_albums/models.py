from django.db import models

class AppSettings(models.Model):
    """Modèle pour stocker les paramètres globaux de l'application"""
    background_image_path = models.TextField(
        default='/backgroudNoel2.jpg',
        help_text="Chemin ou URL de l'image de fond global"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "App Settings"

    def __str__(self):
        return f"App Settings (updated: {self.updated_at})"

    @classmethod
    def get_settings(cls):
        """Récupère ou crée l'instance unique des paramètres"""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
