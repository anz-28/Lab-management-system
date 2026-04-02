import React, { useState, useEffect } from 'react'
import './User.css'
import Header from '../../Components/Header'
import { useAuth } from '../../Context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ref, onValue } from 'firebase/database'
import { db } from '../../FirebaseConfig'

function User() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [userBookings, setUserBookings] = useState([])

  // Fetch user data
  useEffect(() => {
    if (user) {
      const userRef = ref(db, 'users/' + user.uid)
      onValue(userRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          setUserData(data)
        }
      })

      // Fetch user's bookings
      const bookingsRef = ref(db, 'bookings')
      onValue(bookingsRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const userBookings = Object.values(data).filter(booking => booking.userId === user.uid)
          setUserBookings(userBookings)
        }
      })
    }
  }, [user])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (!userData) {
    return <div>Loading...</div>
  }

  return (
    <>
      <Header/>
      <div id="user-page">

        <div id="user-card">
          <p>User name :- {userData.name || 'N/A'}</p>
          <p>Email :- {userData.email}</p>
          <p>Member since :- {new Date(userData.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Display user's bookings */}
        <div style={{marginTop: '30px'}}>
          <h3>Your Bookings</h3>
          {userBookings.length > 0 ? (
            <div>
              {userBookings.map((booking, index) => (
                <div key={index} style={{border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '4px'}}>
                  <p><strong>System:</strong> {booking.system}</p>
                  <p><strong>Start Time:</strong> {booking.startTime}:00</p>
                  <p><strong>Duration:</strong> {booking.tenure} hours</p>
                  <p><strong>Status:</strong> {booking.status}</p>
                  <p style={{fontSize: '0.8em', color: '#666'}}>Booked: {new Date(booking.bookingDate).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No bookings yet.</p>
          )}
        </div>

        <button id="logout-btn" onClick={handleLogout}>Logout</button>

      </div>
    </>
  )
}

export default User