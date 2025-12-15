"""
Utility functions for bookings app.
"""
import logging
from datetime import date, datetime
from django.core.mail import send_mail  # pyright: ignore[reportMissingImports]
from django.conf import settings  # pyright: ignore[reportMissingImports]
from django.template.loader import render_to_string  # pyright: ignore[reportMissingImports]

logger = logging.getLogger('bookings')


def send_booking_confirmation_email(booking):
    """Send booking confirmation email to user."""
    try:
        if not settings.EMAIL_HOST_USER:
            logger.warning("Email not configured. Skipping email send.")
            return False

        subject = f'Booking Confirmation - {booking.booking_reference}'
        message = f"""
Dear {booking.passenger_name},

Your booking has been confirmed!

Booking Reference: {booking.booking_reference}
Bus: {booking.bus.bus_name} ({booking.bus.number})
Route: {booking.bus.origin} to {booking.bus.destination}
Seat: {booking.seat.seat_number}
Travel Date: {booking.travel_date}
Amount Paid: ₹{booking.amount_paid}

Thank you for choosing Safe Travels!

Best regards,
Safe Travels Team
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [booking.user.email],
            fail_silently=False,
        )
        logger.info(f"Booking confirmation email sent to {booking.user.email} for booking {booking.booking_reference}")
        return True
    except Exception as e:
        logger.error(f"Failed to send booking confirmation email: {str(e)}")
        return False


def send_payment_receipt_email(booking, payment):
    """Send payment receipt email."""
    try:
        if not settings.EMAIL_HOST_USER:
            logger.warning("Email not configured. Skipping email send.")
            return False

        subject = f'Payment Receipt - {booking.booking_reference}'
        message = f"""
Dear {booking.passenger_name},

Payment Receipt

Booking Reference: {booking.booking_reference}
Payment ID: {payment.payment_id}
Amount: ₹{payment.amount}
Payment Date: {payment.created_at.strftime("%Y-%m-%d %H:%M:%S")}

Thank you for your payment!

Best regards,
Safe Travels Team
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [booking.user.email],
            fail_silently=False,
        )
        logger.info(f"Payment receipt email sent to {booking.user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send payment receipt email: {str(e)}")
        return False


def send_cancellation_email(booking):
    """Send booking cancellation email."""
    try:
        if not settings.EMAIL_HOST_USER:
            logger.warning("Email not configured. Skipping email send.")
            return False

        subject = f'Booking Cancelled - {booking.booking_reference}'
        message = f"""
Dear {booking.passenger_name},

Your booking has been cancelled.

Booking Reference: {booking.booking_reference}
Cancellation Date: {booking.cancelled_at.strftime("%Y-%m-%d %H:%M:%S")}
Refund Amount: ₹{booking.amount_paid}

If you have any questions, please contact our support team.

Best regards,
Safe Travels Team
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [booking.user.email],
            fail_silently=False,
        )
        logger.info(f"Cancellation email sent to {booking.user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send cancellation email: {str(e)}")
        return False


def validate_travel_date(travel_date):
    """Validate that travel date is not in the past."""
    if travel_date < date.today():
        return False, "Travel date cannot be in the past"
    return True, None


def check_seat_availability_by_date(seat, travel_date):
    """Check if seat is available for a specific travel date."""
    from .models import Booking
    existing_booking = Booking.objects.filter(
        seat=seat,
        travel_date=travel_date,
        status='confirmed'
    ).exists()
    return not existing_booking

