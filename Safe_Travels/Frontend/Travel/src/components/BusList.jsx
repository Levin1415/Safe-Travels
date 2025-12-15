import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BusList = () => {
    const [buses, setBuses] = useState([])
    const [filteredBuses, setFilteredBuses] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentSlide, setCurrentSlide] = useState(0)
    const [popularRoutes, setPopularRoutes] = useState([])
    const [availableCities, setAvailableCities] = useState([])
    const [stats, setStats] = useState({
        totalBuses: 0,
        availableSeats: 0,
        routesCovered: 0
    })
    const [activeRoute, setActiveRoute] = useState(null)
    const navigate = useNavigate()

    // Filter states
    const [filters, setFilters] = useState({
        origin: '',
        destination: '',
        busType: '',
        sortBy: 'start_time'
    })

    // Bus type themes
    const busTypeThemes = {
        'ac': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: '❄️' },
        'non-ac': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', icon: '🌡️' },
        'sleeper': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', icon: '🛏️' },
        'seater': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: '💺' },
        'luxury': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: '✨' }
    }

    // Enhanced special offers
    const specialOffers = [
        {
            id: 1,
            title: "FIRST JOURNEY",
            subtitle: "Get 25% off on your first bus booking",
            icon: "🎁",
            image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=60",
            gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            badge: "WELCOME",
            features: ["25% Instant Discount", "Free Cancellation", "Priority Seats"]
        },
        {
            id: 2,
            title: "CASHBACK BONANZA",
            subtitle: "Up to ₹200 cashback on every booking",
            icon: "💸",
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=60",
            gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            badge: "CASHBACK",
            features: ["₹200 Cashback", "All Payment Methods", "Instant Credit"]
        },
        {
            id: 3,
            title: "WEEKEND GETAWAY",
            subtitle: "Special discounts on weekend travel",
            icon: "🏖️",
            image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=60",
            gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            badge: "WEEKEND",
            features: ["Extra 20% Off", "Flexible Dates", "Family Packages"]
        }
    ]

    useEffect(() => {
        const fetchBuses = async() => {
            try {
                const response = await axios.get("http://localhost:8000/api/buses/")
                setBuses(response.data)
                setFilteredBuses(response.data)
                setLoading(false)
                
                // Calculate dynamic stats
                calculateStats(response.data)
                extractCities(response.data)
                calculatePopularRoutes(response.data)
            } catch (error) {
                console.log('error in fetching buses', error)
                toast.error('Failed to load buses')
                setLoading(false)
            }
        }
        fetchBuses()
    }, [])

    // Calculate dynamic statistics
    const calculateStats = (busesData) => {
        const totalBuses = busesData.length
        const availableSeats = busesData.reduce((total, bus) => total + (bus.no_of_seats || 0), 0)
        const routesCovered = new Set(busesData.map(bus => `${bus.origin}-${bus.destination}`)).size
        
        setStats({
            totalBuses,
            availableSeats,
            routesCovered
        })
    }

    // Extract available cities for suggestions
    const extractCities = (busesData) => {
        const allCities = new Set()
        busesData.forEach(bus => {
            allCities.add(bus.origin)
            allCities.add(bus.destination)
        })
        setAvailableCities(Array.from(allCities).sort())
    }

    // Calculate popular routes based on bus count
    const calculatePopularRoutes = (busesData) => {
        const routeCount = {}
        busesData.forEach(bus => {
            const route = `${bus.origin}-${bus.destination}`
            routeCount[route] = (routeCount[route] || 0) + 1
        })
        
        const popular = Object.entries(routeCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 4)
            .map(([route, count]) => {
                const [from, to] = route.split('-')
                return {
                    from,
                    to,
                    buses: count,
                    price: "₹" + Math.floor(Math.random() * 1000) + 500,
                    duration: Math.floor(Math.random() * 10) + 2 + "h"
                }
            })
        
        setPopularRoutes(popular)
    }

    // Auto-slide special offers
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % specialOffers.length)
        }, 4000)
        return () => clearInterval(interval)
    }, [])

    const handleViewSeats = (id) => {
        navigate(`/bus/${id}`)
    }

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value }
        setFilters(newFilters)
        applyFilters(newFilters)
    }

    const applyFilters = (filterData) => {
        let filtered = [...buses]

        // Filter by origin
        if (filterData.origin) {
            filtered = filtered.filter(bus => 
                bus.origin.toLowerCase().includes(filterData.origin.toLowerCase())
            )
        }

        // Filter by destination
        if (filterData.destination) {
            filtered = filtered.filter(bus => 
                bus.destination.toLowerCase().includes(filterData.destination.toLowerCase())
            )
        }

        // Filter by bus type
        if (filterData.busType) {
            filtered = filtered.filter(bus => 
                bus.bus_type === filterData.busType
            )
        }

        // Sort buses
        filtered.sort((a, b) => {
            switch (filterData.sortBy) {
                case 'start_time':
                    return new Date(a.start_time) - new Date(b.start_time)
                case 'reach_time':
                    return new Date(a.reach_time) - new Date(b.reach_time)
                case 'bus_name':
                    return a.bus_name.localeCompare(b.bus_name)
                case 'price_low':
                    return a.price - b.price
                case 'price_high':
                    return b.price - a.price
                default:
                    return 0
            }
        })

        setFilteredBuses(filtered)
    }

    const clearFilters = () => {
        const clearedFilters = {
            origin: '',
            destination: '',
            busType: '',
            sortBy: 'start_time'
        }
        setFilters(clearedFilters)
        setFilteredBuses(buses)
    }

    // Quick filter for popular routes
    const applyPopularRoute = (from, to) => {
        setFilters({
            ...filters,
            origin: from,
            destination: to
        })
        applyFilters({
            ...filters,
            origin: from,
            destination: to
        })
    }

    const getBusTheme = (busType) => {
        const type = busType?.toLowerCase() || 'ac'
        const theme = Object.keys(busTypeThemes).find(key => 
            type.includes(key.toLowerCase())
        )
        return busTypeThemes[theme] || busTypeThemes['ac']
    }

    const handleOfferClick = (offerId) => {
        toast.success(`Applying offer #${offerId}`, {
            icon: '🚌',
            duration: 2000
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading amazing bus options...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            {/* Header Section with Bus-themed Images and Curved Edges */}
            <div className="relative">
                {/* Main Header Image with Curved Bottom */}
                <div className="relative h-80 overflow-hidden">
                    <img 
                        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop" 
                        alt="Bus Travel Welcome"
                        className="w-full h-full object-cover rounded-b-3xl"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-b-3xl">
                        <div className="text-center text-white">
                            <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
                                Safe-Travels
                            </h1>
                            <p className="text-xl font-light drop-shadow-md">
                                Your Journey Begins Here
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 text-center">
                            <div className="text-3xl font-bold text-indigo-600 mb-2">{stats.totalBuses}</div>
                            <div className="text-gray-600">Active Buses</div>
                            <div className="text-xs text-gray-400 mt-1">Ready to travel</div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 text-center">
                            <div className="text-3xl font-bold text-green-600 mb-2">{stats.availableSeats}</div>
                            <div className="text-gray-600">Available Seats</div>
                            <div className="text-xs text-gray-400 mt-1">Book yours now</div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.routesCovered}</div>
                            <div className="text-gray-600">Routes Covered</div>
                            <div className="text-xs text-gray-400 mt-1">Across the country</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 lg:mb-0">Find Your Perfect Bus</h2>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">{filteredBuses.length} buses found</span>
                            {(filters.origin || filters.destination || filters.busType) && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center space-x-2 text-red-500 hover:text-red-600 font-medium text-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    <span>Clear Filters</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">From City</label>
                            <input 
                                type="text"
                                list="cities-origin"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 bg-gray-50"
                                placeholder="Enter origin city"
                                value={filters.origin}
                                onChange={(e) => handleFilterChange('origin', e.target.value)}
                            />
                            <datalist id="cities-origin">
                                {availableCities.map(city => (
                                    <option key={city} value={city} />
                                ))}
                            </datalist>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">To City</label>
                            <input 
                                type="text"
                                list="cities-destination"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 bg-gray-50"
                                placeholder="Enter destination city"
                                value={filters.destination}
                                onChange={(e) => handleFilterChange('destination', e.target.value)}
                            />
                            <datalist id="cities-destination">
                                {availableCities.map(city => (
                                    <option key={city} value={city} />
                                ))}
                            </datalist>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bus Type</label>
                            <select 
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 bg-gray-50"
                                value={filters.busType}
                                onChange={(e) => handleFilterChange('busType', e.target.value)}
                            >
                                <option value="">All Types</option>
                                <option value="ac">AC Buses</option>
                                <option value="non-ac">Non-AC Buses</option>
                                <option value="sleeper">Sleeper Buses</option>
                                <option value="seater">Seater Buses</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                            <select 
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 bg-gray-50"
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                            >
                                <option value="start_time">Departure Time</option>
                                <option value="reach_time">Arrival Time</option>
                                <option value="bus_name">Bus Name</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Popular Routes */}
                {popularRoutes.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Popular Routes</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {popularRoutes.map((route, index) => (
                                <button
                                    key={index}
                                    onClick={() => applyPopularRoute(route.from, route.to)}
                                    className={`p-4 rounded-xl border transition-all duration-300 ${
                                        activeRoute === `${route.from}-${route.to}` 
                                        ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="text-center">
                                        <div className="font-medium text-gray-800">{route.from}</div>
                                        <div className="text-xs text-gray-400 my-1">→</div>
                                        <div className="font-medium text-gray-800">{route.to}</div>
                                        <div className="text-sm text-blue-600 font-semibold mt-2">{route.price}</div>
                                        <div className="text-xs text-gray-500 mt-1">{route.buses} buses • {route.duration}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Special Offers */}
                <div className="relative h-48 mb-8 rounded-xl overflow-hidden shadow-sm">
                    {specialOffers.map((poster, index) => (
                        <div
                            key={poster.id}
                            className={`absolute inset-0 transition-transform duration-500 ease-in-out rounded-xl flex items-center ${
                                index === currentSlide ? 'translate-x-0' : 
                                index < currentSlide ? '-translate-x-full' : 'translate-x-full'
                            }`}
                            style={{ background: poster.gradient }}
                        >
                            <div className="flex w-full h-full">
                                <div className="w-2/3 flex items-center justify-center p-8">
                                    <div className="text-center">
                                        <h3 className="text-3xl font-bold text-white mb-2">{poster.title}</h3>
                                        <p className="text-xl text-white/90 mb-3">{poster.subtitle}</p>
                                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 inline-block border border-white/30">
                                            <span className="font-mono text-lg text-white">Use Code: {poster.badge}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-1/3 relative">
                                    <img 
                                        src={poster.image} 
                                        alt={poster.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Slide Indicators */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {specialOffers.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`w-3 h-3 rounded-full transition-all ${
                                    index === currentSlide ? 'bg-white scale-125' : 'bg-white/50'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Bus List Grid - Square Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                    {filteredBuses.map((item) => {
                        const theme = getBusTheme(item.bus_type)
                        return (
                            <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group">
                                {/* Bus Header */}
                                <div className={`p-4 border-b border-gray-200 ${theme.bg}`}>
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-gray-800">{item.bus_name}</h3>
                                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                                            {item.number}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${theme.text} ${theme.border}`}>
                                            {theme.icon} {item.bus_type?.toUpperCase() || 'STANDARD'}
                                        </span>
                                        {/* Dynamic features from backend */}
                                        {item.features && Array.isArray(item.features) && item.features.includes('ac_sleeper') && (
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">AC Sleeper</span>
                                        )}
                                        {item.features && Array.isArray(item.features) && item.features.includes('luxury') && (
                                            <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs">Luxury</span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Bus Details */}
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-gray-800">{item.origin}</div>
                                            <div className="text-sm text-gray-500">Origin</div>
                                        </div>
                                        <div className="flex-1 mx-4 relative">
                                            <div className="h-px bg-gray-200 absolute top-1/2 left-0 right-0"></div>
                                            <div className="relative z-10 bg-white px-2">
                                                <svg className="w-6 h-6 text-indigo-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-gray-800">{item.destination}</div>
                                            <div className="text-sm text-gray-500">Destination</div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div>
                                                <div className="text-sm text-gray-500">Departure</div>
                                                <div className="font-semibold text-gray-800">{item.start_time}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div>
                                                <div className="text-sm text-gray-500">Arrival</div>
                                                <div className="font-semibold text-gray-800">{item.reach_time}</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <div className="text-lg font-bold text-green-500">
                                            ₹{item.price}
                                            <span className="text-sm text-gray-500 font-normal ml-1">per seat</span>
                                        </div>
                                        <button 
                                            onClick={() => handleViewSeats(item.id)}
                                            className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2 group-hover:scale-105"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            <span>View Seats</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                
                {filteredBuses.length === 0 && buses.length > 0 && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No buses match your filters</h3>
                        <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
                        <button 
                            onClick={clearFilters}
                            className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600"
                        >
                            Clear All Filters
                        </button>
                    </div>
                )}

                {buses.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Buses Available</h3>
                        <p className="text-gray-500">Check back later for available buses</p>
                    </div>
                )}
            </div>

            {/* Footer Section - Same as before */}
            <footer className="bg-gray-800 text-white pt-12 pb-8">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Main Footer Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                        {/* Company Info */}
                        <div>
                            <h3 className="text-xl font-bold mb-4">Safe-Travels</h3>
                            <p className="text-gray-300 mb-4">
                                Online Bus Ticket Booking at Lowest Price. Book bus tickets with Safe-Travels for the best travel experience.
                            </p>
                            <div className="flex space-x-3">
                                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold">FB</span>
                                </div>
                                <div className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold">TW</span>
                                </div>
                                <div className="w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold">IG</span>
                                </div>
                            </div>
                        </div>

                        {/* Bus Types */}
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Bus Types Available</h4>
                            <ul className="space-y-2 text-gray-300">
                                <li>• AC Buses</li>
                                <li>• Non AC Buses</li>
                                <li>• Sleeper AC Buses</li>
                                <li>• Volvo AC Buses</li>
                                <li>• Deluxe Buses</li>
                                <li>• Electric Buses</li>
                                <li>• Express Buses</li>
                            </ul>
                        </div>

                        {/* Benefits */}
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Benefits</h4>
                            <ul className="space-y-2 text-gray-300">
                                <li>• Avoid long queues</li>
                                <li>• Multiple bus services</li>
                                <li>• 24/7 customer support</li>
                                <li>• Free Cancellation</li>
                                <li>• Secure payments</li>
                                <li>• Real-time tracking</li>
                                <li>• Best price guarantee</li>
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
                            <div className="space-y-2 text-gray-300">
                                <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>000000000</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>support@SafeTravels.com</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Footer */}
                    <div className="border-t border-gray-700 pt-6">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <p className="text-gray-400 text-sm mb-4 md:mb-0">
                                © 2025 Safe-Travels. All rights reserved.
                            </p>
                            <div className="flex space-x-6 text-sm text-gray-400">
                                <a href="#" className="hover:text-white">Privacy Policy</a>
                                <a href="#" className="hover:text-white">Terms of Service</a>
                                <a href="#" className="hover:text-white">Refund Policy</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default BusList