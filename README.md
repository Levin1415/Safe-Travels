🚀 Safe Travels - Multi-Transport Booking System


A modern, feature-rich booking platform for Buses 🚌, Trains 🚂, and Flights ✈️ with integrated payment processing and real-time seat selection.

✨ Features
🚍 Transport Options
Bus Booking - Interactive seat selection with visual layout

Train Booking - Smart auto-allocation system

Flight Booking - Premium cabin class selection

💳 Payment & Security
Razorpay Integration - Secure payment processing

Email Receipts - Instant booking confirmations

Token-based Auth - JWT authentication system

🎨 User Experience
Modern UI/UX - Clean design with Tailwind CSS

Real-time Updates - Live seat availability

Responsive Design - Mobile-first approach

🔧 Management
Admin Dashboard - Full booking management

Booking History - User-specific records

Cancellation System - Easy booking management

📊 Tech Stack
Frontend
yaml
React 19        # Latest React with concurrent features
Vite            # Lightning-fast build tool
React Router    # Client-side routing
Axios           # HTTP client for API calls
Tailwind CSS    # Utility-first CSS framework
React Hot Toast # Beautiful notifications
Backend
yaml
Django 5.2.6        # Python web framework
Django REST Framework  # API development
SQLite              # Development database
Razorpay SDK        # Payment gateway integration
JWT Authentication  # Secure user sessions
Dev Tools
yaml
ESLint             # Code quality
Prettier           # Code formatting
Postman            # API testing
Git                # Version control
🏗️ Architecture
text
Safe-Travels/
│
├── 📁 Backend/ (Django REST API)
│   ├── 📁 bookings/
│   │   ├── 📄 models.py        # Database models
│   │   ├── 📄 views.py         # API endpoints
│   │   ├── 📄 serializers.py   # Data serialization
│   │   └── 📄 admin.py         # Admin panel
│   └── 📁 myproject/
│       └── 📄 settings.py      # Configuration
│
└── 📁 Frontend/ (React App)
    └── 📁 src/
        ├── 📁 components/      # UI Components
        ├── 📁 pages/          # Route pages
        ├── 📁 services/       # API services
        ├── 📁 hooks/          # Custom hooks
        └── 📁 utils/          # Helper functions
⚡ Quick Start
1. Clone & Setup
bash
git clone https://github.com/Levin1415/Safe-Travels.git
cd Safe-Travels
2. Backend Setup 🐍
bash
# Navigate to backend
cd Backend/myproject

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate
# Activate (Mac/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Add your keys to .env

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start server
python manage.py runserver
3. Frontend Setup ⚛️
bash
# Navigate to frontend
cd Frontend/Travel

# Install dependencies
npm install

# Start development server
npm run dev
🔑 Environment Configuration
Create .env file in Backend/myproject/:

env
# Django Settings
SECRET_KEY=your-super-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Razorpay Payment
RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_secret_key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@safetravels.com
📡 API Endpoints
Method	Endpoint	Description	Auth Required
POST	/api/register/	User Registration	❌
POST	/api/login/	User Login	❌
GET	/api/buses/	List Buses	❌
GET	/api/trains/	List Trains	❌
GET	/api/flights/	List Flights	❌
POST	/api/bookings/	Create Booking	✅
GET	/api/my-bookings/	User Bookings	✅
POST	/api/payment/create/	Create Order	✅
POST	/api/payment/verify/	Verify Payment	✅

🎯 Booking Flow






🎨 UI Preview
Login Page
text
+-----------------------------------+
|        🔐 SAFE TRAVELS            |
|                                   |
|  [ Username    ]                  |
|  [ Password    ] 👁️               |
|                                   |
|  [    SIGN IN    ]                |
|                                   |
|  New here? [Create Account]      |
+-----------------------------------+
Booking Dashboard
text
+-----------------------------------+
| 🚌 Bus   🚂 Train   ✈️ Flight     |
|                                   |
|  From: [Delhi   ]                 |
|  To:   [Mumbai  ]                 |
|  Date: [2024-01-20] 📅            |
|                                   |
|  +-----------------------------+  |
|  | Available Buses (15)        |  |
|  |                             |  |
|  | 🚌 Volvo AC (9:00 AM)       |  |
|  |   ₹1500 • 8 seats left      |  |
|  |   [Select Seats]            |  |
|  |                             |  |
|  | 🚌 Sleeper (10:30 AM)       |  |
|  |   ₹1200 • 5 seats left      |  |
|  |   [Select Seats]            |  |
|  +-----------------------------+  |
+-----------------------------------+
🛠️ Admin Features
Access http://localhost:8000/admin to:

✅ Add/Edit transport details

✅ View all bookings

✅ Manage users

✅ Generate reports

✅ Monitor payments

📱 Responsive Design
css
/* Mobile-First Approach */
@media (max-width: 640px) {
  .booking-card {
    flex-direction: column;
  }
  .seat-map {
    grid-template-columns: repeat(4, 1fr);
  }
}
🔒 Security Features
✅ JWT Token Authentication

✅ Password Hashing (bcrypt)

✅ CORS Configuration

✅ Rate Limiting

✅ Input Validation

✅ SQL Injection Protection

🚀 Deployment
Backend (PythonAnywhere/Railway)
bash
# Collect static files
python manage.py collectstatic

# Configure production settings
DEBUG=False
ALLOWED_HOSTS=your-domain.com
Frontend (Vercel/Netlify)
bash
npm run build

# Upload build/ folder
📈 Future Enhancements
json
{
  "planned_features": [
    "Live tracking of buses/trains",
    "Mobile app (React Native)",
    "Loyalty rewards program",
    "Group booking discounts",
    "Real-time notifications",
    "Multilingual support",
    "Weather integration",
    "Travel insurance options"
  ]
}
🤝 Contributing
We welcome contributions! Please follow these steps:

Fork the repository

Create a feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

Commit Guidelines
text
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Formatting changes
refactor: Code refactoring
test:     Adding tests
📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

👨‍💻 Author
Levin Thummalapalli

https://img.shields.io/badge/GitHub-Levin1415-181717?style=flat&logo=github


⭐ Show Your Support

If you find this project useful, give it a ⭐ on GitHub!

📞 Support & Contact

For questions, suggestions, or issues:

📧 Email: your-email@example.com

💬 Issues: GitHub Issues

🐛 Bug Reports: Please include steps to reproduce
