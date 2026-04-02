import React, { useState } from 'react'
import './Booking.css'
import Header from '../../Components/Header'
import { useAuth } from '../../Context/AuthContext'
import { ref, push, set } from 'firebase/database'
import { db } from '../../FirebaseConfig'

function Booking() {
  const { user } = useAuth()
  const [bookingData, setBookingData] = useState({
    system: '',
    startTime: '',
    tenure: ''
  })
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setBookingData(prevState => ({
      ...prevState,
      [name]: value
    }))
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    setMessage('')
    setIsError(false)
    
    if (!bookingData.system || !bookingData.startTime || !bookingData.tenure) {
      setMessage('Please fill all fields')
      setIsError(true)
      return
    }

    setLoading(true)
    try {
      // Save booking to Firebase
      const bookingRef = ref(db, 'bookings')
      await push(bookingRef, {
        userId: user.uid,
        userEmail: user.email,
        system: bookingData.system,
        startTime: bookingData.startTime,
        tenure: bookingData.tenure,
        bookingDate: new Date().toISOString(),
        status: 'confirmed'
      })

      setMessage('Booking confirmed successfully!')
      setIsError(false)
      setBookingData({ system: '', startTime: '', tenure: '' })
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error confirming booking: ' + error.message)
      setIsError(true)
      console.error('Booking error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (<>
 
    <div className="booking-page">
       <Header></Header>
      <div id="bigdiv">
          <h1>LAB1</h1>

          <div className="booking-form">
            <div className="field-row">
              <label htmlFor="system">Select System for Booking :-</label>
              <select 
                id="system" 
                name="system" 
                className="select-system"
                value={bookingData.system}
                onChange={handleChange}
              >
                <option value=""></option>
                <option value="sys1">System 1</option>
                <option value="sys2">System 2</option>
              </select>
            </div>

            <div className="field-row">
              <label htmlFor="startTime">Starting Time :-</label>
              <select 
                id="startTime" 
                name="startTime" 
                className="select-time"
                value={bookingData.startTime}
                onChange={handleChange}
              >
                <option value=""></option>
                <option value="9">9:00</option>
                <option value="10">10:00</option>
                <option value="11">11:00</option>
                <option value="12">12:00</option>
              </select>

              <span className="inline-label">Tenure :-</span>
              <input
                type="number"
                className="tenure-input"
                name="tenure"
                min="1"
                max="4"
                value={bookingData.tenure}
                onChange={handleChange}
              />
            </div>

            
            <button 
              className="confirm-btn" 
              onClick={handleBooking}
              disabled={loading}
            >
              {loading ? 'Confirming...' : 'Confirm Booking'}
            </button>

          </div>
      </div>

      {message && (
        <p className={`booking-message ${isError ? 'error' : 'success'}`}>
          {message}
        </p>
      )}

      <p className="booking-note">
        Systems that don't appear on the list are either in use, under maintenance or broken
      </p>
</div>
    
    </>
  )
}

export default Booking