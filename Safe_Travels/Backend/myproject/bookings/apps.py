from django.apps import AppConfig  # pyright: ignore[reportMissingImports]


class BookingsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'bookings'

    def ready(self):
        import bookings.signals
