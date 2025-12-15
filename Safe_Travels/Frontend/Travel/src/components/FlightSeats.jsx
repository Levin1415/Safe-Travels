import axios from 'axios'
import React, {useState, useEffect} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
        if (typeof document === 'undefined') {
            reject(new Error('Document is not available'))
            return
        }
        const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`)
        if (existingScript) {
            resolve(true)
            return
        }
        const script = document.createElement('script')
        script.src = RAZORPAY_SCRIPT_URL
        script.onload = () => resolve(true)
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
        document.body.appendChild(script)
    })
}

const FlightSeats = ({token}) => {
    const [flight, setFlight] = useState(null)
    const [seats, setSeats] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedSeat, setSelectedSeat] = useState(null)
    const [travelDate, setTravelDate] = useState('')
    const [bookingSummary, setBookingSummary] = useState(null)
    const [showSummary, setShowSummary] = useState(false)
    const [availableSeatsCount, setAvailableSeatsCount] = useState(0)
    const [passengerName, setPassengerName] = useState('')
    const [passengerAge, setPassengerAge] = useState('')
    const [passengerSex, setPassengerSex] = useState('male')
    const [isPaying, setIsPaying] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)

    const { flightId } = useParams()
    const navigate = useNavigate()

    // Step tracking for progress indicator
    const steps = [
        { id: 1, name: 'Flight Details', status: 'current' },
        { id: 2, name: 'Passenger Info', status: 'upcoming' },
        { id: 3, name: 'Seat Selection', status: 'upcoming' },
        { id: 4, name: 'Payment', status: 'upcoming' },
        { id: 5, name: 'Confirmation', status: 'upcoming' }
    ]

    // Class type themes
    const classTypeThemes = {
        'Economy': { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-800' },
        'Premium Economy': { gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', text: 'text-purple-800' },
        'Business': { gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-50', text: 'text-green-800' },
        'First Class': { gradient: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-50', text: 'text-yellow-800' }
    }

    // Seat types
    const seatTypes = [
        { type: 'window', icon: '🪟', description: 'Window Seat' },
        { type: 'middle', icon: '🛋️', description: 'Middle Seat' },
        { type: 'aisle', icon: '🛣️', description: 'Aisle Seat' }
    ]

    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0]
    }

    useEffect(() => {
        const fetchFlightDetails = async() => {
            try {
                const response = await axios.get(`http://localhost:8000/api/flights/${flightId}`)
                setFlight(response.data)
                const seatsData = response.data.seats || []
                setSeats(seatsData)
                const available = seatsData.filter(seat => !seat.is_booked).length
                setAvailableSeatsCount(available)
                setLoading(false)
            } catch (error) {
                console.log('Error in fetching flight details', error)
                toast.error('Failed to load flight details')
                setLoading(false)
            }
        }
        fetchFlightDetails()
    }, [flightId])

    useEffect(() => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        setTravelDate(tomorrow.toISOString().split('T')[0])
    }, [])

    // Update steps based on user progress
    useEffect(() => {
        if (selectedSeat) {
            setCurrentStep(4) // Payment step
        } else if (passengerName && passengerAge && travelDate) {
            setCurrentStep(3) // Seat selection step
        } else if (passengerName || passengerAge || travelDate) {
            setCurrentStep(2) // Passenger info step
        } else {
            setCurrentStep(1) // Flight details step
        }
    }, [selectedSeat, passengerName, passengerAge, travelDate])

    const handleSeatSelect = (seatId) => {
        if (!token) {
            toast.error("Please login to select a seat")
            navigate('/login')
            return
        }
        
        if (!travelDate) {
            toast.error("Please select a travel date first")
            return
        }

        if (!passengerName || !passengerAge) {
            toast.error("Please fill passenger details before selecting a seat")
            return
        }

        const seat = seats.find(s => s.id === seatId)
        if (!seat || seat.is_booked) return

        setSelectedSeat(seatId)
    }

    const handleBook = async() => {
        if (!selectedSeat) {
            toast.error("Please select a seat first")
            return
        }

        const seat = seats.find(s => s.id === selectedSeat)
        if (!seat) return

        setIsPaying(true)
        setCurrentStep(4)

        try {
            await loadRazorpayScript()
            if (typeof window === 'undefined' || !window.Razorpay) {
                throw new Error("Payment gateway unavailable. Please refresh and try again.")
            }
        } catch (sdkError) {
            toast.error(sdkError?.message || "Unable to load payment gateway")
            setSelectedSeat(null)
            setIsPaying(false)
            setCurrentStep(3)
            return
        }
        
        const parsedAge = Number(passengerAge)
        
        try {
            const orderResponse = await axios.post("http://localhost:8000/api/payments/create-order/",
                {
                    booking_type: 'flight',
                    transport_id: flightId,
                    seat_id: selectedSeat,
                    travel_date: travelDate,
                    passenger_name: passengerName,
                    passenger_age: parsedAge,
                    passenger_sex: passengerSex
                },
                {
                    headers: {
                        Authorization: `Token ${token}`
                    }
                }
            )

            const orderData = orderResponse.data

            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "SkyWays Airlines",
                description: `${flight.airline_name} - Seat ${seat.seat_number}`,
                handler: async function (response) {
                    try {
                        const verifyResponse = await axios.post("http://localhost:8000/api/payments/verify/",
                            {
                                order_id: response.razorpay_order_id,
                                payment_id: response.razorpay_payment_id,
                                signature: response.razorpay_signature,
                                booking_type: 'flight',
                                transport_id: flightId,
                                seat_id: selectedSeat,
                                travel_date: travelDate,
                                passenger_name: passengerName,
                                passenger_age: parsedAge,
                                passenger_sex: passengerSex
                            },
                            {
                                headers: {
                                    Authorization: `Token ${token}`
                                }
                            }
                        )

                        const bookingData = verifyResponse.data

                        setBookingSummary({
                            seatNumber: seat.seat_number,
                            seatType: getSeatType(seat.seat_number),
                            airlineName: flight.airline_name,
                            flightNumber: flight.flight_number,
                            origin: flight.origin,
                            destination: flight.destination,
                            date: travelDate,
                            price: flight.price,
                            bookingId: bookingData.id,
                            paymentId: bookingData?.payment?.payment_id,
                            departureTime: flight.departure_time,
                            arrivalTime: flight.arrival_time,
                            classType: flight.class_type
                        })
                        setShowSummary(true)
                        setCurrentStep(5)
                        toast.success('Booking confirmed! ✈️')

                        // Update seat status
                        setSeats(prevSeats => 
                            prevSeats.map(s =>
                                s.id === selectedSeat ? { ...s, is_booked: true } : s
                            )
                        )
                        setAvailableSeatsCount(prev => Math.max(prev - 1, 0))
                        setSelectedSeat(null)
                    } catch (verifyError) {
                        console.error('Payment verification error:', verifyError.response?.data)
                        const message = verifyError.response?.data?.error || "Payment verification failed. Please contact support."
                        toast.error(message)
                        setCurrentStep(3)
                    } finally {
                        setIsPaying(false)
                    }
                },
                theme: {
                    color: "#4f46e5"
                },
                modal: {
                    ondismiss: () => {
                        setIsPaying(false)
                        setCurrentStep(3)
                    }
                },
                prefill: {
                    name: passengerName
                }
            }

            const paymentObject = new window.Razorpay(options)
            paymentObject.on('payment.failed', function (response) {
                const errorMessage = response.error?.description || "Payment failed. Please try again."
                toast.error(errorMessage)
                setIsPaying(false)
                setCurrentStep(3)
            })
            paymentObject.open()
        } catch (error) {
            console.error('Booking error:', error.response?.data || error.message)
            const errorMessage = error.response?.data?.error || 
                                error.response?.data?.message || 
                                "Booking failed. Please try again."
            toast.error(errorMessage)
            setIsPaying(false)
            setCurrentStep(3)
        }
    }

    // Group seats into rows (6 seats per row: 3 left, 3 right)
    const groupedSeats = [];
    for (let i = 0; i < seats.length; i += 6) {
        groupedSeats.push(seats.slice(i, i + 6));
    }

    const getClassTheme = () => {
        const classType = flight?.class_type || 'Economy'
        const theme = Object.keys(classTypeThemes).find(key => 
            classType.toLowerCase().includes(key.toLowerCase())
        )
        return classTypeThemes[theme] || classTypeThemes['Economy']
    }

    const getSeatType = (seatNumber) => {
        const seatChar = seatNumber.charAt(seatNumber.length - 1)
        if (['A', 'F'].includes(seatChar)) return 'window'
        if (['C', 'D'].includes(seatChar)) return 'aisle'
        return 'middle'
    }

    const formatDate = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        return new Date(dateString).toLocaleDateString('en-IN', options)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                        <div className="w-16 h-16 border-4 border-t-blue-500 border-transparent rounded-full animate-spin absolute top-0"></div>
                    </div>
                    <p className="text-gray-600 font-medium animate-pulse">Loading flight details...</p>
                </div>
            </div>
        )
    }

    const classTheme = getClassTheme()

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
            {/* Progress Steps */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-12">
                    <nav aria-label="Progress">
                        <ol className="flex items-center justify-center">
                            {steps.map((step, stepIdx) => (
                                <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                                    <div className="flex items-center">
                                        <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                                            step.id < currentStep ? 'bg-indigo-600' :
                                            step.id === currentStep ? 'bg-white border-2 border-indigo-600' :
                                            'bg-gray-100'
                                        }`}>
                                            {step.id < currentStep ? (
                                                <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : step.id === currentStep ? (
                                                <div className="h-2 w-2 bg-indigo-600 rounded-full"></div>
                                            ) : (
                                                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                                            )}
                                        </div>
                                        <div className="hidden sm:block absolute top-0 -translate-y-1/2 transform left-1/2 -translate-x-1/2 mt-10 w-32 text-center">
                                            <span className={`text-sm font-medium ${
                                                step.id === currentStep ? 'text-indigo-600' : 'text-gray-500'
                                            }`}>
                                                {step.name}
                                            </span>
                                        </div>
                                    </div>
                                    {stepIdx !== steps.length - 1 && (
                                        <div className="absolute top-1/2 left-full h-0.5 w-16 sm:w-24 -translate-y-1/2 bg-gray-200"></div>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                </div>

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent mb-4">
                        Book Your Flight
                    </h1>
                    <p className="text-gray-600 text-lg">Complete your booking in {steps.length} simple steps</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Flight Details & Passenger Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Flight Details Card */}
                        {flight && (
                            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-sm p-6 border border-gray-200/50">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <div className="flex items-center space-x-3 mb-4">
                                            <h2 className="text-3xl font-bold text-gray-800">{flight.airline_name}</h2>
                                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${classTheme.bg} ${classTheme.text}`}>
                                                {flight.class_type}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                #{flight.flight_number}
                                            </span>
                                            <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                                                ✈️ Direct Flight
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/flights')}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        ← Back
                                    </button>
                                </div>

                                {/* Route Visualization */}
                                <div className="relative mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-800 mb-1">{flight.origin}</div>
                                            <div className="text-blue-600 font-medium">{flight.departure_time}</div>
                                        </div>
                                        <div className="flex-1 mx-4">
                                            <div className="h-1 bg-gradient-to-r from-blue-200 via-sky-200 to-green-200 rounded-full"></div>
                                            <div className="flex justify-between mt-2">
                                                <div className="text-xs text-gray-500">Departure</div>
                                                <div className="text-xs text-gray-500">On Time</div>
                                                <div className="text-xs text-gray-500">Arrival</div>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-800 mb-1">{flight.destination}</div>
                                            <div className="text-green-600 font-medium">{flight.arrival_time}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Seat Availability */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Seat Availability</span>
                                        <span className={`text-sm font-semibold ${
                                            availableSeatsCount > 10 ? 'text-green-600' :
                                            availableSeatsCount > 3 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                            {availableSeatsCount} of {seats.length} seats available
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                availableSeatsCount > 10 ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                                                availableSeatsCount > 3 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                                                'bg-gradient-to-r from-red-400 to-pink-400'
                                            }`}
                                            style={{ width: `${((seats.length - availableSeatsCount) / seats.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Travel Date Selection */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-sm p-6 border border-gray-200/50">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3">📅</span>
                                Select Travel Date
                            </h3>
                            <div className="relative">
                                <input 
                                    type="date"
                                    min={getTodayDate()}
                                    value={travelDate}
                                    onChange={(e) => setTravelDate(e.target.value)}
                                    className="w-full px-4 py-3 pl-12 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-transparent"
                                />
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                            {travelDate && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-blue-700 text-sm">
                                        Selected: <span className="font-semibold">{formatDate(travelDate)}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Passenger Details */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-sm p-6 border border-gray-200/50">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mr-3">👤</span>
                                Passenger Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={passengerName}
                                            onChange={(e) => setPassengerName(e.target.value)}
                                            placeholder="Enter passenger name"
                                            className="w-full px-4 py-3 pl-11 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-transparent"
                                        />
                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={passengerAge}
                                            onChange={(e) => setPassengerAge(e.target.value)}
                                            placeholder="Age"
                                            min="1"
                                            max="120"
                                            className="w-full px-4 py-3 pl-11 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-transparent"
                                        />
                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                            <span className="text-gray-400">🎂</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                                    <div className="flex space-x-4">
                                        {['male', 'female', 'other'].map((gender) => (
                                            <button
                                                key={gender}
                                                type="button"
                                                onClick={() => setPassengerSex(gender)}
                                                className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                                                    passengerSex === gender
                                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent'
                                                    : 'bg-gray-50 text-gray-600 border-gray-300/50 hover:bg-gray-100'
                                                }`}
                                            >
                                                <div className="flex items-center justify-center">
                                                    <span className="mr-2">
                                                        {gender === 'male' ? '👨' : gender === 'female' ? '👩' : '⚧️'}
                                                    </span>
                                                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Seat Selection */}
                        {passengerName && passengerAge && travelDate && (
                            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-sm p-6 border border-gray-200/50">
                                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mr-3">💺</span>
                                    Select Your Seat
                                </h3>

                                {/* Seat Types Legend */}
                                <div className="mb-8">
                                    <h4 className="text-lg font-semibold text-gray-700 mb-3">Seat Types</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {seatTypes.map((seatType) => (
                                            <div key={seatType.type} className="bg-gray-50 rounded-xl p-3 border border-gray-200/50">
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-2xl">{seatType.icon}</span>
                                                    <div>
                                                        <div className="font-medium text-gray-800">{seatType.description}</div>
                                                        <div className="text-xs text-gray-500">Extra legroom available</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Aircraft Layout */}
                                <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-300/50">
                                    {/* Cockpit */}
                                    <div className="text-center mb-8">
                                        <div className="w-48 h-12 bg-gradient-to-r from-gray-600 to-gray-700 rounded-t-3xl mx-auto flex items-center justify-center shadow-lg">
                                            <div className="text-white text-sm font-bold flex items-center">
                                                <span className="mr-2">✈️</span>
                                                COCKPIT
                                            </div>
                                        </div>
                                    </div>

                                    {/* Seats Grid */}
                                    <div className="max-w-3xl mx-auto">
                                        {groupedSeats.map((row, rowIndex) => (
                                            <div key={rowIndex} className="flex justify-between items-center mb-4">
                                                {/* Left Side Seats */}
                                                <div className="flex space-x-3">
                                                    {row.slice(0, 3).map((seat) => {
                                                        const seatType = getSeatType(seat.seat_number)
                                                        const isSelected = selectedSeat === seat.id
                                                        const isWindow = seatType === 'window'
                                                        const isAisle = seatType === 'aisle'
                                                        const isMiddle = seatType === 'middle'
                                                        
                                                        return (
                                                            <button
                                                                key={seat.id}
                                                                onClick={() => handleSeatSelect(seat.id)}
                                                                disabled={seat.is_booked}
                                                                className={`relative w-16 h-16 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center ${
                                                                    seat.is_booked 
                                                                        ? 'bg-red-400 cursor-not-allowed' 
                                                                        : isSelected
                                                                        ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white shadow-lg scale-105'
                                                                        : isWindow
                                                                        ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white hover:from-blue-500 hover:to-cyan-500'
                                                                        : isAisle
                                                                        ? 'bg-gradient-to-br from-green-400 to-emerald-400 text-white hover:from-green-500 hover:to-emerald-500'
                                                                        : 'bg-gradient-to-br from-purple-400 to-pink-400 text-white hover:from-purple-500 hover:to-pink-500'
                                                                }`}
                                                            >
                                                                <div className="text-lg font-bold">{seat.seat_number}</div>
                                                                <div className="text-xs opacity-90 mt-1">
                                                                    {seatType === 'window' ? '🪟' : 
                                                                     seatType === 'aisle' ? '🛣️' : '🛋️'}
                                                                </div>
                                                                {isSelected && (
                                                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                                
                                                {/* Aisle */}
                                                <div className="w-16 h-full flex flex-col items-center justify-center">
                                                    <div className="w-2 h-full bg-gradient-to-b from-gray-400 to-gray-500 rounded-full"></div>
                                                    <span className="text-xs text-gray-500 mt-2">AISLE</span>
                                                </div>
                                                
                                                {/* Right Side Seats */}
                                                <div className="flex space-x-3">
                                                    {row.slice(3, 6).map((seat) => {
                                                        const seatType = getSeatType(seat.seat_number)
                                                        const isSelected = selectedSeat === seat.id
                                                        const isWindow = seatType === 'window'
                                                        const isAisle = seatType === 'aisle'
                                                        const isMiddle = seatType === 'middle'
                                                        
                                                        return (
                                                            <button
                                                                key={seat.id}
                                                                onClick={() => handleSeatSelect(seat.id)}
                                                                disabled={seat.is_booked}
                                                                className={`relative w-16 h-16 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center ${
                                                                    seat.is_booked 
                                                                        ? 'bg-red-400 cursor-not-allowed' 
                                                                        : isSelected
                                                                        ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white shadow-lg scale-105'
                                                                        : isWindow
                                                                        ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white hover:from-blue-500 hover:to-cyan-500'
                                                                        : isAisle
                                                                        ? 'bg-gradient-to-br from-green-400 to-emerald-400 text-white hover:from-green-500 hover:to-emerald-500'
                                                                        : 'bg-gradient-to-br from-purple-400 to-pink-400 text-white hover:from-purple-500 hover:to-pink-500'
                                                                }`}
                                                            >
                                                                <div className="text-lg font-bold">{seat.seat_number}</div>
                                                                <div className="text-xs opacity-90 mt-1">
                                                                    {seatType === 'window' ? '🪟' : 
                                                                     seatType === 'aisle' ? '🛣️' : '🛋️'}
                                                                </div>
                                                                {isSelected && (
                                                                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tail Section */}
                                    <div className="text-center mt-8">
                                        <div className="w-32 h-8 bg-gradient-to-r from-gray-700 to-gray-800 rounded-b-2xl mx-auto"></div>
                                    </div>
                                </div>

                                {/* Seat Legend */}
                                <div className="flex justify-center gap-6 mt-8 flex-wrap">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-cyan-400 rounded"></div>
                                        <span className="text-sm text-gray-600">Window Seat</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-400 rounded"></div>
                                        <span className="text-sm text-gray-600">Aisle Seat</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-gradient-to-br from-purple-400 to-pink-400 rounded"></div>
                                        <span className="text-sm text-gray-600">Middle Seat</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-red-400 rounded"></div>
                                        <span className="text-sm text-gray-600">Booked</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded"></div>
                                        <span className="text-sm text-gray-600">Selected</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Booking Summary & Payment */}
                    <div className="space-y-8">
                        {/* Fare Summary */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-sm p-6 border border-gray-200/50 sticky top-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-6">Fare Summary</h3>
                            
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Base Fare</span>
                                    <span className="font-medium">₹{flight?.price || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Seat Selection</span>
                                    <span className="text-green-600 font-medium">Free</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Airport Tax</span>
                                    <span className="font-medium">₹{Math.round(flight?.price * 0.08) || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Fuel Surcharge</span>
                                    <span className="font-medium">₹{Math.round(flight?.price * 0.12) || 0}</span>
                                </div>
                                <div className="h-px bg-gray-200"></div>
                                <div className="flex justify-between text-lg">
                                    <span className="font-semibold">Total Amount</span>
                                    <span className="text-2xl font-bold text-blue-600">
                                        ₹{flight ? Math.round(flight.price * 1.2) : 0}
                                    </span>
                                </div>
                            </div>

                            {/* Selected Seat Info */}
                            {selectedSeat && (
                                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                    <div className="flex items-center mb-3">
                                        <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg flex items-center justify-center mr-3">💺</span>
                                        <span className="font-bold text-gray-800">Selected Seat</span>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-gray-800 mb-1">
                                            {seats.find(s => s.id === selectedSeat)?.seat_number}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {getSeatType(seats.find(s => s.id === selectedSeat)?.seat_number || '')} Seat • {flight?.class_type}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Book Button */}
                            <button
                                onClick={handleBook}
                                disabled={isPaying || !selectedSeat || !passengerName || !passengerAge || !travelDate}
                                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] ${
                                    isPaying || !selectedSeat || !passengerName || !passengerAge || !travelDate
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-sky-600 hover:shadow-lg hover:shadow-blue-200'
                                } text-white`}
                            >
                                {isPaying ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                        Processing Payment...
                                    </div>
                                ) : !selectedSeat ? (
                                    'Select a Seat First'
                                ) : (
                                    `Pay ₹${flight ? Math.round(flight.price * 1.2) : 0}`
                                )}
                            </button>

                            {/* Security Info */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <span className="mr-1">🔒</span>
                                        <span>Secure Payment</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="mr-1">✅</span>
                                        <span>Instant E-Ticket</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Flight Amenities */}
                        <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-3xl shadow-sm p-6 border border-blue-100">
                            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                <span className="mr-2">✨</span>
                                In-Flight Amenities
                            </h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center">
                                    <span className="mr-2">🍽️</span>
                                    <span>Complimentary meal service</span>
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2">🎬</span>
                                    <span>Personal entertainment system</span>
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2">🧥</span>
                                    <span>Blanket and pillow provided</span>
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2">🔌</span>
                                    <span>USB charging ports</span>
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2">🧳</span>
                                    <span>7kg cabin baggage included</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Booking Summary Modal */}
            {showSummary && bookingSummary && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform animate-slideUp">
                        {/* Header */}
                        <div className="relative p-8 text-center bg-gradient-to-r from-sky-500 to-blue-600 text-white">
                            <div className="absolute top-4 right-4 text-4xl">✈️</div>
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-3xl font-bold mb-2">Flight Booked!</h3>
                            <p className="opacity-90">Your e-ticket is ready</p>
                        </div>
                        
                        {/* Ticket Details */}
                        <div className="p-8">
                            <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl p-6 mb-6 border border-blue-200">
                                <div className="text-center mb-4">
                                    <div className="text-xl font-bold text-gray-800 mb-1">{bookingSummary.airlineName}</div>
                                    <div className="text-sm text-gray-600">Flight #{bookingSummary.flightNumber}</div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-xs text-gray-500">From</div>
                                            <div className="font-bold text-gray-800">{bookingSummary.origin}</div>
                                            <div className="text-sm text-blue-600">{bookingSummary.departureTime}</div>
                                        </div>
                                        <div className="text-2xl text-gray-400">→</div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500">To</div>
                                            <div className="font-bold text-gray-800">{bookingSummary.destination}</div>
                                            <div className="text-sm text-green-600">{bookingSummary.arrivalTime}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                        <div>
                                            <div className="text-xs text-gray-500">Seat</div>
                                            <div className="font-bold text-lg">{bookingSummary.seatNumber}</div>
                                            <div className="text-sm text-gray-600">{bookingSummary.seatType} Seat</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Class</div>
                                            <div className="font-medium">{bookingSummary.classType}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Date</div>
                                            <div className="font-medium">{bookingSummary.date}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Booking ID</div>
                                            <div className="font-medium">{bookingSummary.bookingId}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-xs text-gray-500">Amount Paid</div>
                                                <div className="text-2xl font-bold text-green-600">₹{bookingSummary.price}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500">Passenger</div>
                                                <div className="font-medium">{passengerName}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex flex-col space-y-3">
                                <button 
                                    onClick={() => {
                                        setShowSummary(false)
                                        navigate('/my-bookings')
                                    }}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                                >
                                    View My Bookings
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowSummary(false)
                                        toast.success('E-ticket downloaded successfully!')
                                    }}
                                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Download E-Ticket
                                </button>
                            </div>
                            
                            <p className="text-center text-sm text-gray-500 mt-6">
                                Check-in opens 48 hours before departure
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Add animations */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                
                .animate-slideUp {
                    animation: slideUp 0.4s ease-out;
                }
            `}</style>
        </div>
    )
}

export default FlightSeats