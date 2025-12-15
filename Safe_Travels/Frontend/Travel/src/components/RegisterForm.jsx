import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const RegisterForm = ({ onToggleMode, onRegisterSuccess }) => {
    const [form, setForm] = useState({
        username: '', 
        email: '', 
        password: '',
        confirmPassword: ''
    })
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [inputFocus, setInputFocus] = useState({
        username: false,
        email: false,
        password: false,
        confirmPassword: false
    })
    const [strength, setStrength] = useState(0)
    const [isValidEmail, setIsValidEmail] = useState(true)
    const formRef = useRef(null)

    // Password strength checker
    useEffect(() => {
        if (form.password.length === 0) {
            setStrength(0)
            return
        }
        
        let score = 0
        if (form.password.length >= 6) score += 25
        if (/[A-Z]/.test(form.password)) score += 25
        if (/[0-9]/.test(form.password)) score += 25
        if (/[^A-Za-z0-9]/.test(form.password)) score += 25
        
        setStrength(score)
    }, [form.password])

    // Email validation
    useEffect(() => {
        if (form.email.length === 0) {
            setIsValidEmail(true)
            return
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        setIsValidEmail(emailRegex.test(form.email))
    }, [form.email])

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm({...form, [name]: value})
        // Clear error message when user starts typing
        if (message && !message.includes('Successful')) {
            setMessage('')
        }
    }

    const handleFocus = (field) => {
        setInputFocus({ ...inputFocus, [field]: true })
    }

    const handleBlur = (field) => {
        setInputFocus({ ...inputFocus, [field]: false })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')
        
        // Validation
        if (!isValidEmail) {
            setMessage("Please enter a valid email address")
            setLoading(false)
            return
        }
        
        if (form.password !== form.confirmPassword) {
            setMessage("Passwords don't match")
            setLoading(false)
            return
        }
        
        if (form.password.length < 6) {
            setMessage("Password must be at least 6 characters")
            setLoading(false)
            return
        }

        try {
            const response = await axios.post('http://localhost:8000/api/register/', {
                username: form.username,
                email: form.email,
                password: form.password,
                confirm_password: form.confirmPassword
            });
            
            setMessage('Registration Successful! Redirecting to login...')
            
            // Add success animation
            formRef.current.classList.add('animate-success')
            setTimeout(() => {
                formRef.current.classList.remove('animate-success')
            }, 1000)

            // Clear form with animation
            setTimeout(() => {
                setForm({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                })
            }, 500)
            
            // Call success callback
            if (onRegisterSuccess) {
                onRegisterSuccess(response.data)
            }
            
            // Auto switch to login after delay
            setTimeout(() => {
                if (onToggleMode) {
                    onToggleMode('login')
                }
            }, 2000)
            
        } catch (error) {
            const errorMessage = error.response?.data?.username?.[0] || 
                               error.response?.data?.email?.[0] || 
                               error.response?.data?.password?.[0] ||
                               error.response?.data?.message ||
                               "Registration failed. Please try again."
            setMessage(errorMessage)
            
            // Add error shake animation
            formRef.current.classList.add('animate-shake')
            setTimeout(() => {
                formRef.current.classList.remove('animate-shake')
            }, 500)
        }
        setLoading(false)
    }

    const togglePasswordVisibility = (field) => {
        if (field === 'password') {
            setShowPassword(!showPassword)
        } else {
            setShowConfirmPassword(!showConfirmPassword)
        }
    }

    const getStrengthColor = () => {
        if (strength < 25) return 'bg-red-500'
        if (strength < 50) return 'bg-orange-500'
        if (strength < 75) return 'bg-yellow-500'
        return 'bg-green-500'
    }

    const getStrengthText = () => {
        if (strength < 25) return 'Very Weak'
        if (strength < 50) return 'Weak'
        if (strength < 75) return 'Fair'
        return 'Strong'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 overflow-hidden relative">
            {/* Animated Background Grid */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.03]"></div>
            
            {/* Subtle Gradient Orbs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-green-500/5 to-blue-500/5 rounded-full blur-3xl"></div>

            <div 
                ref={formRef}
                className="max-w-md w-full relative z-10"
            >
                {/* Glass Morphism Card */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/30 dark:border-gray-700/30">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Create Account
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Join thousands of happy travelers
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Username
                            </label>
                            <div className={`relative transition-all duration-200 ${inputFocus.username ? 'ring-2 ring-blue-500/20' : ''}`}>
                                <input 
                                    name="username"
                                    type="text"
                                    required
                                    value={form.username}
                                    onChange={handleChange}
                                    onFocus={() => handleFocus('username')}
                                    onBlur={() => handleBlur('username')}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="johndoe"
                                />
                                <div className="absolute right-3 top-3 text-gray-400 dark:text-gray-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email Address
                            </label>
                            <div className={`relative transition-all duration-200 ${inputFocus.email ? 'ring-2 ring-blue-500/20' : ''} ${!isValidEmail && form.email.length > 0 ? 'ring-2 ring-red-500/20' : ''}`}>
                                <input 
                                    name="email"
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={handleChange}
                                    onFocus={() => handleFocus('email')}
                                    onBlur={() => handleBlur('email')}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="you@example.com"
                                />
                                <div className="absolute right-3 top-3">
                                    {form.email.length > 0 && (
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isValidEmail ? 'text-green-500' : 'text-red-500'}`}>
                                            {isValidEmail ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {!isValidEmail && form.email.length > 0 && (
                                <p className="text-xs text-red-500 animate-fadeIn">Please enter a valid email address</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('password')}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            <div className={`relative transition-all duration-200 ${inputFocus.password ? 'ring-2 ring-blue-500/20' : ''}`}>
                                <input 
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={form.password}
                                    onChange={handleChange}
                                    onFocus={() => handleFocus('password')}
                                    onBlur={() => handleBlur('password')}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200 placeholder-gray-400 dark:placeholder-gray-500 pr-10"
                                    placeholder="••••••••"
                                />
                            </div>
                            
                            {/* Password Strength Meter */}
                            {form.password.length > 0 && (
                                <div className="space-y-1 animate-fadeIn">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-600 dark:text-gray-400">Password strength:</span>
                                        <span className={`font-medium ${
                                            strength < 25 ? 'text-red-500' :
                                            strength < 50 ? 'text-orange-500' :
                                            strength < 75 ? 'text-yellow-500' : 'text-green-500'
                                        }`}>
                                            {getStrengthText()}
                                        </span>
                                    </div>
                                    <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${getStrengthColor()} transition-all duration-300 ease-out`}
                                            style={{ width: `${strength}%` }}
                                        />
                                    </div>
                                    <ul className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
                                        <li className={`flex items-center ${form.password.length >= 6 ? 'text-green-500' : ''}`}>
                                            <svg className={`w-3 h-3 mr-1 ${form.password.length >= 6 ? '' : 'hidden'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            At least 6 characters
                                        </li>
                                        <li className={`flex items-center ${/[A-Z]/.test(form.password) ? 'text-green-500' : ''}`}>
                                            <svg className={`w-3 h-3 mr-1 ${/[A-Z]/.test(form.password) ? '' : 'hidden'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            One uppercase letter
                                        </li>
                                        <li className={`flex items-center ${/[0-9]/.test(form.password) ? 'text-green-500' : ''}`}>
                                            <svg className={`w-3 h-3 mr-1 ${/[0-9]/.test(form.password) ? '' : 'hidden'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            One number
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Confirm Password
                                </label>
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                >
                                    {showConfirmPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            <div className={`relative transition-all duration-200 ${inputFocus.confirmPassword ? 'ring-2 ring-blue-500/20' : ''} ${form.confirmPassword.length > 0 && form.password !== form.confirmPassword ? 'ring-2 ring-red-500/20' : ''}`}>
                                <input 
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    onFocus={() => handleFocus('confirmPassword')}
                                    onBlur={() => handleBlur('confirmPassword')}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="••••••••"
                                />
                                {form.confirmPassword.length > 0 && (
                                    <div className="absolute right-3 top-3">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${form.password === form.confirmPassword ? 'text-green-500' : 'text-red-500'}`}>
                                            {form.password === form.confirmPassword ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
                                <p className="text-xs text-red-500 animate-fadeIn">Passwords do not match</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full relative bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                        >
                            <div className="relative flex items-center justify-center space-x-2">
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Creating account...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                        <span>Create Account</span>
                                    </>
                                )}
                            </div>
                        </button>

                        {/* Message Display */}
                        {message && (
                            <div className={`animate-fadeIn p-4 rounded-xl border ${
                                message.includes('Successful') 
                                    ? 'bg-green-50/50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' 
                                    : 'bg-red-50/50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                            }`}>
                                <div className="flex items-center space-x-3">
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                        message.includes('Successful') 
                                            ? 'bg-green-100 dark:bg-green-800/30' 
                                            : 'bg-red-100 dark:bg-red-800/30'
                                    }`}>
                                        {message.includes('Successful') ? (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="text-sm">{message}</div>
                                </div>
                            </div>
                        )}
                    </form>

                    {/* Features List */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50/50 to-green-50/50 dark:from-blue-900/10 dark:to-green-900/10 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
                        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Why Join Us?</h4>
                        <ul className="space-y-1">
                            {[
                                "Real-time seat availability",
                                "Secure payment options",
                                "Booking history & management",
                                "Exclusive member discounts"
                            ].map((feature, index) => (
                                <li key={index} className="text-xs text-blue-700 dark:text-blue-400 flex items-center">
                                    <svg className="w-3 h-3 mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Login Redirect */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => onToggleMode?.('login')}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                            >
                                Sign in here
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            {/* Add CSS for animations */}
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }

                @keyframes success {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }

                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }

                .animate-success {
                    animation: success 1s ease;
                }

                .bg-grid-pattern {
                    background-image: 
                        linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px);
                    background-size: 50px 50px;
                }

                .dark .bg-grid-pattern {
                    background-image: 
                        linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
                }
            `}</style>
        </div>
    )
}

export default RegisterForm