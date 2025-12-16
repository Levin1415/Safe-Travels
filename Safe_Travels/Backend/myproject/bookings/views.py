import logging
from django.conf import settings  # pyright: ignore[reportMissingImports]
from django.contrib.auth import authenticate  # pyright: ignore[reportMissingImports]
from django.contrib.auth.models import User  # pyright: ignore[reportMissingImports]
from django.db import transaction  # pyright: ignore[reportMissingImports]
from django.utils import timezone  # pyright: ignore[reportMissingImports]
from django_filters.rest_framework import DjangoFilterBackend  # pyright: ignore[reportMissingImports]
from rest_framework import generics, status, filters  # pyright: ignore[reportMissingImports]
from rest_framework.authtoken.models import Token  # pyright: ignore[reportMissingImports]
from rest_framework.decorators import api_view, permission_classes  # pyright: ignore[reportMissingImports]
from rest_framework.permissions import IsAuthenticated  # pyright: ignore[reportMissingImports]
from rest_framework.response import Response  # pyright: ignore[reportMissingImports]
from rest_framework.views import APIView  # pyright: ignore[reportMissingImports]
from django_ratelimit.decorators import ratelimit  # pyright: ignore[reportMissingImports]
from django_ratelimit.core import is_ratelimited  # pyright: ignore[reportMissingImports]


import razorpay  # pyright: ignore[reportMissingImports]

from .models import Booking, Bus, Payment, Seat, Train, TrainSeat, Flight, FlightSeat
from .serializers import (
    BookingCancelSerializer,
    BookingCreateSerializer,
    BookingSerializer,
    BusSerializer,
    FlightSerializer,
    FlightSeatSerializer,
    PaymentOrderSerializer,
    PaymentSerializer,
    PaymentVerifySerializer,
    SeatSerializer,
    TrainSerializer,
    TrainSeatSerializer,
    UserRegisterSerializer,
)
from .utils import (
    check_seat_availability_by_date,
    send_booking_confirmation_email,
    send_cancellation_email,
    send_payment_receipt_email,
    validate_travel_date,
)

logger = logging.getLogger('bookings')


