from django.apps import AppConfig


class PropertiesConfig(AppConfig):
    name = "properties"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self) -> None:
        import properties.signals  # noqa: F401
