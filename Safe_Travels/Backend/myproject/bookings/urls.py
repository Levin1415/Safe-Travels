from django.urls import path  # pyright: ignore[reportMissingImports]

from .views import (
    BookingCancelView,
    BookingView,
    BusDetailView,
    BusListCreateView,
    FlightDetailView,
    FlightListCreateView,
    LoginView,
    PaymentOrderView,
    PaymentVerifyView,
    Registerview,
    TrainDetailView,
    TrainListCreateView,
    UserBookingView,
)

urlpatterns = [
    path('buses/', BusListCreateView.as_view(), name='buslist'),
    path('buses/<int:pk>/', BusDetailView.as_view(), name='bus-detail'),
    path('trains/', TrainListCreateView.as_view(), name='trainlist'),
    path('trains/<int:pk>/', TrainDetailView.as_view(), name='train-detail'),
    path('flights/', FlightListCreateView.as_view(), name='flightlist'),
    path('flights/<int:pk>/', FlightDetailView.as_view(), name='flight-detail'),
    path('register/', Registerview.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('user/<int:user_id>/bookings/', UserBookingView.as_view(), name='user-bookings'),
    path('booking/', BookingView.as_view(), name='bookings'),
    path('booking/<int:booking_id>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
    path('payments/create-order/', PaymentOrderView.as_view(), name='payment-order'),
    path('payments/verify/', PaymentVerifyView.as_view(), name='payment-verify'),
]
