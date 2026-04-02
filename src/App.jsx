import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { set, ref, push } from 'firebase/database'
import db from './FirebaseConfig'
import { AuthProvider, useAuth } from './Context/AuthContext'
import Home from './Pages/Home/Home'
import Login from './Pages/Login/Login'
import Report from './Pages/Report/Report'
import User from './Pages/User/User'
import Booking from './Pages/Booking/Booking'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
      <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
      <Route path="/user" element={<ProtectedRoute><User /></ProtectedRoute>} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App
