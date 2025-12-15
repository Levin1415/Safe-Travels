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

const TrainBooking = ({token}) => {
    const [train, setTrain] = useState(null)
    const [loading, setLoading] = useState(true)
    const [travelDate, setTravelDate] = useState('')
    const [passengerName, setPassengerName] = useState('')
    const [passengerAge, setPassengerAge] = useState('')
    const [passengerSex, setPassengerSex] = useState('male')
    const [isPaying, setIsPaying] = useState(false)
    const [bookingSummary, setBookingSummary] = useState(null)
    const [showSummary, setShowSummary] = useState(false)
    const [seatAvailability, setSeatAvailability] = useState({
        totalSeats: 0,
        availableSeats: 0,
        percentage: 100
    })

    const { trainId } = useParams()
    const navigate = useNavigate()

    // Dynamic backgrounds for different coach types
    const coachTypeThemes = {
        'AC First Class': { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-800' },
        'AC 2 Tier': { gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', text: 'text-purple-800' },
        'AC 3 Tier': { gradient: 'from-green-500 to-teal-500', bg: 'bg-green-50', text: 'text-green-800' },
        'Sleeper': { gradient: 'from-orange-500 to-red-500', bg: 'bg-orange-50', text: 'text-orange-800' },
        'Chair Car': { gradient: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50', text: 'text-indigo-800' },
        'General': { gradient: 'from-gray-500 to-gray-700', bg: 'bg-gray-50', text: 'text-gray-800' }
    }

    // Step tracking for progress indicator
    const [currentStep, setCurrentStep] = useState(1)
    const steps = [
        { id: 1, name: 'Train Details', status: 'current' },
        { id: 2, name: 'Passenger Info', status: 'upcoming' },
        { id: 3, name: 'Payment', status: 'upcoming' },
        { id: 4, name: 'Confirmation', status: 'upcoming' }
    ]

    useEffect(() => {
        const fetchTrainDetails = async() => {
            try {
                const response = await axios.get(`http://localhost:8000/api/trains/${trainId}`)
                setTrain(response.data)
                
                // Calculate seat availability
                const totalSeats = response.data.seats?.length || 0
                const availableSeats = response.data.seats?.filter(s => !s.is_booked).length || 0
                const percentage = totalSeats > 0 ? Math.round((availableSeats / totalSeats) * 100) : 0
                
                setSeatAvailability({
                    totalSeats,
                    availableSeats,
                    percentage
                })
                
                setLoading(false)
            } catch (error) {
                console.log('Error in fetching train details', error)
                toast.error('Failed to load train details')
                setLoading(false)
            }
        }
        fetchTrainDetails()
    }, [trainId])

    useEffect(() => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        setTravelDate(tomorrow.toISOString().split('T')[0])
    }, [])

    // Update steps based on user progress
    useEffect(() => {
        const updatedSteps = steps.map(step => {
            if (step.id === 1) return { ...step, status: 'complete' }
            if (step.id === 2 && passengerName && passengerAge) return { ...step, status: 'current' }
            if (step.id === 2 && (!passengerName || !passengerAge)) return { ...step, status: 'upcoming' }
            if (step.id === 3 && isPaying) return { ...step, status: 'current' }
            if (step.id === 4 && showSummary) return { ...step, status: 'complete' }
            return { ...step, status: 'upcoming' }
        })
        setCurrentStep(passengerName && passengerAge ? 2 : 1)
    }, [passengerName, passengerAge, isPaying, showSummary])

    const handleBook = async() => {
        if(!token){
            toast.error("Please login for booking")
            navigate('/login')
            return
        }
        
        if (!travelDate) {
            toast.error("Please select a travel date")
            return
        }

        if (!passengerName || !passengerAge || !passengerSex) {
            toast.error("Please fill passenger details before booking")
            return
        }
        
        const parsedAge = Number(passengerAge)
        if (Number.isNaN(parsedAge) || parsedAge <= 0) {
            toast.error("Please enter a valid passenger age")
            return
        }

        // Check seat availability
        if (seatAvailability.availableSeats <= 0) {
            toast.error('Sorry, no seats available on this train')
            return
        }

        setIsPaying(true)
        setCurrentStep(3)

        try {
            await loadRazorpayScript()
            if (typeof window === 'undefined' || !window.Razorpay) {
                throw new Error("Payment gateway unavailable. Please refresh and try again.")
            }
        } catch (sdkError) {
            toast.error(sdkError?.message || "Unable to load payment gateway")
            setIsPaying(false)
            return
        }
        
        try {
            const orderResponse = await axios.post("http://localhost:8000/api/payments/create-order/",
                {
                    booking_type: 'train',
                    transport_id: trainId,
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
                name: "Indian Railways",
                description: `${train.train_name} - ${train.origin} to ${train.destination}`,
                handler: async function (response) {
                    try {
                        const verifyResponse = await axios.post("http://localhost:8000/api/payments/verify/",
                            {
                                order_id: response.razorpay_order_id,
                                payment_id: response.razorpay_payment_id,
                                signature: response.razorpay_signature,
                                booking_type: 'train',
                                transport_id: trainId,
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
                        const allocatedSeat = bookingData.train_seat

                        setBookingSummary({
                            trainName: train.train_name,
                            trainNumber: train.train_number,
                            origin: train.origin,
                            destination: train.destination,
                            date: travelDate,
                            price: train.price,
                            bookingId: bookingData.id,
                            seatNumber: allocatedSeat ? `${allocatedSeat.coach_number}-${allocatedSeat.seat_number}` : 'Auto-allocated',
                            paymentId: bookingData?.payment?.payment_id,
                            departureTime: train.start_time,
                            arrivalTime: train.reach_time,
                            journeyClass: train.coach_type
                        })
                        setShowSummary(true)
                        setCurrentStep(4)
                        toast.success('Booking confirmed! 🎉')

                        // Clear passenger details
                        setPassengerName('')
                        setPassengerAge('')
                        setPassengerSex('male')
                    } catch (verifyError) {
                        console.error('Payment verification error:', verifyError.response?.data)
                        const message = verifyError.response?.data?.error || "Payment verification failed. Please contact support."
                        toast.error(message)
                        setCurrentStep(2)
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
                        setCurrentStep(2)
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
                setCurrentStep(2)
            })
            paymentObject.open()
        } catch (error) {
            console.error('Booking error:', error.response?.data || error.message)
            const errorMessage = error.response?.data?.error || 
                                error.response?.data?.message || 
                                "Booking failed. Please try again."
            toast.error(errorMessage)
            setIsPaying(false)
            setCurrentStep(2)
        }
    }

    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0]
    }

    const getTrainTheme = () => {
        const coachType = train?.coach_type || 'General'
        const theme = Object.keys(coachTypeThemes).find(key => 
            coachType.toLowerCase().includes(key.toLowerCase())
        )
        return coachTypeThemes[theme] || coachTypeThemes['General']
    }

    const formatDate = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        return new Date(dateString).toLocaleDateString('en-IN', options)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
                        <div className="w-16 h-16 border-4 border-t-indigo-500 border-transparent rounded-full animate-spin absolute top-0"></div>
                    </div>
                    <p className="text-gray-600 font-medium animate-pulse">Loading train details...</p>
                </div>
            </div>
        )
    }

    const trainTheme = getTrainTheme()

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Progress Steps */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-12">
                    <nav aria-label="Progress">
                        <ol className="flex items-center justify-center">
                            {steps.map((step, stepIdx) => (
                                <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                                    <div className="flex items-center">
                                        <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                                            step.status === 'complete' ? 'bg-indigo-600' :
                                            step.status === 'current' ? 'bg-white border-2 border-indigo-600' :
                                            'bg-gray-100'
                                        }`}>
                                            {step.status === 'complete' ? (
                                                <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : step.status === 'current' ? (
                                                <div className="h-2 w-2 bg-indigo-600 rounded-full"></div>
                                            ) : (
                                                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                                            )}
                                        </div>
                                        <div className="hidden sm:block absolute top-0 -translate-y-1/2 transform left-1/2 -translate-x-1/2 mt-10 w-32 text-center">
                                            <span className={`text-sm font-medium ${
                                                step.status === 'current' ? 'text-indigo-600' : 'text-gray-500'
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
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                        Book Your Journey
                    </h1>
                    <p className="text-gray-600 text-lg">Complete your booking in {steps.length} simple steps</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Train Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Train Details Card */}
                        {train && (
                            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-sm p-6 border border-gray-200/50">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-800 mb-2">{train.train_name}</h2>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${trainTheme.bg} ${trainTheme.text}`}>
                                                #{train.train_number}
                                            </span>
                                            <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                                                {train.train_type}
                                            </span>
                                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${trainTheme.bg} ${trainTheme.text} border ${trainTheme.text.replace('text-', 'border-')}200`}>
                                                {train.coach_type}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/trains')}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        ← Back
                                    </button>
                                </div>

                                {/* Route Visualization */}
                                <div className="relative mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-800 mb-1">{train.origin}</div>
                                            <div className="text-blue-600 font-medium">{train.start_time}</div>
                                        </div>
                                        <div className="flex-1 mx-4">
                                            <div className="h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200 rounded-full"></div>
                                            <div className="flex justify-between mt-2">
                                                <div className="text-xs text-gray-500">Departure</div>
                                                <div className="text-xs text-gray-500">On Time</div>
                                                <div className="text-xs text-gray-500">Arrival</div>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-800 mb-1">{train.destination}</div>
                                            <div className="text-green-600 font-medium">{train.reach_time}</div>
                                        </div>
                                    </div>
                                    
                                    {/* Journey Duration */}
                                    <div className="text-center">
                                        <div className="inline-flex items-center bg-gray-50 px-4 py-2 rounded-full text-sm text-gray-600">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Journey Duration: Calculate based on time
                                        </div>
                                    </div>
                                </div>

                                {/* Seat Availability */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Seat Availability</span>
                                        <span className={`text-sm font-semibold ${
                                            seatAvailability.percentage > 30 ? 'text-green-600' :
                                            seatAvailability.percentage > 10 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                            {seatAvailability.availableSeats} of {seatAvailability.totalSeats} seats available
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                seatAvailability.percentage > 30 ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                                                seatAvailability.percentage > 10 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                                                'bg-gradient-to-r from-red-400 to-pink-400'
                                            }`}
                                            style={{ width: `${seatAvailability.percentage}%` }}
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
                    </div>

                    {/* Right Column - Booking Summary & Payment */}
                    <div className="space-y-8">
                        {/* Fare Summary */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-sm p-6 border border-gray-200/50 sticky top-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-6">Fare Summary</h3>
                            
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Base Fare</span>
                                    <span className="font-medium">₹{train?.price || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Convenience Fee</span>
                                    <span className="text-green-600 font-medium">Free</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">GST</span>
                                    <span className="font-medium">₹{Math.round(train?.price * 0.05) || 0}</span>
                                </div>
                                <div className="h-px bg-gray-200"></div>
                                <div className="flex justify-between text-lg">
                                    <span className="font-semibold">Total Amount</span>
                                    <span className="text-2xl font-bold text-blue-600">
                                        ₹{train ? Math.round(train.price * 1.05) : 0}
                                    </span>
                                </div>
                            </div>

                            {/* Seat Info */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center mb-2">
                                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded flex items-center justify-center mr-2">💺</span>
                                    <span className="font-medium text-gray-700">Seat Information</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Your seat will be automatically allocated in {train?.coach_type || 'General'} coach after successful payment.
                                </p>
                            </div>

                            {/* Book Button */}
                            <button
                                onClick={handleBook}
                                disabled={isPaying || !passengerName || !passengerAge || !travelDate || seatAvailability.availableSeats <= 0}
                                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] ${
                                    isPaying || !passengerName || !passengerAge || !travelDate || seatAvailability.availableSeats <= 0
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-blue-200'
                                } text-white`}
                            >
                                {isPaying ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                        Processing Payment...
                                    </div>
                                ) : seatAvailability.availableSeats <= 0 ? (
                                    'No Seats Available'
                                ) : (
                                    `Pay ₹${train ? Math.round(train.price * 1.05) : 0}`
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
                                        <span>Instant Confirmation</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Important Information */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl shadow-sm p-6 border border-blue-100">
                            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                <span className="mr-2">ℹ️</span>
                                Important Information
                            </h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Carry original ID proof during journey</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Reporting time: 30 minutes before departure</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Cancellation charges apply as per railway rules</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>E-ticket will be sent to your registered email</span>
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
                        {/* Confetti Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50 opacity-50"></div>
                        
                        {/* Header */}
                        <div className="relative p-8 text-center">
                            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-800 mb-2">Ticket Confirmed!</h3>
                            <p className="text-gray-600">Your e-ticket has been generated successfully</p>
                        </div>
                        
                        {/* Ticket Card */}
                        <div className="relative px-8 pb-8">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white shadow-lg">
                                <div className="text-center mb-6">
                                    <div className="text-2xl font-bold mb-1">{bookingSummary.trainName}</div>
                                    <div className="text-sm opacity-90">#{bookingSummary.trainNumber} • {bookingSummary.journeyClass}</div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-sm opacity-90">From</div>
                                            <div className="text-lg font-bold">{bookingSummary.origin}</div>
                                        </div>
                                        <div className="text-2xl opacity-80">→</div>
                                        <div className="text-right">
                                            <div className="text-sm opacity-90">To</div>
                                            <div className="text-lg font-bold">{bookingSummary.destination}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                                        <div>
                                            <div className="text-sm opacity-90">Date</div>
                                            <div className="font-medium">{bookingSummary.date}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm opacity-90">Seat</div>
                                            <div className="font-medium">{bookingSummary.seatNumber}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm opacity-90">Departure</div>
                                            <div className="font-medium">{bookingSummary.departureTime}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm opacity-90">Arrival</div>
                                            <div className="font-medium">{bookingSummary.arrivalTime}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-white/20">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-sm opacity-90">Amount Paid</div>
                                                <div className="text-2xl font-bold">₹{bookingSummary.price}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm opacity-90">Booking ID</div>
                                                <div className="font-medium">{bookingSummary.bookingId}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="mt-8 flex flex-col space-y-3">
                                <button 
                                    onClick={() => {
                                        setShowSummary(false)
                                        navigate('/my-bookings')
                                    }}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                                >
                                    View My Bookings
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowSummary(false)
                                        toast.success('Ticket details copied to clipboard!')
                                    }}
                                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Save Ticket Details
                                </button>
                            </div>
                            
                            <p className="text-center text-sm text-gray-500 mt-6">
                                E-ticket will be sent to your registered email within 5 minutes
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

export default TrainBooking