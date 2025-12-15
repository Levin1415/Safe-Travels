import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import RegisterForm from './components/RegisterForm'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import BusList from './components/BusList'
import BusSeats from './components/BusSeats'
import TrainList from './components/TrainList'
import TrainBooking from './components/TrainBooking'
import FlightList from './components/FlightList'
import FlightSeats from './components/FlightSeats'
import UserBookings from './components/UserBookings'
import Wrapper from './components/Wrapper'

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const navigate = useNavigate();

  const [selectedBusId, setSelectedBusId] = useState(null)

  const handleLogin = (token, userId)=>{
    localStorage.setItem('token', token)
    localStorage.setItem('userId', userId)
    setToken(token)
    setUserId(userId)
  }
  
  const handleLogout = ()=>{
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    setToken(null)
    setUserId(null)
    setSelectedBusId(null)
  }

  // Function to navigate to register page
  const handleNavigateToRegister = () => {
    navigate('/register');
  }

  // Protected Route component
  const ProtectedRoute = ({ children }) => {
    return token ? children : <Navigate to="/login" />
  }

  // Public Route component (redirect to home if already logged in)
  const PublicRoute = ({ children }) => {
    return !token ? children : <Navigate to="/" />
  }

  return (
    <div>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Wrapper token={token} handleLogout={handleLogout}>
        <Routes>
          {/* Public routes */}
          <Route 
            path='/register' 
            element={
              <PublicRoute>
                <RegisterForm onNavigateToLogin={() => navigate('/login')} />
              </PublicRoute>
            }
          />
          <Route 
            path='/login' 
            element={
              <PublicRoute>
                <LoginForm onLogin={handleLogin} onNavigateToRegister={handleNavigateToRegister}/>
              </PublicRoute>
            }
          />
          
          {/* Protected routes */}
          <Route 
            path='/' 
            element={
              <ProtectedRoute>
                <BusList onSelectBus={(id)=>setSelectedBusId(id)} token={token}/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path='/buses' 
            element={
              <ProtectedRoute>
                <BusList onSelectBus={(id)=>setSelectedBusId(id)} token={token}/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path='/bus/:busId' 
            element={
              <ProtectedRoute>
                <BusSeats token={token}/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path='/trains' 
            element={
              <ProtectedRoute>
                <TrainList token={token}/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path='/train/:trainId' 
            element={
              <ProtectedRoute>
                <TrainBooking token={token}/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path='/flights' 
            element={
              <ProtectedRoute>
                <FlightList token={token}/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path='/flight/:flightId' 
            element={
              <ProtectedRoute>
                <FlightSeats token={token}/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path='/my-bookings' 
            element={
              <ProtectedRoute>
                <UserBookings token={token} userId={userId} />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Wrapper>
    </div>
  )
}

export default App