import React, { useState, useEffect } from 'react'
import './User.css'
import Header from '../../Components/Header'
import { useAuth } from '../../Context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ref, onValue, update, runTransaction } from 'firebase/database'
import { db } from '../../FirebaseConfig'

function User() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [userBookings, setUserBookings] = useState([])
  const [terminatingBookingId, setTerminatingBookingId] = useState('')

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
          const userBookings = Object.entries(data)
            .map(([id, booking]) => ({ ...booking, id }))
            .filter((booking) => booking.userId === user.uid)
          setUserBookings(userBookings)
        } else {
          setUserBookings([])
        }
      })
    }
  }, [user])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const formatStartTime = (timeValue) => {
    if (!timeValue) return 'N/A'
    const normalized = typeof timeValue === 'string' && timeValue.includes(':') ? timeValue : `${timeValue}:00`
    const [hourText, minuteText = '00'] = normalized.split(':')
    const hour24 = Number(hourText)

    if (Number.isNaN(hour24)) return normalized

    const meridiem = hour24 >= 12 ? 'PM' : 'AM'
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
    return `${hour12}:${minuteText} ${meridiem}`
  }

  const handleTerminateBooking = async (booking) => {
    if (!booking?.id) return

    setTerminatingBookingId(booking.id)
    try {
      const bookingRef = ref(db, `bookings/${booking.id}`)

      await update(bookingRef, {
        status: 'cancelled'
      })

      if (booking.bookedSlots && booking.system) {
        const bookingDay = booking.bookingDay || new Date().toISOString().split('T')[0]
        const systemLockRef = ref(db, `bookingLocks/${bookingDay}/${booking.system}`)
        await runTransaction(systemLockRef, (currentData) => {
          if (!currentData || !currentData.reservedSlots) return currentData

          const nextReservedSlots = { ...currentData.reservedSlots }
          booking.bookedSlots.forEach((slot) => {
            if (nextReservedSlots[slot] === booking.id) {
              delete nextReservedSlots[slot]
            }
          })

          if (Object.keys(nextReservedSlots).length === 0) {
            return null
          }

          return {
            ...currentData,
            reservedSlots: nextReservedSlots
          }
        })
      }
    } catch (error) {
      console.error('Error terminating booking:', error)
    } finally {
      setTerminatingBookingId('')
    }
  }

  const getDisplayUsername = () => {
    const usernameFromData = userData?.username || userData?.name
    if (usernameFromData) return usernameFromData

    const fallbackFromAuth = user?.displayName || user?.email?.split('@')[0]
    return fallbackFromAuth || 'User'
  }

  const activeBookings = userBookings.filter((booking) => {
    const status = (booking.status || '').toLowerCase()
    return status === 'confirmed' || status === 'active' || status === 'open'
  })

  if (!userData) {
    return (
      <>
        <Header/>
        <div className="user-loading">Loading profile...</div>
      </>
    )
  }

  return (
    <>
      <Header/>
      <div id="user-page">
        <div id="user-card">
          <h2 className="user-card-title">Profile</h2>
          <div className="user-row">
            <span className="user-row-label">Username</span>
            <span className="user-row-value">{getDisplayUsername()}</span>
          </div>
          <div className="user-row">
            <span className="user-row-label">Member Since</span>
            <span className="user-row-value">{userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>

        <div className="user-bookings-section">
          <h3 className="user-bookings-title">Your Bookings</h3>
          {activeBookings.length > 0 ? (
            <div className="user-bookings-list">
              {activeBookings.map((booking, index) => (
                <div key={index} className="user-booking-card">
                  <div className="user-booking-card-content">
                    <p><strong>System:</strong> {booking.system}</p>
                    <p><strong>Start Time:</strong> {formatStartTime(booking.startTime)}</p>
                    <p><strong>Duration:</strong> {booking.tenure} hours</p>
                    <p><strong>Status:</strong> <span className={`booking-status ${booking.status}`}>{booking.status}</span></p>
                    <p className="booking-date">Booked: {new Date(booking.bookingDate).toLocaleString()}</p>
                  </div>
                  <button
                    className="terminate-booking-btn"
                    onClick={() => handleTerminateBooking(booking)}
                    disabled={terminatingBookingId === booking.id}
                  >
                    {terminatingBookingId === booking.id ? 'Terminating...' : 'Terminate'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-bookings">No active bookings.</p>
          )}
        </div>

        <button id="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </>
  )
}

export default User