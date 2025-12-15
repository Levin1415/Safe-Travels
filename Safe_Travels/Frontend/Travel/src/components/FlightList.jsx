import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const FlightList = ({token}) => {
    const [flights, setFlights] = useState([])
    const [filteredFlights, setFilteredFlights] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalFlights: 0,
        availableSeats: 0,
        destinations: 0
    })
    const [popularRoutes, setPopularRoutes] = useState([])
    const [availableCities, setAvailableCities] = useState([])
    const [currentSlide, setCurrentSlide] = useState(0)
    const [activeRoute, setActiveRoute] = useState(null)
    const navigate = useNavigate()

    const [filters, setFilters] = useState({
        origin: '',
        destination: '',
        classType: '',
        sortBy: 'departure_time'
    })

    // Class type themes
    const classTypeThemes = {
        'Economy': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: '✈️' },
        'Premium Economy': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', icon: '💺' },
        'Business': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: '✨' },
        'First Class': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: '👑' }
    }

    // Special offers with flight-themed images
    const specialOffers = [
        {
            id: 1,
            title: "EARLY BIRD SPECIAL",
            subtitle: "Book 30 days in advance & save up to 40%",
            icon: "🐦",
            image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop&q=60",
            gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            badge: "EARLY BIRD",
            features: ["40% Savings", "Free Seat Selection", "Flexible Dates"]
        },
        {
            id: 2,
            title: "LAST MINUTE DEALS",
            subtitle: "Last minute flights at unbelievable prices",
            icon: "⚡",
            image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop&q=60",
            gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            badge: "HOT DEAL",
            features: ["Up to 60% Off", "Instant Confirmation", "Same Day Travel"]
        },
        {
            id: 3,
            title: "GROUP DISCOUNTS",
            subtitle: "Special rates for groups of 4+ travelers",
            icon: "👥",
            image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=60",
            gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            badge: "GROUP",
            features: ["Group Discounts", "Seats Together", "Special Handling"]
        },
        {
            id: 4,
            title: "STUDENT SPECIAL",
            subtitle: "Extra discounts for students and young travelers",
            icon: "🎓",
            image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=60",
            gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            badge: "STUDENT",
            features: ["Student Discount", "Extra Baggage", "Flexible Booking"]
        }
    ]

    useEffect(() => {
        const fetchFlights = async() => {
            try {
                const response = await axios.get("http://localhost:8000/api/flights/")
                setFlights(response.data)
                setFilteredFlights(response.data)
                setLoading(false)
                calculateStats(response.data)
                extractCities(response.data)
                calculatePopularRoutes(response.data)
            } catch (error) {
                console.log('error in fetching flights', error)
                toast.error('Failed to load flights')
                setLoading(false)
            }
        }
        fetchFlights()
    }, [])

    // Calculate dynamic statistics
    const calculateStats = (flightsData) => {
        const totalFlights = flightsData.length
        const availableSeats = flightsData.reduce((total, flight) => {
            const seats = flight.seats ? flight.seats.filter(s => !s.is_booked).length : 0
            return total + seats
        }, 0)
        const destinations = new Set(flightsData.flatMap(flight => [flight.origin, flight.destination])).size
        
        setStats({
            totalFlights,
            availableSeats,
            destinations
        })
    }

    // Extract available cities
    const extractCities = (flightsData) => {
        const allCities = new Set()
        flightsData.forEach(flight => {
            allCities.add(flight.origin)
            allCities.add(flight.destination)
        })
        setAvailableCities(Array.from(allCities).sort())
    }

    // Calculate popular routes
    const calculatePopularRoutes = (flightsData) => {
        const routeCount = {}
        flightsData.forEach(flight => {
            const route = `${flight.origin}-${flight.destination}`
            routeCount[route] = (routeCount[route] || 0) + 1
        })
        
        const popular = Object.entries(routeCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6)
            .map(([route, count], index) => {
                const [from, to] = route.split('-')
                return {
                    id: index + 1,
                    from,
                    to,
                    flights: count,
                    price: "₹" + (Math.floor(Math.random() * 8000) + 2000),
                    duration: Math.floor(Math.random() * 4) + 1 + "h",
                    isActive: index === 0
                }
            })
        
        setPopularRoutes(popular)
        if (popular.length > 0) {
            setActiveRoute(`${popular[0].from}-${popular[0].to}`)
        }
    }

    // Auto-slide offers
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % specialOffers.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        let filtered = [...flights]
        
        if (filters.origin) {
            filtered = filtered.filter(flight => 
                flight.origin.toLowerCase().includes(filters.origin.toLowerCase())
            )
        }
        
        if (filters.destination) {
            filtered = filtered.filter(flight => 
                flight.destination.toLowerCase().includes(filters.destination.toLowerCase())
            )
        }
        
        if (filters.classType) {
            filtered = filtered.filter(flight => 
                flight.class_type.toLowerCase().includes(filters.classType.toLowerCase())
            )
        }
        
        // Sort
        if (filters.sortBy === 'price') {
            filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        } else if (filters.sortBy === 'departure_time') {
            filtered.sort((a, b) => a.departure_time.localeCompare(b.departure_time))
        } else if (filters.sortBy === 'duration') {
            filtered.sort((a, b) => {
                const durationA = calculateDuration(a.departure_time, a.arrival_time)
                const durationB = calculateDuration(b.departure_time, b.arrival_time)
                return durationA - durationB
            })
        }
        
        setFilteredFlights(filtered)
    }, [filters, flights])

    const calculateDuration = (departure, arrival) => {
        const departTime = new Date(`2000-01-01T${departure}`)
        const arriveTime = new Date(`2000-01-01T${arrival}`)
        if (arriveTime < departTime) {
            arriveTime.setDate(arriveTime.getDate() + 1)
        }
        return (arriveTime - departTime) / (1000 * 60)
    }

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h ${mins}m`
    }

    const handleBookFlight = (id) => {
        if (!token) {
            toast.error('Please login to book a flight')
            navigate('/login')
            return
        }
        navigate(`/flight/${id}`)
    }

    const applyPopularRoute = (from, to) => {
        setFilters({
            ...filters,
            origin: from,
            destination: to
        })
        setActiveRoute(`${from}-${to}`)
    }

    const clearFilters = () => {
        setFilters({
            origin: '',
            destination: '',
            classType: '',
            sortBy: 'departure_time'
        })
        setActiveRoute(null)
    }

    const getClassTheme = (classType) => {
        const type = Object.keys(classTypeThemes).find(key => 
            classType.toLowerCase().includes(key.toLowerCase())
        )
        return classTypeThemes[type] || classTypeThemes['Economy']
    }

    const handleOfferClick = (offerId) => {
        toast.success(`Applying offer #${offerId}`, {
            icon: '✈️',
            duration: 2000
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                        <div className="w-16 h-16 border-4 border-t-blue-500 border-transparent rounded-full animate-spin absolute top-0"></div>
                    </div>
                    <p className="text-gray-600 font-medium animate-pulse">Loading flight schedules...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
            {/* Header Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-blue-500/5 transform -skew-y-3"></div>
                <div className="relative max-w-7xl mx-auto px-4 py-12">
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent mb-4">
                            SkyWays Airlines
                        </h1>
                        <p className="text-gray-600 text-lg">Fly with comfort, arrive with style</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-800">{stats.totalFlights}</div>
                                    <div className="text-gray-500 text-sm">Active Flights</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-800">{stats.availableSeats}</div>
                                    <div className="text-gray-500 text-sm">Available Seats</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-800">{stats.destinations}</div>
                                    <div className="text-gray-500 text-sm">Destinations</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 pb-16">
                {/* Search Section */}
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-sm p-6 mb-8 border border-gray-200/50">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Find Your Flight</h2>
                            <p className="text-gray-500 text-sm mt-1">Search across {stats.totalFlights} flights</p>
                        </div>
                        {(filters.origin || filters.destination || filters.classType) && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <span className="text-sm">✈️</span>
                            </div>
                            <input
                                type="text"
                                list="cities-origin"
                                placeholder="From airport"
                                value={filters.origin}
                                onChange={(e) => setFilters({...filters, origin: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-transparent"
                            />
                            <datalist id="cities-origin">
                                {availableCities.map(city => (
                                    <option key={city} value={city} />
                                ))}
                            </datalist>
                        </div>
                        
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <span className="text-sm">📍</span>
                            </div>
                            <input
                                type="text"
                                list="cities-destination"
                                placeholder="To airport"
                                value={filters.destination}
                                onChange={(e) => setFilters({...filters, destination: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-transparent"
                            />
                            <datalist id="cities-destination">
                                {availableCities.map(city => (
                                    <option key={city} value={city} />
                                ))}
                            </datalist>
                        </div>
                        
                        <input
                            type="text"
                            placeholder="Class (Economy, Business...)"
                            value={filters.classType}
                            onChange={(e) => setFilters({...filters, classType: e.target.value})}
                            className="px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-transparent"
                        />
                        
                        <select
                            value={filters.sortBy}
                            onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                            className="px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-transparent"
                        >
                            <option value="departure_time">Departure Time</option>
                            <option value="price">Price: Low to High</option>
                            <option value="duration">Duration</option>
                        </select>
                    </div>
                </div>

                {/* Popular Routes */}
                {popularRoutes.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Popular Routes</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {popularRoutes.map((route) => (
                                <button
                                    key={route.id}
                                    onClick={() => applyPopularRoute(route.from, route.to)}
                                    className={`p-4 rounded-xl border transition-all duration-300 ${
                                        activeRoute === `${route.from}-${route.to}` 
                                        ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                        : 'bg-white/50 border-gray-200/50 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="text-center">
                                        <div className="font-medium text-gray-800 text-sm">{route.from}</div>
                                        <div className="text-xs text-gray-400 my-1">→</div>
                                        <div className="font-medium text-gray-800 text-sm">{route.to}</div>
                                        <div className="text-xs text-blue-600 font-semibold mt-2">{route.price}</div>
                                        <div className="text-xs text-gray-500 mt-1">{route.flights} flights</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Special Offers */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-800">Special Offers</h3>
                        <div className="flex items-center space-x-2">
                            {specialOffers.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                        index === currentSlide 
                                        ? 'bg-blue-600 w-4' 
                                        : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-xl">
                        {specialOffers.map((offer, index) => (
                            <div
                                key={offer.id}
                                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                                    index === currentSlide 
                                    ? 'opacity-100 translate-x-0' 
                                    : 'opacity-0 translate-x-full'
                                }`}
                                style={{ background: offer.gradient }}
                            >
                                <div className="absolute inset-0 bg-black/20"></div>
                                
                                {/* Background Image */}
                                <div 
                                    className="absolute inset-0 bg-cover bg-center transform scale-105 transition-transform duration-1000"
                                    style={{ backgroundImage: `url(${offer.image})` }}
                                ></div>
                                
                                {/* Content Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent">
                                    <div className="h-full flex flex-col lg:flex-row items-center">
                                        {/* Text Content */}
                                        <div className="flex-1 p-8 lg:p-12 text-white">
                                            <div className="max-w-xl">
                                                {/* Badge */}
                                                <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
                                                    {offer.badge}
                                                </span>
                                                
                                                {/* Title */}
                                                <h3 className="text-4xl lg:text-5xl font-bold mb-4">
                                                    {offer.title}
                                                </h3>
                                                
                                                {/* Subtitle */}
                                                <p className="text-xl text-white/90 mb-3">
                                                    {offer.subtitle}
                                                </p>
                                                
                                                {/* Features */}
                                                <div className="mb-8">
                                                    <div className="flex flex-wrap gap-3">
                                                        {offer.features.map((feature, idx) => (
                                                            <span 
                                                                key={idx}
                                                                className="inline-flex items-center bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm"
                                                            >
                                                                <span className="mr-2">✓</span>
                                                                {feature}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                {/* CTA Button */}
                                                <button
                                                    onClick={() => handleOfferClick(offer.id)}
                                                    className="inline-flex items-center px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg"
                                                >
                                                    <span className="text-xl mr-3">{offer.icon}</span>
                                                    Explore Flights
                                                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Icon Display */}
                                        <div className="hidden lg:flex items-center justify-center p-12">
                                            <div className="text-white text-8xl opacity-30 transform rotate-12">
                                                {offer.icon}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {/* Navigation Arrows */}
                        <button
                            onClick={() => setCurrentSlide((prev) => prev === 0 ? specialOffers.length - 1 : prev - 1)}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setCurrentSlide((prev) => (prev + 1) % specialOffers.length)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    
                    {/* Thumbnail Preview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                        {specialOffers.map((offer, index) => (
                            <button
                                key={offer.id}
                                onClick={() => setCurrentSlide(index)}
                                className={`relative h-24 rounded-xl overflow-hidden transition-all duration-300 ${
                                    index === currentSlide 
                                    ? 'ring-2 ring-blue-500 ring-offset-2' 
                                    : 'opacity-80 hover:opacity-100'
                                }`}
                            >
                                <div 
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${offer.image})` }}
                                ></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                <div className="absolute bottom-2 left-2 right-2 text-white">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium truncate">{offer.badge}</span>
                                        <span className="text-xl">{offer.icon}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Flight List */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-800">
                            Available Flights {filteredFlights.length > 0 && `(${filteredFlights.length})`}
                        </h3>
                        <div className="text-sm text-gray-500">
                            Sorted by {filters.sortBy.replace('_', ' ')}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredFlights.map((flight) => {
                            const availableSeats = flight.seats ? flight.seats.filter(s => !s.is_booked).length : 0
                            const duration = calculateDuration(flight.departure_time, flight.arrival_time)
                            const theme = getClassTheme(flight.class_type)
                            
                            return (
                                <div 
                                    key={flight.id} 
                                    className="bg-white rounded-2xl border border-gray-200/50 overflow-hidden hover:shadow-md transition-all duration-300 group hover:border-blue-200"
                                >
                                    <div className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                                            {/* Left Section */}
                                            <div className="flex-1 mb-6 lg:mb-0 lg:pr-8">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <div className="flex items-center space-x-3 mb-2">
                                                            <h4 className="text-xl font-bold text-gray-800">{flight.airline_name}</h4>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${theme.bg} ${theme.text} ${theme.border}`}>
                                                                {theme.icon} {flight.class_type}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-4">
                                                            <span className="text-sm text-gray-500">#{flight.flight_number}</span>
                                                            {flight.aircraft_type && (
                                                                <span className="text-sm text-gray-500">Aircraft: {flight.aircraft_type}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-green-600">₹{flight.price}</div>
                                                        <div className="text-sm text-gray-500">per passenger</div>
                                                    </div>
                                                </div>

                                                {/* Route and Timing */}
                                                <div className="flex items-center space-x-6 mb-4">
                                                    <div className="text-center">
                                                        <div className="font-bold text-gray-800">{flight.origin}</div>
                                                        <div className="text-sm text-blue-600">{flight.departure_time}</div>
                                                    </div>
                                                    <div className="flex-1 relative">
                                                        <div className="h-px bg-gradient-to-r from-blue-200 to-sky-200"></div>
                                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                            <div className="bg-white border border-gray-300/50 rounded-full p-2 shadow-sm">
                                                                <span className="text-xs text-gray-600">{formatDuration(duration)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-bold text-gray-800">{flight.destination}</div>
                                                        <div className="text-sm text-green-600">{flight.arrival_time}</div>
                                                    </div>
                                                </div>
                                                
                                                {/* Seat Availability */}
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            availableSeats > 20 ? 'bg-green-500' : 
                                                            availableSeats > 5 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}></div>
                                                        <span className="text-sm text-gray-600">
                                                            <span className="font-medium">{availableSeats}</span> seats available
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="lg:border-l lg:border-gray-200/50 lg:pl-8">
                                                <button
                                                    onClick={() => handleBookFlight(flight.id)}
                                                    className={`w-full lg:w-auto px-8 py-3 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 ${
                                                        availableSeats > 0 
                                                        ? 'bg-gradient-to-r from-blue-600 to-sky-600 hover:shadow-blue-100' 
                                                        : 'bg-gray-400 cursor-not-allowed'
                                                    }`}
                                                    disabled={availableSeats === 0}
                                                >
                                                    {availableSeats > 0 ? 'Select Seat' : 'Sold Out'}
                                                </button>
                                                <div className="mt-2 text-center lg:text-right">
                                                    <span className="text-xs text-gray-500">
                                                        {availableSeats > 0 ? 
                                                            `${availableSeats} seats left` : 
                                                            'Next flight available tomorrow'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {filteredFlights.length === 0 && flights.length > 0 && (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-4xl">✈️</span>
                                </div>
                                <h4 className="text-xl font-semibold text-gray-700 mb-2">No flights found</h4>
                                <p className="text-gray-500 mb-6">Try different search criteria</p>
                                <button
                                    onClick={clearFilters}
                                    className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                                >
                                    Reset Search
                                </button>
                            </div>
                        )}

                        {flights.length === 0 && (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                    <span className="text-4xl">⏳</span>
                                </div>
                                <h4 className="text-xl font-semibold text-gray-700 mb-2">No flights available</h4>
                                <p className="text-gray-500">Check back later for flight schedules</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <footer className="pt-8 border-t border-gray-200/50">
                    <div className="text-center">
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent mb-2">
                            SkyWays Airlines
                        </div>
                        <p className="text-gray-500 text-sm mb-6">
                            Your wings to the world, flying with excellence
                        </p>
                        <div className="flex items-center justify-center space-x-6 mb-6">
                            <span className="text-xs text-gray-400">🛡️ Safe Travel</span>
                            <span className="text-xs text-gray-400">✨ Premium Service</span>
                            <span className="text-xs text-gray-400">⏱️ On-Time Performance</span>
                        </div>
                        <div className="text-xs text-gray-400">
                            © {new Date().getFullYear()} SkyWays Airlines. All rights reserved.
                        </div>
                    </div>
                </footer>
            </div>

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

export default FlightList