from datetime import date
from django.contrib.auth.models import User  # pyright: ignore[reportMissingImports]
from rest_framework import serializers  # pyright: ignore[reportMissingImports]

from .models import Booking, Bus, Payment, Seat, Train, TrainSeat, Flight, FlightSeat
from .utils import validate_travel_date, check_seat_availability_by_date


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password',]

    def create(self, validate_data):
        user = User.objects.create_user(
            username=validate_data['username'],
            email=validate_data['email'],
            password=validate_data['password']
        )
        return user


class SeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seat
        fields = ['id', 'seat_number', 'is_booked']


class BusSerializer(serializers.ModelSerializer):
    seats = SeatSerializer(many=True, read_only=True)

    class Meta:
        model = Bus
        fields = '__all__'


class TrainSeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainSeat
        fields = ['id', 'seat_number', 'coach_number', 'is_booked']


class TrainSerializer(serializers.ModelSerializer):
    seats = TrainSeatSerializer(many=True, read_only=True)

    class Meta:
        model = Train
        fields = '__all__'


class FlightSeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlightSeat
        fields = ['id', 'seat_number', 'is_booked']


class FlightSerializer(serializers.ModelSerializer):
    seats = FlightSeatSerializer(many=True, read_only=True)

    class Meta:
        model = Flight
        fields = '__all__'


class BookingSerializer(serializers.ModelSerializer):
    bus = BusSerializer(read_only=True)
    train = TrainSerializer(read_only=True)
    flight = FlightSerializer(read_only=True)
    seat = SeatSerializer(read_only=True)
    train_seat = TrainSeatSerializer(read_only=True)
    flight_seat = FlightSeatSerializer(read_only=True)
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['user', 'booking_time', 'bus', 'train', 'flight', 'seat', 'train_seat', 'flight_seat']


class BookingCreateSerializer(serializers.Serializer):
    seat_id = serializers.IntegerField()
    travel_date = serializers.DateField()
    passenger_name = serializers.CharField(max_length=100)
    passenger_age = serializers.IntegerField(min_value=1, max_value=120)
    passenger_sex = serializers.ChoiceField(choices=['male', 'female', 'other'])

    def validate_seat_id(self, value):
        try:
            seat = Seat.objects.select_related('bus').get(id=value)
        except Seat.DoesNotExist as exc:
            raise serializers.ValidationError('Invalid seat selected') from exc

        if seat.is_booked:
            raise serializers.ValidationError('Seat already booked')
        return value

    def get_seat(self):
        seat_id = self.validated_data['seat_id']
        return Seat.objects.select_related('bus').get(id=seat_id)


class PaymentOrderSerializer(serializers.Serializer):
    """Serializer for creating a Razorpay payment order."""
    booking_type = serializers.ChoiceField(choices=['bus', 'train', 'flight'])
    transport_id = serializers.IntegerField()  # bus_id, train_id, or flight_id
    seat_id = serializers.IntegerField(required=False)  # Not required for trains (auto-allocated)
    travel_date = serializers.DateField()
    passenger_name = serializers.CharField(max_length=100)
    passenger_age = serializers.IntegerField(min_value=1, max_value=120)
    passenger_sex = serializers.ChoiceField(choices=['male', 'female', 'other'])

    def validate_travel_date(self, value):
        """Validate travel date is not in the past."""
        is_valid, error_msg = validate_travel_date(value)
        if not is_valid:
            raise serializers.ValidationError(error_msg)
        return value

    def validate(self, attrs):
        """Validate transport and seat availability."""
        booking_type = attrs['booking_type']
        transport_id = attrs['transport_id']
        travel_date = attrs['travel_date']
        seat_id = attrs.get('seat_id')

        if booking_type == 'bus':
            if not seat_id:
                raise serializers.ValidationError({'seat_id': 'Seat selection is required for bus booking'})
            try:
                seat = Seat.objects.select_related('bus').get(id=seat_id)
                if seat.bus.id != transport_id:
                    raise serializers.ValidationError({'transport_id': 'Seat does not belong to this bus'})
                if seat.is_booked:
                    raise serializers.ValidationError({'seat_id': 'Seat already booked'})
                if not check_seat_availability_by_date(seat, travel_date):
                    raise serializers.ValidationError({'seat_id': 'Seat is not available for the selected travel date'})
            except Seat.DoesNotExist:
                raise serializers.ValidationError({'seat_id': 'Invalid seat selected'})
        
        elif booking_type == 'train':
            # For trains, we'll auto-allocate a seat, so no seat_id needed
            try:
                train = Train.objects.get(id=transport_id)
                # Check if any seat is available
                available_seats = TrainSeat.objects.filter(train=train, is_booked=False).count()
                if available_seats == 0:
                    raise serializers.ValidationError({'transport_id': 'No seats available on this train'})
            except Train.DoesNotExist:
                raise serializers.ValidationError({'transport_id': 'Invalid train selected'})
        
        elif booking_type == 'flight':
            if not seat_id:
                raise serializers.ValidationError({'seat_id': 'Seat selection is required for flight booking'})
            try:
                seat = FlightSeat.objects.select_related('flight').get(id=seat_id)
                if seat.flight.id != transport_id:
                    raise serializers.ValidationError({'transport_id': 'Seat does not belong to this flight'})
                if seat.is_booked:
                    raise serializers.ValidationError({'seat_id': 'Seat already booked'})
                # Check availability by date for flights
                from .models import Booking
                existing_booking = Booking.objects.filter(
                    flight_seat=seat,
                    travel_date=travel_date,
                    status='confirmed'
                ).exists()
                if existing_booking:
                    raise serializers.ValidationError({'seat_id': 'Seat is not available for the selected travel date'})
            except FlightSeat.DoesNotExist:
                raise serializers.ValidationError({'seat_id': 'Invalid seat selected'})
        
        return attrs


class PaymentVerifySerializer(serializers.Serializer):
    """Serializer for verifying Razorpay payment."""
    order_id = serializers.CharField()
    payment_id = serializers.CharField()
    signature = serializers.CharField()
    booking_type = serializers.ChoiceField(choices=['bus', 'train', 'flight'])
    transport_id = serializers.IntegerField()
    seat_id = serializers.IntegerField(required=False)  # Not required for trains
    travel_date = serializers.DateField()
    passenger_name = serializers.CharField(max_length=100)
    passenger_age = serializers.IntegerField(min_value=1, max_value=120)
    passenger_sex = serializers.ChoiceField(choices=['male', 'female', 'other'])

    def validate_travel_date(self, value):
        """Validate travel date is not in the past."""
        is_valid, error_msg = validate_travel_date(value)
        if not is_valid:
            raise serializers.ValidationError(error_msg)
        return value


class BookingCancelSerializer(serializers.Serializer):
    """Serializer for cancelling a booking."""
    cancellation_reason = serializers.CharField(max_length=500, required=False, allow_blank=True)


class PaymentSerializer(serializers.ModelSerializer):
    booking = BookingSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['order_id', 'status', 'user', 'bus', 'seat', 'amount', 'currency', 'created_at', 'updated_at']


