from django.db.models.signals import post_save  # pyright: ignore[reportMissingImports]
from django.dispatch import receiver  # pyright: ignore[reportMissingImports]
from .models import Bus, Seat, Train, TrainSeat, Flight, FlightSeat

@receiver(post_save, sender=Bus)
def create_seats_for_bus(sender, instance, created, **kwargs):
    if created:
        for i in range(1, instance.no_of_seats + 1):
            Seat.objects.create(bus=instance, seat_number=f"S{i}")


@receiver(post_save, sender=Train)
def create_seats_for_train(sender, instance, created, **kwargs):
    if created:
        # Create seats with coach numbers (e.g., S1-1, S1-2, S2-1, etc.)
        seats_per_coach = 72  # Standard train coach capacity
        num_coaches = (instance.no_of_seats + seats_per_coach - 1) // seats_per_coach
        
        seat_counter = 1
        for coach_num in range(1, num_coaches + 1):
            coach_id = f"S{coach_num}"
            for seat_in_coach in range(1, min(seats_per_coach + 1, instance.no_of_seats - seat_counter + 2)):
                if seat_counter > instance.no_of_seats:
                    break
                TrainSeat.objects.create(
                    train=instance,
                    coach_number=coach_id,
                    seat_number=f"{seat_in_coach}"
                )
                seat_counter += 1


@receiver(post_save, sender=Flight)
def create_seats_for_flight(sender, instance, created, **kwargs):
    if created:
        # Create seats with row and letter (e.g., 1A, 1B, 2A, etc.)
        seats_per_row = 6  
        num_rows = (instance.no_of_seats + seats_per_row - 1) // seats_per_row
        seat_letters = ['A', 'B', 'C', 'D', 'E', 'F']
        
        seat_counter = 1
        for row in range(1, num_rows + 1):
            for letter in seat_letters:
                if seat_counter > instance.no_of_seats:
                    break
                FlightSeat.objects.create(
                    flight=instance,
                    seat_number=f"{row}{letter}"
                )
                seat_counter += 1