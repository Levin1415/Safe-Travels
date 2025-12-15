import axios from 'axios'
import React, { useState, useEffect } from 'react'

const UserBookings = ({ token, userId }) => {
    const [bookings, setBookings] = useState([])
    const [bookingError, setBookingError] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBookings = async () => {
            if (!token || !userId) {
                setLoading(false)
                return
            }
            try {
                const response = await axios.get(`http://localhost:8000/api/user/${userId}/bookings/`,
                    {
                        headers: {
                            Authorization: `Token ${token}`
                        }
                    }
                )
                setBookings(response.data)
                setLoading(false)
            } catch (error) {
                console.log("Fetching details failed", error)
                // Enhanced error handling
                if (error.response) {
                    // Server responded with error status
                    setBookingError(error.response.data?.message || `Error: ${error.response.status} - ${error.response.statusText}`)
                } else if (error.request) {
                    // Request made but no response received
                    setBookingError("Network error: Unable to connect to server")
                } else {
                    // Other errors
                    setBookingError("Failed to load bookings")
                }
                setLoading(false)
            }
        }
        fetchBookings()
    }, [userId, token])

    // Safe date formatting function
    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleString()
        } catch (error) {
            return "Invalid date"
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your bookings...</p>
                </div>
            </div>
        )
    }

    if (!token || !userId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Authentication Required</h3>
                    <p className="text-gray-500">Please login to view your bookings</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-7xl mx-auto"> {/* Changed to max-w-7xl for wider layout */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">My Bookings</h1>
                    <p className="text-gray-600">Your travel history and upcoming journeys</p>
                </div>

                {bookingError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center space-x-2 text-red-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{bookingError}</span>
                        </div>
                    </div>
                )}

                {/* Changed to grid layout with 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {bookings && bookings.length > 0 ? bookings.map((item, index) => {
                        // Handle different booking types
                        const transport = item.bus || item.train || item.flight || {}
                        const seat = item.seat || item.train_seat || item.flight_seat || {}
                        const bookingType = item.booking_type || 'bus'
                        
                        // Get transport name based on type
                        const getTransportName = () => {
                            if (item.bus) return item.bus.bus_name
                            if (item.train) return item.train.train_name
                            if (item.flight) return item.flight.airline_name
                            return 'Transport details not available'
                        }
                        
                        // Get transport number
                        const getTransportNumber = () => {
                            if (item.bus) return item.bus.number
                            if (item.train) return item.train.train_number
                            if (item.flight) return item.flight.flight_number
                            return 'N/A'
                        }
                        
                        // Get seat number
                        const getSeatNumber = () => {
                            if (item.seat) return item.seat.seat_number
                            if (item.train_seat) return `${item.train_seat.coach_number}-${item.train_seat.seat_number}`
                            if (item.flight_seat) return item.flight_seat.seat_number
                            return 'N/A'
                        }
                        
                        // Get price
                        const getPrice = () => {
                            return item.amount_paid || transport.price || 0
                        }
                        
                        return (
                            <div key={item.id || index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 flex flex-col h-full">
                                {/* Header with transport name and status */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <h3 className="text-lg font-bold text-gray-800 truncate">
                                            {getTransportName()}
                                        </h3>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                                            bookingType === 'train' ? 'bg-blue-100 text-blue-700' :
                                            bookingType === 'flight' ? 'bg-purple-100 text-purple-700' :
                                            'bg-indigo-100 text-indigo-700'
                                        }`}>
                                            {bookingType.toUpperCase()}
                                        </span>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                                        item.status === 'cancelled' 
                                            ? 'bg-red-100 text-red-800'
                                            : item.status === 'completed'
                                            ? 'bg-gray-100 text-gray-800'
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {item.status || 'confirmed'}
                                    </span>
                                </div>
                                
                                {/* Route information */}
                                {(transport.origin || transport.destination) && (
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-semibold text-gray-700">{transport.origin}</span>
                                            <svg className="w-4 h-4 text-gray-400 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                            <span className="font-semibold text-gray-700">{transport.destination}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{getTransportNumber()}</p>
                                    </div>
                                )}
                                
                                {/* Booking details */}
                                <div className="space-y-3 flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Passenger</span>
                                        <span className="font-semibold text-gray-700 text-sm">
                                            {item.passenger_name || item.user || 'N/A'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Seat Number</span>
                                        <span className="font-semibold text-gray-700 text-sm">
                                            {getSeatNumber()}
                                        </span>
                                    </div>
                                    
                                    {item.travel_date && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Travel Date</span>
                                            <span className="font-semibold text-gray-700 text-sm">
                                                {item.travel_date}
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Booking Time</span>
                                        <span className="font-semibold text-gray-700 text-sm text-right">
                                            {formatDate(item.booking_time)}
                                        </span>
                                    </div>

                                    {/* Price */}
                                    {getPrice() > 0 && (
                                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                            <span className="text-sm text-gray-500">Amount</span>
                                            <span className="font-bold text-green-600">₹{getPrice()}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <button className="w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        )
                    }) : null}
                </div>

                {(!bookings || bookings.length === 0) && !bookingError && (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Bookings Yet</h3>
                        <p className="text-gray-500">You haven't made any bookings yet. Start your journey today!</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default UserBookings