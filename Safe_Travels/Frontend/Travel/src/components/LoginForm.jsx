import React, { useState, useEffect } from 'react'
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
    const [particles, setParticles] = useState([])
    const [formTilt, setFormTilt] = useState({ x: 0, y: 0 })

    // Generate floating particles
    useEffect(() => {
        const particleCount = 15
        const newParticles = Array.from({ length: particleCount }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 1,
            speed: Math.random() * 0.5 + 0.2,
            direction: Math.random() > 0.5 ? 1 : -1
        }))
        setParticles(newParticles)
    }, [])

    // Mouse move effect for 3D tilt
    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        setFormTilt({
            x: (y - centerY) / 20,
            y: -(x - centerX) / 20
        })
    }

    const handleMouseLeave = () => {
        setFormTilt({ x: 0, y: 0 })
    }

    const handleChange = (e) => {
        setForm({...form, [e.target.name]: e.target.value})
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
        
        try {
            const response = await axios.post(`http://localhost:8000/api/login/`, 
                { username: form.username, password: form.password }
            )
            
            setMessage('Login Successful! Redirecting...')
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
            
            // Add shake animation on error
            document.querySelector('.login-form-container').classList.add('animate-shake')
            setTimeout(() => {
                document.querySelector('.login-form-container').classList.remove('animate-shake')
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
        setMessage('Demo credentials loaded. Click Sign in to continue.')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 overflow-hidden relative">
            {/* Animated Background Grid */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10"></div>
            
            {/* Floating Particles */}
            <div className="absolute inset-0">
                {particles.map((particle, i) => (
                    <div 
                        key={i}
                        className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 dark:from-blue-500/10 dark:to-purple-500/10"
                        style={{
                            left: `${particle.x}%`,
                            top: `${particle.y}%`,
                            width: `${particle.size}px`,
                            height: `${particle.size}px`,
                            animation: `float ${3 + particle.speed}s ease-in-out infinite`,
                            animationDelay: `${i * 0.2}s`,
                            transform: `translateY(${Math.sin(i) * 10}px)`
                        }}
                    />
                ))}
            </div>

            {/* Floating Shapes */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>

            <div 
                className="max-w-md w-full relative z-10 login-form-container"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    transform: `perspective(1000px) rotateX(${formTilt.x}deg) rotateY(${formTilt.y}deg)`,
                    transition: 'transform 0.2s ease-out'
                }}
            >
                {/* Glass Morphism Card */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/20 relative overflow-hidden">
                    {/* Dynamic Gradient Border */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl opacity-10 blur-lg animate-gradient-xy"></div>
                    
                    {/* Header */}
                    <div className="text-center mb-10 relative">
                        <div className="w-20 h-20 mx-auto mb-6 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl rotate-45 animate-spin-slow"></div>
                            <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center">
                                <svg className="w-10 h-10 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                            Welcome
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Sign in to continue your journey</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Username
                            </label>
                            <div className={`relative transition-all duration-300 ${inputFocus.username ? 'scale-[1.02]' : ''}`}>
                                <input 
                                    name="username"
                                    type="text"
                                    required
                                    value={form.username}
                                    onChange={handleChange}
                                    onFocus={() => handleFocus('username')}
                                    onBlur={() => handleBlur('username')}
                                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="Enter username"
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
                            <div className={`relative transition-all duration-300 ${inputFocus.password ? 'scale-[1.02]' : ''}`}>
                                <input 
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={form.password}
                                    onChange={handleChange}
                                    onFocus={() => handleFocus('password')}
                                    onBlur={() => handleBlur('password')}
                                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="••••••••"
                                />
                                <div className="absolute right-3 top-3 text-gray-400 dark:text-gray-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Quick Demo Button */}
                        <button
                            type="button"
                            onClick={handleQuickDemo}
                            className="w-full text-sm text-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
                        >
                            Try demo credentials
                        </button>

                        {/* Submit Button */}
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full group relative overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-700 text-white py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <div className="relative flex items-center justify-center space-x-2">
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign in</span>
                                        <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </div>
                        </button>

                        {/* Message Display */}
                        {message && (
                            <div className={`animate-fadeInUp p-4 rounded-xl border ${
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
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="text-sm">{message}</div>
                                </div>
                            </div>
                        )}
                    </form>

                    {/* Divider */}
                    <div className="my-8 flex items-center">
                        <div className="flex-grow border-t border-gray-300/50 dark:border-gray-600/50"></div>
                        <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-sm">or</span>
                        <div className="flex-grow border-t border-gray-300/50 dark:border-gray-600/50"></div>
                    </div>

                    {/* Register Link */}
                    <div className="text-center">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            New here?{' '}
                            <button
                                type="button"
                                onClick={onNavigateToRegister}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                            >
                                Create account
                            </button>
                        </p>
                    </div>
                </div>

                {/* Watermark */}
                <div className="absolute -bottom-10 right-0 text-gray-400 dark:text-gray-600 text-sm">
                    v2.0
                </div>
            </div>

            {/* Add CSS for animations */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(180deg); }
                }
                
                @keyframes gradient-xy {
                    0%, 100% { background-position: 0% 0%; }
                    50% { background-position: 100% 100%; }
                }
                
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
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
                
                .animate-gradient-xy {
                    background-size: 200% 200%;
                    animation: gradient-xy 3s ease infinite;
                }
                
                .animate-spin-slow {
                    animation: spin 8s linear infinite;
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
                
                .animate-fadeInUp {
                    animation: fadeInUp 0.3s ease-out;
                }
                
                .bg-grid-pattern {
                    background-image: 
                        linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px);
                    background-size: 40px 40px;
                }
                
                .dark .bg-grid-pattern {
                    background-image: 
                        linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

export default LoginForm