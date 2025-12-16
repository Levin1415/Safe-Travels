import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const LoginForm = ({ onLogin, onNavigateToRegister }) => {
    const [form, setForm] = useState({
        username: '', 
        password: '',
    })
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [inputFocus, setInputFocus] = useState({
        username: false,
        password: false
    })
    const [rememberMe, setRememberMe] = useState(false)
    const formRef = useRef(null)

    // Check for saved credentials
    useEffect(() => {
        const savedUsername = localStorage.getItem('savedUsername')
        if (savedUsername) {
            setForm({ ...form, username: savedUsername })
            setRememberMe(true)
        }
    }, [])

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
        
        // Save username if remember me is checked
        if (rememberMe) {
            localStorage.setItem('savedUsername', form.username)
        } else {
            localStorage.removeItem('savedUsername')
        }

        try {
            const response = await axios.post(`http://localhost:8000/api/login/`, 
                { username: form.username, password: form.password }
            )
            
            setMessage('Login Successful! Redirecting...')
            
            // Add success animation
            formRef.current.classList.add('animate-success')
            setTimeout(() => {
                formRef.current.classList.remove('animate-success')
            }, 1000)
            
            if(onLogin){
                // Add slight delay for better UX
                setTimeout(() => {
                    onLogin(response.data.token, response.data.user_id)
                }, 1500)
            }
            
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.error || 
                               "Login Failed - Please check your credentials"
            setMessage(errorMessage)
            
            // Add error shake animation
            formRef.current.classList.add('animate-shake')
            setTimeout(() => {
                formRef.current.classList.remove('animate-shake')
            }, 500)
        }
        setLoading(false)
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword)
    }

    const handleQuickDemo = () => {
        setForm({
            username: 'demo_user',
            password: 'demo_password'
        })
        setRememberMe(true)
        setMessage('Demo credentials loaded. Ready to sign in!')
    }

    const handleForgotPassword = () => {
        setMessage('Password reset feature coming soon!')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 overflow-hidden relative">
            {/* Static Background Grid */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.03]"></div>
            
            {/* Static Gradient Orbs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl"></div>

            <div 
                ref={formRef}
                className="max-w-md w-full relative z-10"
            >
                {/* Glass Morphism Card */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/30 dark:border-gray-700/30">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Sign in to access your account
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
                                    placeholder="Enter your username"
                                />
                                <div className="absolute right-3 top-3 text-gray-400 dark:text-gray-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
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
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="••••••••"
                                />
                                <div className="absolute right-3 top-3 text-gray-400 dark:text-gray-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Remember me
                                </span>
                            </label>
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Quick Demo Button */}
                        <button
                            type="button"
                            onClick={handleQuickDemo}
                            className="w-full text-sm text-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                            Try demo credentials
                        </button>

                        {/* Submit Button */}
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full relative bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                        >
                            <div className="relative flex items-center justify-center space-x-2">
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Sign In</span>
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

                    {/* Divider */}
                    <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-gray-300/50 dark:border-gray-600/50"></div>
                        <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-sm">or</span>
                        <div className="flex-grow border-t border-gray-300/50 dark:border-gray-600/50"></div>
                    </div>

                    {/* Benefits Section */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
                        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Sign in to access</h4>
                        <ul className="space-y-1">
                            {[
                                "Manage your bookings",
                                "Access travel history",
                                "Get exclusive offers",
                                "Save payment methods"
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

                    {/* Register Link */}
                    <div className="text-center">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Don't have an account?{' '}
                            <button
                                type="button"
                                onClick={onNavigateToRegister}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                            >
                                Sign up now
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

export default LoginForm