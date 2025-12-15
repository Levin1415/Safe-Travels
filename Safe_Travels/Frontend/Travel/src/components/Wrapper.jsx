import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const Wrapper = ({token, handleLogout, children, user}) => {
    const location = useLocation()
    const navigate = useNavigate()
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState(null)

    const logout = () => {
        handleLogout()
        navigate('/')
    }

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/'
        return location.pathname === path || location.pathname.startsWith(path)
    }

    const closeMobileMenu = () => {
        setShowMobileMenu(false)
        setActiveDropdown(null)
    }

    // Close mobile menu when route changes
    useEffect(() => {
        closeMobileMenu()
    }, [location.pathname])

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown && !event.target.closest('.dropdown-container')) {
                setActiveDropdown(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [activeDropdown])

    // Navigation items with icons and themes
    const navItems = [
        { 
            path: '/buses', 
            label: 'Buses', 
            icon: '🚌',
            color: 'from-blue-500 to-cyan-500',
            description: 'Book comfortable bus journeys'
        },
        { 
            path: '/trains', 
            label: 'Trains', 
            icon: '🚂',
            color: 'from-green-500 to-emerald-500',
            description: 'Railway journeys across India'
        },
        { 
            path: '/flights', 
            label: 'Flights', 
            icon: '✈️',
            color: 'from-purple-500 to-pink-500',
            description: 'Domestic & international flights'
        }
    ]

    if (token) {
        navItems.push({
            path: '/my-bookings',
            label: 'My Bookings',
            icon: '📋',
            color: 'from-indigo-500 to-blue-500',
            description: 'Your travel history'
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Navigation Header */}
            <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo and Brand */}
                        <div className="flex items-center space-x-8">
                            <Link to="/" className="flex items-center space-x-3 group">
                                <div className="relative">
                                    <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-3 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                                        <span className="text-xl text-white">✈️</span>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full border-2 border-white"></div>
                                </div>
                                <div>
                                    <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                                        Safe Travels
                                    </span>
                                    <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
                                        Journey with confidence
                                    </p>
                                </div>
                            </Link>
                            
                            {/* Desktop Navigation Links */}
                            <div className="hidden lg:flex items-center space-x-2">
                                {navItems.map((item) => (
                                    <Link 
                                        key={item.path}
                                        to={item.path} 
                                        className="group relative"
                                    >
                                        <div className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-3 ${
                                            isActive(item.path)
                                                ? `text-white bg-gradient-to-r ${item.color} shadow-md` 
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                        title={item.description}
                                        >
                                            <span className="text-lg">{item.icon}</span>
                                            <span className="font-medium">{item.label}</span>
                                            {isActive(item.path) && (
                                                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-t-full"></div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                        
                        {/* User Actions */}
                        <div className="flex items-center space-x-4">
                            {token ? (
                                <div className="flex items-center space-x-4 dropdown-container">
                                    {/* User Profile Dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')}
                                            className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
                                        >
                                            <div className="relative">
                                                <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                                    <span className="text-lg">👤</span>
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full border-2 border-white"></div>
                                            </div>
                                            <div className="hidden md:block text-left">
                                                <div className="text-sm font-medium text-gray-800">
                                                    {user?.username || 'User'}
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center">
                                                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                                                    Online
                                                </div>
                                            </div>
                                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${activeDropdown === 'profile' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        
                                        {/* Dropdown Menu */}
                                        {activeDropdown === 'profile' && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200/50 overflow-hidden z-50">
                                                <div className="p-4 border-b border-gray-100">
                                                    <div className="text-sm font-medium text-gray-800">{user?.username || 'User'}</div>
                                                    <div className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</div>
                                                </div>
                                                <div className="p-2">
                                                    <Link 
                                                        to="/my-bookings"
                                                        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors"
                                                    >
                                                        <span>📋</span>
                                                        <span className="text-sm">My Bookings</span>
                                                    </Link>
                                                    <Link 
                                                        to="/profile"
                                                        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors"
                                                    >
                                                        <span>⚙️</span>
                                                        <span className="text-sm">Profile Settings</span>
                                                    </Link>
                                                    <div className="border-t border-gray-100 mt-2 pt-2">
                                                        <button
                                                            onClick={logout}
                                                            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors w-full"
                                                        >
                                                            <span>🚪</span>
                                                            <span className="text-sm">Logout</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Logout Button */}
                                    <button 
                                        onClick={logout}
                                        className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 hover:text-red-700 rounded-xl font-medium transition-all duration-200 border border-red-100 hover:border-red-200 hover:shadow-sm"
                                    >
                                        <span>🚪</span>
                                        <span>Logout</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <Link to="/register">
                                        <button className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:text-gray-900 rounded-xl font-medium transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm">
                                            <span>📝</span>
                                            <span>Register</span>
                                        </button>
                                    </Link>
                                    <Link to="/login">
                                        <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                                            <span>🔑</span>
                                            <span>Login</span>
                                        </button>
                                    </Link>
                                </div>
                            )}
                            
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                                    <div className={`h-0.5 bg-gray-600 transition-all duration-300 ${showMobileMenu ? 'w-6 rotate-45 translate-y-2' : 'w-6'}`}></div>
                                    <div className={`h-0.5 bg-gray-600 transition-all duration-300 ${showMobileMenu ? 'opacity-0' : 'w-6'}`}></div>
                                    <div className={`h-0.5 bg-gray-600 transition-all duration-300 ${showMobileMenu ? 'w-6 -rotate-45 -translate-y-2' : 'w-6'}`}></div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Mobile Menu */}
                {showMobileMenu && (
                    <div className="lg:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-sm">
                        <div className="px-4 py-3">
                            <div className="space-y-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={closeMobileMenu}
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                            isActive(item.path)
                                                ? `bg-gradient-to-r ${item.color} text-white shadow-sm`
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        <span className="text-xl">{item.icon}</span>
                                        <div className="flex-1">
                                            <div className="font-medium">{item.label}</div>
                                            <div className="text-xs opacity-75">{item.description}</div>
                                        </div>
                                        {isActive(item.path) && (
                                            <span className="text-lg">→</span>
                                        )}
                                    </Link>
                                ))}
                                
                                {/* User Actions in Mobile */}
                                {token ? (
                                    <div className="pt-4 border-t border-gray-200/50 space-y-2">
                                        <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl">
                                            <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                                                <span className="text-lg">👤</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-800">
                                                    {user?.username || 'User'}
                                                </div>
                                                <div className="text-xs text-gray-500">Logged in</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={logout}
                                            className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                                        >
                                            <span>🚪</span>
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pt-4 border-t border-gray-200/50 space-y-2">
                                        <Link
                                            to="/register"
                                            onClick={closeMobileMenu}
                                            className="flex items-center space-x-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                                        >
                                            <span>📝</span>
                                            <span>Register Account</span>
                                        </Link>
                                        <Link
                                            to="/login"
                                            onClick={closeMobileMenu}
                                            className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-md transition-all"
                                        >
                                            <span>🔑</span>
                                            <span>Login to Account</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>
            
            {/* Main Content */}
            <main className="flex-grow">{children}</main>
            
            {/* Footer */}
            <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white pt-8 pb-6">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {/* Brand Info */}
                        <div>
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="bg-gradient-to-r from-indigo-400 to-blue-400 p-2 rounded-lg">
                                    <span className="text-xl">✈️</span>
                                </div>
                                <span className="text-2xl font-bold">Safe Travels</span>
                            </div>
                            <p className="text-gray-400 text-sm mb-4">
                                Your trusted partner for comfortable and safe journeys across India. Book buses, trains, and flights with ease.
                            </p>
                            <div className="flex space-x-3">
                                <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors">
                                    <span className="text-sm">📱</span>
                                </a>
                                <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors">
                                    <span className="text-sm">📧</span>
                                </a>
                                <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors">
                                    <span className="text-sm">🐦</span>
                                </a>
                            </div>
                        </div>
                        
                        {/* Quick Links */}
                        <div>
                            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {navItems.map((item) => (
                                    <Link 
                                        key={item.path}
                                        to={item.path}
                                        className="text-gray-400 hover:text-white text-sm flex items-center space-x-2 transition-colors"
                                    >
                                        <span>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                                <Link to="/help" className="text-gray-400 hover:text-white text-sm flex items-center space-x-2 transition-colors">
                                    <span>❓</span>
                                    <span>Help Center</span>
                                </Link>
                                <Link to="/about" className="text-gray-400 hover:text-white text-sm flex items-center space-x-2 transition-colors">
                                    <span>ℹ️</span>
                                    <span>About Us</span>
                                </Link>
                            </div>
                        </div>
                        
                        {/* Contact Info */}
                        <div>
                            <h4 className="text-lg font-bold mb-4">Contact Us</h4>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors">
                                    <span className="text-lg">📞</span>
                                    <div>
                                        <div className="text-sm">24/7 Support</div>
                                        <div className="text-xs">+91 123-456-7890</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors">
                                    <span className="text-lg">📧</span>
                                    <div>
                                        <div className="text-sm">Email Support</div>
                                        <div className="text-xs">support@safetravels.com</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors">
                                    <span className="text-lg">📍</span>
                                    <div>
                                        <div className="text-sm">Head Office</div>
                                        <div className="text-xs">Mumbai, Maharashtra</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Bottom Footer */}
                    <div className="border-t border-gray-800 pt-6">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <p className="text-gray-500 text-sm mb-4 md:mb-0">
                                © {new Date().getFullYear()} Safe Travels. All journeys reserved.
                            </p>
                            <div className="flex space-x-6 text-sm text-gray-500">
                                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                                <a href="#" className="hover:text-white transition-colors">Refund Policy</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Wrapper