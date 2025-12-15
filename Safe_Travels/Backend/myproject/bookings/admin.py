from django.contrib import admin  # pyright: ignore[reportMissingImports]
from .models import Bus, Seat, Booking, Train, TrainSeat, Flight, FlightSeat, Payment

# Register your models here.

class BusAdmin(admin.ModelAdmin):
    list_display = ('bus_name', 'number', 'origin', 'destination', 'price', 'start_time')
    list_filter = ('origin', 'destination')
    search_fields = ('bus_name', 'number', 'origin', 'destination')

class SeatAdmin(admin.ModelAdmin):
    list_display = ('seat_number', 'bus', 'is_booked')
    list_filter = ('is_booked', 'bus')
    search_fields = ('seat_number', 'bus__bus_name')

class TrainAdmin(admin.ModelAdmin):
    list_display = ('train_name', 'train_number', 'origin', 'destination', 'train_type', 'coach_type', 'price', 'start_time')
    list_filter = ('origin', 'destination', 'train_type', 'coach_type')
    search_fields = ('train_name', 'train_number', 'origin', 'destination')

class TrainSeatAdmin(admin.ModelAdmin):
    list_display = ('seat_number', 'coach_number', 'train', 'is_booked')
    list_filter = ('is_booked', 'train', 'coach_number')
    search_fields = ('seat_number', 'coach_number', 'train__train_name')

class FlightAdmin(admin.ModelAdmin):
    list_display = ('airline_name', 'flight_number', 'origin', 'destination', 'class_type', 'price', 'departure_time')
    list_filter = ('origin', 'destination', 'class_type')
    search_fields = ('airline_name', 'flight_number', 'origin', 'destination')

class FlightSeatAdmin(admin.ModelAdmin):
    list_display = ('seat_number', 'flight', 'is_booked')
    list_filter = ('is_booked', 'flight')
    search_fields = ('seat_number', 'flight__airline_name')

class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'booking_type', 'booking_reference', 'travel_date', 'passenger_name', 'status', 'amount_paid', 'booking_time')
    list_filter = ('booking_type', 'status', 'travel_date', 'booking_time')
    search_fields = ('user__username', 'booking_reference', 'passenger_name')
    readonly_fields = ('booking_reference', 'booking_time')
    
    def get_transport_display(self, obj):
        """Display transport name based on booking type"""
        if obj.booking_type == 'bus' and obj.bus:
            return f"{obj.bus.bus_name} ({obj.bus.number})"
        elif obj.booking_type == 'train' and obj.train:
            return f"{obj.train.train_name} ({obj.train.train_number})"
        elif obj.booking_type == 'flight' and obj.flight:
            return f"{obj.flight.airline_name} ({obj.flight.flight_number})"
        return 'N/A'
    get_transport_display.short_description = 'Transport'

class PaymentAdmin(admin.ModelAdmin):
    list_display = ('user', 'booking_type', 'order_id', 'amount', 'status', 'payment_id', 'created_at')
    list_filter = ('booking_type', 'status', 'created_at')
    search_fields = ('user__username', 'order_id', 'payment_id')
    readonly_fields = ('order_id', 'created_at', 'updated_at')

admin.site.register(Bus, BusAdmin)
admin.site.register(Seat, SeatAdmin)
admin.site.register(Train, TrainAdmin)
admin.site.register(TrainSeat, TrainSeatAdmin)
admin.site.register(Flight, FlightAdmin)
admin.site.register(FlightSeat, FlightSeatAdmin)
admin.site.register(Booking, BookingAdmin)
admin.site.register(Payment, PaymentAdmin)