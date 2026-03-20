import os, threading
from .startup import download_models_if_needed
from django.apps import AppConfig


class AppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app'

    def ready(self):
        if os.environ.get("RUN_MAIN") != "true":
            return

        threading.Thread(target=download_models_if_needed).start()