def get_razorpay_client():
    """Get Razorpay client instance. Raises ValueError if keys not configured."""
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise ValueError('Razorpay keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.')
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class Registerview(APIView):
    def post(self, request):
        # Rate limiting
        if is_ratelimited(
            request,
            key='ip',
            rate='5/m',
            method='POST',
            increment=True,
            group='register'   # ✅ FIX
        ):
            return Response(
                {'error': 'Too many registration attempts. Please try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        try:
            serializer = UserRegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                token, created = Token.objects.get_or_create(user=user)
                logger.info(f"New user registered: {user.username}")
                return Response({'token': token.key}, status=status.HTTP_201_CREATED)

            logger.warning(f"Registration failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return Response(
                {'error': 'Registration failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(APIView):
    def post(self, request):
        # Rate limiting
        if is_ratelimited(
            request,
            key='ip',
            rate='10/m',
            method='POST',
            increment=True,
            group='login'   # ✅ REQUIRED FIX
        ):
            return Response(
                {'error': 'Too many login attempts. Please try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        try:
            username = request.data.get('username')
            password = request.data.get('password')

            user = authenticate(username=username, password=password)

            if user:
                token, created = Token.objects.get_or_create(user=user)
                logger.info(f"User logged in: {user.username}")
                return Response(
                    {
                        'token': token.key,
                        'user_id': user.id
                    },
                    status=status.HTTP_200_OK
                )
            else:
                logger.warning(f"Failed login attempt for: {username}")
                return Response(
                    {'error': 'Invalid Credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response(
                {'error': 'Login failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BusListCreateView(generics.ListCreateAPIView):
    queryset = Bus.objects.all()
    serializer_class = BusSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['origin', 'destination']
    search_fields = ['bus_name', 'number', 'origin', 'destination', 'features']
    ordering_fields = ['price', 'start_time', 'bus_name']
    ordering = ['bus_name']
    
    def get_queryset(self):
        queryset = Bus.objects.all()
        # Filter by price range
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        return queryset


class TrainListCreateView(generics.ListCreateAPIView):
    queryset = Train.objects.all()
    serializer_class = TrainSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['origin', 'destination', 'train_type', 'coach_type']
    search_fields = ['train_name', 'train_number', 'origin', 'destination']
    ordering_fields = ['price', 'start_time', 'train_name']
    ordering = ['train_name']
    
    def get_queryset(self):
        queryset = Train.objects.all()
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        return queryset


class TrainDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Train.objects.all()
    serializer_class = TrainSerializer


class FlightListCreateView(generics.ListCreateAPIView):
    queryset = Flight.objects.all()
    serializer_class = FlightSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['origin', 'destination', 'class_type']
    search_fields = ['airline_name', 'flight_number', 'origin', 'destination']
    ordering_fields = ['price', 'departure_time', 'airline_name']
    ordering = ['airline_name']
    
    def get_queryset(self):
        queryset = Flight.objects.all()
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        return queryset


class FlightDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Flight.objects.all()
    serializer_class = FlightSerializer


class BusDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Bus.objects.all()
    serializer_class = BusSerializer


class BookingView(APIView):
    """Legacy booking endpoint - kept for backward compatibility but not used in payment flow."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        seat = Seat.objects.get(pk=serializer.validated_data['seat_id'])

        try:
            with transaction.atomic():
                seat_locked = Seat.objects.select_for_update().get(pk=seat.pk)
                if seat_locked.is_booked:
                    return Response({'error': 'Seat already booked'}, status=status.HTTP_400_BAD_REQUEST)

                seat_locked.is_booked = True
                seat_locked.save()

                booking = Booking.objects.create(
                    user=request.user,
                    bus=seat_locked.bus,
                    seat=seat_locked,
                    travel_date=serializer.validated_data['travel_date'],
                    passenger_name=serializer.validated_data['passenger_name'],
                    passenger_age=serializer.validated_data['passenger_age'],
                    passenger_sex=serializer.validated_data['passenger_sex'],
                    amount_paid=seat_locked.bus.price,
                )

            out_serializer = BookingSerializer(booking)
            return Response(out_serializer.data, status=status.HTTP_201_CREATED)

        except Seat.DoesNotExist:
            return Response({'error': 'Invalid Seat ID'}, status=status.HTTP_400_BAD_REQUEST)


class PaymentOrderView(APIView):
    """Create a Razorpay payment order. Seat is NOT booked yet - only after payment verification."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PaymentOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        booking_type = serializer.validated_data['booking_type']
        transport_id = serializer.validated_data['transport_id']
        seat_id = serializer.validated_data.get('seat_id')

        # Get transport and calculate amount
        if booking_type == 'bus':
            transport = Bus.objects.get(id=transport_id)
            seat = Seat.objects.select_related('bus').get(id=seat_id)
            if seat.is_booked:
                return Response({'error': 'Seat already booked'}, status=status.HTTP_400_BAD_REQUEST)
            amount = transport.price
            transport_name = transport.bus_name
            seat_data = SeatSerializer(seat).data
        
        elif booking_type == 'train':
            transport = Train.objects.get(id=transport_id)
            # For trains, we'll allocate seat after payment, so no seat_id needed now
            amount = transport.price
            transport_name = transport.train_name
            seat_data = None  # Will be allocated after payment
        
        elif booking_type == 'flight':
            transport = Flight.objects.get(id=transport_id)
            seat = FlightSeat.objects.select_related('flight').get(id=seat_id)
            if seat.is_booked:
                return Response({'error': 'Seat already booked'}, status=status.HTTP_400_BAD_REQUEST)
            amount = transport.price
            transport_name = transport.airline_name
            seat_data = FlightSeatSerializer(seat).data

        amount_paise = int(amount * 100)  # Razorpay expects amount in paise

        try:
            client = get_razorpay_client()
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception:
            return Response({'error': 'Payment gateway is not available right now.'}, status=status.HTTP_502_BAD_GATEWAY)

        try:
            # Create Razorpay order
            order = client.order.create({
                'amount': amount_paise,
                'currency': 'INR',
                'payment_capture': 1,  # Auto-capture payment
                'notes': {
                    'booking_type': booking_type,
                    'transport': transport_name,
                    'user': request.user.username,
                    'passenger_name': serializer.validated_data['passenger_name'],
                }
            })
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {str(e)}")
            return Response({'error': 'Failed to create payment order. Please try again later.'}, status=status.HTTP_502_BAD_GATEWAY)

        # Create Payment record
        payment_data = {
            'user': request.user,
            'booking_type': booking_type,
            'amount': amount,
            'order_id': order['id'],
            'currency': order['currency'],
            'status': 'created',
        }
        
        if booking_type == 'bus':
            payment_data['bus'] = transport
            payment_data['seat'] = seat
        elif booking_type == 'train':
            payment_data['train'] = transport
        elif booking_type == 'flight':
            payment_data['flight'] = transport
            payment_data['flight_seat'] = seat

        payment = Payment.objects.create(**payment_data)

        response_data = {
            'order_id': order['id'],
            'amount': order['amount'],
            'currency': order['currency'],
            'key_id': settings.RAZORPAY_KEY_ID,
            'booking_type': booking_type,
        }
        
        if seat_data:
            response_data['seat'] = seat_data

        return Response(response_data, status=status.HTTP_201_CREATED)


class PaymentVerifyView(APIView):
    """Verify Razorpay payment and create booking only if payment is successful."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        try:
            client = get_razorpay_client()
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception:
            return Response({'error': 'Payment gateway is not available right now.'}, status=status.HTTP_502_BAD_GATEWAY)

        # Verify payment signature
        try:
            client.utility.verify_payment_signature({
                'razorpay_order_id': data['order_id'],
                'razorpay_payment_id': data['payment_id'],
                'razorpay_signature': data['signature'],
            })
        except razorpay.errors.SignatureVerificationError:
            # Mark payment as failed
            payment = Payment.objects.filter(order_id=data['order_id']).first()
            if payment:
                payment.status = 'failed'
                payment.save(update_fields=['status'])
            return Response({'error': 'Payment verification failed'}, status=status.HTTP_400_BAD_REQUEST)

        # Payment verified - now create booking
        try:
            with transaction.atomic():
                # Lock payment to prevent race conditions
                payment = Payment.objects.select_for_update().get(order_id=data['order_id'])
                
                # Check if payment was already processed
                if payment.status == 'paid':
                    return Response({'error': 'Payment already processed'}, status=status.HTTP_400_BAD_REQUEST)

                booking_type = data['booking_type']
                transport_id = data['transport_id']
                seat_id = data.get('seat_id')

                # Handle different booking types
                if booking_type == 'bus':
                    seat = Seat.objects.select_for_update().get(id=seat_id)
                    if seat.is_booked:
                        payment.status = 'failed'
                        payment.save(update_fields=['status'])
                        return Response({'error': 'Seat already booked by another user'}, status=status.HTTP_400_BAD_REQUEST)
                    seat.is_booked = True
                    seat.save()
                    
                    booking = Booking.objects.create(
                        user=request.user,
                        booking_type='bus',
                        bus=seat.bus,
                        seat=seat,
                        travel_date=data['travel_date'],
                        passenger_name=data['passenger_name'],
                        passenger_age=data['passenger_age'],
                        passenger_sex=data['passenger_sex'],
                        amount_paid=payment.amount,
                    )
                
                elif booking_type == 'train':
                    # Auto-allocate a seat for train
                    train = Train.objects.get(id=transport_id)
                    available_seat = TrainSeat.objects.select_for_update().filter(
                        train=train,
                        is_booked=False
                    ).first()
                    
                    if not available_seat:
                        payment.status = 'failed'
                        payment.save(update_fields=['status'])
                        return Response({'error': 'No seats available on this train'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    available_seat.is_booked = True
                    available_seat.save()
                    
                    booking = Booking.objects.create(
                        user=request.user,
                        booking_type='train',
                        train=train,
                        train_seat=available_seat,
                        travel_date=data['travel_date'],
                        passenger_name=data['passenger_name'],
                        passenger_age=data['passenger_age'],
                        passenger_sex=data['passenger_sex'],
                        amount_paid=payment.amount,
                    )
                    
                    # Update payment with allocated seat
                    payment.train_seat = available_seat
                
                elif booking_type == 'flight':
                    seat = FlightSeat.objects.select_for_update().get(id=seat_id)
                    if seat.is_booked:
                        payment.status = 'failed'
                        payment.save(update_fields=['status'])
                        return Response({'error': 'Seat already booked by another user'}, status=status.HTTP_400_BAD_REQUEST)
                    seat.is_booked = True
                    seat.save()
                    
                    booking = Booking.objects.create(
                        user=request.user,
                        booking_type='flight',
                        flight=seat.flight,
                        flight_seat=seat,
                        travel_date=data['travel_date'],
                        passenger_name=data['passenger_name'],
                        passenger_age=data['passenger_age'],
                        passenger_sex=data['passenger_sex'],
                        amount_paid=payment.amount,
                    )

                # Update payment record
                payment.payment_id = data['payment_id']
                payment.signature = data['signature']
                payment.status = 'paid'
                payment.booking = booking
                payment.save()

        except Payment.DoesNotExist:
            logger.error(f"Payment order not found: {data['order_id']}")
            return Response({'error': 'Payment order not found'}, status=status.HTTP_404_NOT_FOUND)
        except (Seat.DoesNotExist, TrainSeat.DoesNotExist, FlightSeat.DoesNotExist) as e:
            logger.error(f"Seat not found: {str(e)}")
            return Response({'error': 'Invalid seat'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Payment verification error: {str(e)}")
            return Response({'error': f'Failed to complete booking: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Send confirmation emails
        try:
            send_booking_confirmation_email(booking)
            send_payment_receipt_email(booking, payment)
        except Exception as e:
            logger.warning(f"Failed to send confirmation emails: {str(e)}")
            # Don't fail the request if email fails

        logger.info(f"Booking created successfully: {booking.booking_reference}")

        # Return booking details
        response_data = BookingSerializer(booking).data
        response_data['payment'] = PaymentSerializer(payment).data
        return Response(response_data, status=status.HTTP_200_OK)


class UserBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        if request.user.id != user_id:
            return Response({'error': 'unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Filter by status if provided
        status_filter = request.query_params.get('status', None)
        bookings = Booking.objects.filter(user_id=user_id)
        
        if status_filter:
            bookings = bookings.filter(status=status_filter)
        
        # Pagination
        page_size = int(request.query_params.get('page_size', 10))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        
        total = bookings.count()
        bookings_page = bookings[start:end]
        
        serializer = BookingSerializer(bookings_page, many=True)
        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'results': serializer.data
        })


class BookingCancelView(APIView):
    """Cancel a booking and process refund if applicable."""
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
            
            if booking.status == 'cancelled':
                return Response({'error': 'Booking is already cancelled'}, status=status.HTTP_400_BAD_REQUEST)
            
            if booking.status == 'completed':
                return Response({'error': 'Cannot cancel a completed booking'}, status=status.HTTP_400_BAD_REQUEST)

            serializer = BookingCancelSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            with transaction.atomic():
                # Cancel booking
                booking.status = 'cancelled'
                booking.cancellation_reason = serializer.validated_data.get('cancellation_reason', '')
                booking.cancelled_at = timezone.now()
                booking.save()

                # Free up the seat based on booking type
                if booking.booking_type == 'bus' and booking.seat:
                    booking.seat.is_booked = False
                    booking.seat.save()
                elif booking.booking_type == 'train' and booking.train_seat:
                    booking.train_seat.is_booked = False
                    booking.train_seat.save()
                elif booking.booking_type == 'flight' and booking.flight_seat:
                    booking.flight_seat.is_booked = False
                    booking.flight_seat.save()

                # Process refund if payment exists
                payment = Payment.objects.filter(booking=booking, status='paid').first()
                if payment:
                    try:
                        client = get_razorpay_client()
                        # Create refund (full refund)
                        refund = client.payment.refund(payment.payment_id, {
                            'amount': int(payment.amount * 100),  # Amount in paise
                            'notes': {
                                'reason': 'Booking cancelled',
                                'booking_reference': booking.booking_reference
                            }
                        })
                        
                        payment.status = 'refunded'
                        payment.refund_id = refund['id']
                        payment.refund_amount = payment.amount
                        payment.refunded_at = timezone.now()
                        payment.save()
                        
                        logger.info(f"Refund processed for booking {booking.booking_reference}: {refund['id']}")
                    except Exception as refund_error:
                        logger.error(f"Refund failed for booking {booking.booking_reference}: {str(refund_error)}")
                        # Continue with cancellation even if refund fails

            # Send cancellation email
            try:
                send_cancellation_email(booking)
            except Exception as e:
                logger.warning(f"Failed to send cancellation email: {str(e)}")

            logger.info(f"Booking cancelled: {booking.booking_reference}")
            serializer = BookingSerializer(booking)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Booking cancellation error: {str(e)}")
            return Response({'error': f'Failed to cancel booking: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
