from django.db import models  # pyright: ignore[reportMissingImports]
from django.contrib.auth.models import User  # pyright: ignore[reportMissingImports]


class Bus(models.Model):
    bus_name = models.CharField(max_length=100)
    number = models.CharField(max_length=20, unique=True)
    origin = models.CharField(max_length=50)
    destination = models.CharField(max_length=50)
    features = models.TextField()
    start_time = models.TimeField()
    reach_time = models.TimeField()
    no_of_seats = models.PositiveBigIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.bus_name} {self.number} {self.origin} {self.destination}"


class Train(models.Model):
    train_name = models.CharField(max_length=100)
    train_number = models.CharField(max_length=20, unique=True)
    origin = models.CharField(max_length=50)
    destination = models.CharField(max_length=50)
    train_type = models.CharField(max_length=50)  # Express, Superfast, etc.
    start_time = models.TimeField()
    reach_time = models.TimeField()
    no_of_seats = models.PositiveBigIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    coach_type = models.CharField(max_length=50, default='Sleeper')  # Sleeper, AC, etc.

    def __str__(self):
        return f"{self.train_name} {self.train_number} {self.origin} {self.destination}"


class Flight(models.Model):
    airline_name = models.CharField(max_length=100)
    flight_number = models.CharField(max_length=20, unique=True)
    origin = models.CharField(max_length=50)
    destination = models.CharField(max_length=50)
    aircraft_type = models.CharField(max_length=50, blank=True)
    departure_time = models.TimeField()
    arrival_time = models.TimeField()
    no_of_seats = models.PositiveBigIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    class_type = models.CharField(max_length=50, default='Economy')  # Economy, Business, First

    def __str__(self):
        return f"{self.airline_name} {self.flight_number} {self.origin} {self.destination}"


class Seat(models.Model):
    """Seat for Bus"""
    bus = models.ForeignKey('Bus', on_delete=models.CASCADE, related_name='seats')
    seat_number = models.CharField(max_length=10)
    is_booked = models.BooleanField(default=False, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['bus', 'is_booked']),
        ]

    def __str__(self):
        return f"{self.bus} {self.seat_number}"


class TrainSeat(models.Model):
    """Seat for Train - auto-allocated, no user selection"""
    train = models.ForeignKey('Train', on_delete=models.CASCADE, related_name='seats')
    seat_number = models.CharField(max_length=10)
    coach_number = models.CharField(max_length=10, default='S1')
    is_booked = models.BooleanField(default=False, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['train', 'is_booked']),
        ]

    def __str__(self):
        return f"{self.train} {self.coach_number}-{self.seat_number}"


class FlightSeat(models.Model):
    """Seat for Flight"""
    flight = models.ForeignKey('Flight', on_delete=models.CASCADE, related_name='seats')
    seat_number = models.CharField(max_length=10)
    is_booked = models.BooleanField(default=False, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['flight', 'is_booked']),
        ]

    def __str__(self):
        return f"{self.flight} {self.seat_number}"


class Booking(models.Model):
    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    BOOKING_TYPE_CHOICES = [
        ('bus', 'Bus'),
        ('train', 'Train'),
        ('flight', 'Flight'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, db_index=True)
    booking_type = models.CharField(max_length=10, choices=BOOKING_TYPE_CHOICES, default='bus', db_index=True)
    
    # Transport references (only one will be set)
    bus = models.ForeignKey(Bus, on_delete=models.CASCADE, null=True, blank=True)
    train = models.ForeignKey('Train', on_delete=models.CASCADE, null=True, blank=True)
    flight = models.ForeignKey('Flight', on_delete=models.CASCADE, null=True, blank=True)
    
    # Seat references (only one will be set)
    seat = models.ForeignKey(Seat, on_delete=models.CASCADE, null=True, blank=True)  # For bus
    train_seat = models.ForeignKey('TrainSeat', on_delete=models.CASCADE, null=True, blank=True)  # For train
    flight_seat = models.ForeignKey('FlightSeat', on_delete=models.CASCADE, null=True, blank=True)  # For flight
    
    booking_time = models.DateTimeField(auto_now_add=True, db_index=True)
    travel_date = models.DateField(null=True, blank=True, db_index=True)
    passenger_name = models.CharField(max_length=100, blank=True)
    passenger_age = models.PositiveIntegerField(null=True, blank=True)
    passenger_sex = models.CharField(max_length=20, blank=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed', db_index=True)
    cancellation_reason = models.TextField(blank=True, null=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    booking_reference = models.CharField(max_length=20, unique=True, null=True, blank=True)

    class Meta:
        ordering = ['-booking_time']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['travel_date', 'status']),
            models.Index(fields=['booking_type', 'status']),
        ]

    def __str__(self):
        if self.booking_type == 'bus':
            return f"{self.user.username}-{self.bus.bus_name}-{self.seat.seat_number if self.seat else 'N/A'}"
        elif self.booking_type == 'train':
            return f"{self.user.username}-{self.train.train_name}-{self.train_seat.seat_number if self.train_seat else 'N/A'}"
        elif self.booking_type == 'flight':
            return f"{self.user.username}-{self.flight.airline_name}-{self.flight_seat.seat_number if self.flight_seat else 'N/A'}"
        return f"{self.user.username}-Booking-{self.booking_reference}"

    def get_transport(self):
        """Get the transport object (bus, train, or flight)"""
        if self.booking_type == 'bus':
            return self.bus
        elif self.booking_type == 'train':
            return self.train
        elif self.booking_type == 'flight':
            return self.flight
        return None

    def get_seat(self):
        """Get the seat object"""
        if self.booking_type == 'bus':
            return self.seat
        elif self.booking_type == 'train':
            return self.train_seat
        elif self.booking_type == 'flight':
            return self.flight_seat
        return None

    def save(self, *args, **kwargs):
        if not self.booking_reference:
            import random
            import string
            self.booking_reference = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
        super().save(*args, **kwargs)


class Payment(models.Model):
    STATUS_CHOICES = [
        ('created', 'Created'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, db_index=True)
    booking_type = models.CharField(max_length=10, default='bus', db_index=True)
    
    # Transport references
    bus = models.ForeignKey(Bus, on_delete=models.CASCADE, null=True, blank=True)
    train = models.ForeignKey('Train', on_delete=models.CASCADE, null=True, blank=True)
    flight = models.ForeignKey('Flight', on_delete=models.CASCADE, null=True, blank=True)
    
    # Seat references
    seat = models.ForeignKey(Seat, on_delete=models.CASCADE, null=True, blank=True)
    train_seat = models.ForeignKey('TrainSeat', on_delete=models.CASCADE, null=True, blank=True)
    flight_seat = models.ForeignKey('FlightSeat', on_delete=models.CASCADE, null=True, blank=True)
    
    booking = models.OneToOneField(Booking, null=True, blank=True, on_delete=models.SET_NULL, related_name='payment')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=5, default='INR')
    order_id = models.CharField(max_length=100, unique=True, db_index=True)
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    signature = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created', db_index=True)
    refund_id = models.CharField(max_length=100, blank=True, null=True)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.order_id} - {self.status}"

