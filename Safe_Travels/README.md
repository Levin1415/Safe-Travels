# Safe Travels - Multi-Transport Booking System

A comprehensive booking platform for Buses, Trains, and Flights with integrated Razorpay payment gateway.

## Features

- 🚌 **Bus Booking** - Select seats and book bus tickets
- 🚂 **Train Booking** - Auto-allocated seat booking
- ✈️ **Flight Booking** - Select seats and book flight tickets
- 💳 **Payment Integration** - Razorpay payment gateway
- 📧 **Email Notifications** - Booking confirmations and receipts
- 🔐 **User Authentication** - Token-based authentication
- 📱 **Responsive UI** - Modern React frontend with Tailwind CSS
- 🎫 **Booking Management** - View and manage all bookings

## Tech Stack

### Backend
- Django 5.2.6
- Django REST Framework
- SQLite (development)
- Razorpay SDK
- Python 3.x

### Frontend
- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- React Hot Toast

## Project Structure

```
Safe-Travels/
├── Backend/
│   └── myproject/
│       ├── bookings/          # Main app
│       │   ├── models.py      # Bus, Train, Flight, Booking, Payment models
│       │   ├── views.py       # API views
│       │   ├── serializers.py # DRF serializers
│       │   ├── urls.py        # URL routing
│       │   └── admin.py       # Django admin
│       └── myproject/
│           └── settings.py    # Django settings
└── Frontend/
    └── Travel/
        └── src/
            ├── components/    # React components
            └── App.jsx        # Main app component
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd Safe_Travels/Backend/myproject
```

2. Create virtual environment:
```bash
python -m venv .venv
```

3. Activate virtual environment:
```bash
# Windows
.\.venv\Scripts\Activate.ps1

# Linux/Mac
source .venv/bin/activate
```

4. Install dependencies:
```bash
pip install Django==5.2.6 djangorestframework django-cors-headers python-dotenv razorpay django-filter django-ratelimit
```

5. Create `.env` file in `Backend/myproject/`:
```env
SECRET_KEY=your-secret-key-here
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

6. Run migrations:
```bash
python manage.py migrate
```

7. Create superuser:
```bash
python manage.py createsuperuser
```

8. Run server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd Safe_Travels/Frontend/Travel
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/register/` - User registration
- `POST /api/login/` - User login

### Buses
- `GET /api/buses/` - List all buses
- `GET /api/buses/<id>/` - Get bus details
- `POST /api/buses/` - Create bus (admin)

### Trains
- `GET /api/trains/` - List all trains
- `GET /api/trains/<id>/` - Get train details
- `POST /api/trains/` - Create train (admin)

### Flights
- `GET /api/flights/` - List all flights
- `GET /api/flights/<id>/` - Get flight details
- `POST /api/flights/` - Create flight (admin)

### Bookings
- `GET /api/user/<user_id>/bookings/` - Get user bookings
- `POST /api/booking/<id>/cancel/` - Cancel booking

### Payments
- `POST /api/payments/create-order/` - Create payment order
- `POST /api/payments/verify/` - Verify payment

## Booking Flow

1. **Bus/Flight**: User selects seat → Fills passenger details → Payment → Booking confirmed
2. **Train**: User fills passenger details → Payment → Seat auto-allocated → Booking confirmed

## Environment Variables

Create a `.env` file in `Backend/myproject/`:

```env
SECRET_KEY=your-django-secret-key
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

## Admin Panel

Access Django admin at `http://localhost:8000/admin/` to:
- Add/Edit Buses, Trains, Flights
- View Bookings and Payments
- Manage users

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.

## Author

Levin Thummalapalli - [GitHub](https://github.com/Levin1415)
