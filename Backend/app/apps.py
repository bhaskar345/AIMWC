import os
from .startup import ensure_model
from django.apps import AppConfig


class AppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app'

    def ready(self):
        if os.environ.get("RUN_MAIN") != "true":
            return

        ensure_model()