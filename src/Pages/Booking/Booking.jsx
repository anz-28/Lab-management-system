import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import './Booking.css'
import Header from '../../Components/Header'
import { useAuth } from '../../Context/AuthContext'
import { ref, push, set, runTransaction, onValue, update } from 'firebase/database'
import { db } from '../../FirebaseConfig'

const formatDayKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toMinutes = (timeValue) => {
  if (timeValue === null || timeValue === undefined || timeValue === '') return NaN

  if (typeof timeValue === 'number') {
    if (Number.isNaN(timeValue)) return NaN
    return timeValue * 60
  }

  const normalizedTime = String(timeValue).trim()
  if (!normalizedTime) return NaN

  if (normalizedTime.includes(':')) {
    const [hours, minutes] = normalizedTime.split(':').map(Number)
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN
    return (hours * 60) + minutes
  }

  const hours = Number(normalizedTime)
  if (Number.isNaN(hours)) return NaN
  return hours * 60
}

const minutesToTimeLabel = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

const buildReservedSlots = (startMinutes, durationHours) => {
  const slots = []
  for (let hourOffset = 0; hourOffset < durationHours; hourOffset += 1) {
    slots.push(minutesToTimeLabel(startMinutes + (hourOffset * 60)))
  }
  return slots
}

const toDurationHours = (tenureValue) => {
  if (tenureValue === null || tenureValue === undefined || tenureValue === '') return NaN

  if (typeof tenureValue === 'number') return tenureValue

  const normalizedTenure = String(tenureValue).trim()
  if (!normalizedTenure) return NaN

  const parsedTenure = Number(normalizedTenure)
  if (!Number.isNaN(parsedTenure)) return parsedTenure

  const matchedNumber = normalizedTenure.match(/\d+(\.\d+)?/)
  return matchedNumber ? Number(matchedNumber[0]) : NaN
}

function Booking() {
  const { labId } = useParams()
  const { user } = useAuth()
  const [currentLab, setCurrentLab] = useState(null)
  const [labLoading, setLabLoading] = useState(true)
  const [unavailableSystems, setUnavailableSystems] = useState(new Set())
  const [bookedSystems, setBookedSystems] = useState(new Set())
  const [labBookings, setLabBookings] = useState([])
  const [bookingData, setBookingData] = useState({
    system: '',
    startTime: '',
    tenure: ''
  })
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const bookingsRef = ref(db, 'bookings')
    const unsubscribe = onValue(bookingsRef, async (snapshot) => {
      if (!snapshot.exists()) return

      const bookingsData = snapshot.val()
      const todayKey = formatDayKey(new Date())

      const staleActiveBookings = Object.entries(bookingsData).filter(([, booking]) => {
        const status = String(booking?.status || '').toLowerCase()
        const isActive = status === 'confirmed' || status === 'active' || status === 'open'
        if (!isActive) return false

        if (booking?.bookingDay) {
          return booking.bookingDay < todayKey
        }

        if (booking?.bookingDate) {
          const bookingDate = new Date(booking.bookingDate)
          if (Number.isNaN(bookingDate.getTime())) return false
          return formatDayKey(bookingDate) < todayKey
        }

        return false
      })

      for (const [bookingId, booking] of staleActiveBookings) {
        try {
          if (booking.bookedSlots && booking.system && booking.bookingDay) {
            const systemLockRef = ref(db, `bookingLocks/${booking.bookingDay}/${booking.system}`)
            await runTransaction(systemLockRef, (currentData) => {
              if (!currentData || !currentData.reservedSlots) return currentData

              const nextReservedSlots = { ...currentData.reservedSlots }
              booking.bookedSlots.forEach((slot) => {
                if (nextReservedSlots[slot] === bookingId) {
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

          const bookingRef = ref(db, `bookings/${bookingId}`)
          await update(bookingRef, {
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            terminationReason: 'end-of-day-auto-termination'
          })
        } catch (error) {
          console.error('Error during end-of-day termination:', error)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!labId) {
      setCurrentLab(null)
      setLabLoading(false)
      return
    }

    const labRef = ref(db, `labs/${labId}`)
    const unsubscribe = onValue(labRef, (snapshot) => {
      if (snapshot.exists()) {
        const labData = snapshot.val()
        setCurrentLab({
          id: labId,
          name: labData.name || labId.toUpperCase(),
          prefix: labData.prefix || labId.toUpperCase(),
          systems: Number(labData.total) || 0,
        })
      } else {
        setCurrentLab(null)
      }
      setLabLoading(false)
    })

    return () => unsubscribe()
  }, [labId])

  useEffect(() => {
    if (!labId) {
      setUnavailableSystems(new Set())
      return
    }

    const reportsRef = ref(db, 'reports')
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setUnavailableSystems(new Set())
        return
      }

      const reportsData = snapshot.val()
      const blockedSystems = new Set()

      Object.values(reportsData).forEach((report) => {
        const isSameLab = report.labNumber === labId
        const isActiveIssue = report.status !== 'resolved'
        const isBlockedType = report.reportType === 'broken' || report.reportType === 'maintenance'

        if (isSameLab && isActiveIssue && isBlockedType && report.systemNumber) {
          blockedSystems.add(String(report.systemNumber))
        }
      })

      setUnavailableSystems(blockedSystems)
    })

    return () => unsubscribe()
  }, [labId])

  useEffect(() => {
    if (!labId) {
      setLabBookings([])
      return
    }

    const bookingsRef = ref(db, 'bookings')
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setLabBookings([])
        return
      }

      const bookingsData = snapshot.val()
      const bookingsForLab = Object.values(bookingsData).filter((booking) => booking.lab === labId)
      setLabBookings(bookingsForLab)
    })

    return () => unsubscribe()
  }, [labId])

  useEffect(() => {
    const recomputeBookedSystems = () => {
      const now = Date.now()
      const activeBookedSystems = new Set()

      labBookings.forEach((booking) => {
        const status = String(booking.status || '').toLowerCase()
        const isActiveBooking = status === 'confirmed' || status === 'active' || status === 'open'
        if (!isActiveBooking || !booking.system) return

        const startMinutes = toMinutes(booking.startTime)
        const durationHours = toDurationHours(booking.tenure)

        // If booking timing is malformed, keep it hidden to avoid double booking.
        if (Number.isNaN(startMinutes) || Number.isNaN(durationHours) || durationHours <= 0) {
          const fallbackMatch = String(booking.system).match(/SYS(\d+)$/)
          if (fallbackMatch) activeBookedSystems.add(fallbackMatch[1])
          return
        }

        const bookingDateSource = booking.bookingDay
          ? `${booking.bookingDay}T00:00:00`
          : booking.bookingDate

        const bookingDate = bookingDateSource ? new Date(bookingDateSource) : null
        if (!bookingDate || Number.isNaN(bookingDate.getTime())) return

        const startDateTime = new Date(bookingDate)
        const startHour = Math.floor(startMinutes / 60)
        const startMinute = startMinutes % 60
        startDateTime.setHours(startHour, startMinute, 0, 0)

        const endDateTime = new Date(startDateTime.getTime() + (durationHours * 60 * 60 * 1000))
        if (endDateTime.getTime() > now) {
          const systemNumberMatch = String(booking.system).match(/SYS(\d+)$/)
          if (systemNumberMatch) {
            activeBookedSystems.add(systemNumberMatch[1])
          }
        }
      })

      setBookedSystems(activeBookedSystems)
    }

    recomputeBookedSystems()
    const intervalId = setInterval(recomputeBookedSystems, 30000)

    return () => clearInterval(intervalId)
  }, [labBookings])

  useEffect(() => {
    if (!bookingData.system) return

    const selectedSystemNumber = bookingData.system.match(/SYS(\d+)$/)?.[1]
    if (selectedSystemNumber && (unavailableSystems.has(selectedSystemNumber) || bookedSystems.has(selectedSystemNumber))) {
      setBookingData((prevState) => ({
        ...prevState,
        system: ''
      }))
    }
  }, [bookingData.system, unavailableSystems, bookedSystems])

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

    if (!currentLab) {
      setMessage('This lab is not available')
      setIsError(true)
      return
    }
    
    if (!bookingData.system || !bookingData.startTime || !bookingData.tenure) {
      setMessage('Please fill all fields')
      setIsError(true)
      return
    }

    setLoading(true)
    try {
      const currentDay = formatDayKey(new Date())
      const requestedStart = toMinutes(bookingData.startTime)
      const requestedDuration = toDurationHours(bookingData.tenure)

      // const now = new Date()
      // const currentMinutes = (now.getHours() * 60) + now.getMinutes()

      // if (!Number.isNaN(requestedStart) && requestedStart <= currentMinutes) {
      //   setMessage('Your selected time has already passed')
      //   setIsError(true)
      //   return
      // }

      if (
        Number.isNaN(requestedStart)
        || Number.isNaN(requestedDuration)
        || requestedDuration <= 0
      ) {
        setMessage('Invalid booking time or tenure')
        setIsError(true)
        return
      }

      if (!Number.isInteger(requestedDuration)) {
        setMessage('Tenure must be in whole hours')
        setIsError(true)
        return
      }

      const reservedSlots = buildReservedSlots(requestedStart, requestedDuration)

      const newBookingRef = push(ref(db, 'bookings'))
      const bookingId = newBookingRef.key
      if (!bookingId) {
        setMessage('Unable to create booking. Please try again')
        setIsError(true)
        return
      }

      const systemDayLockRef = ref(db, `bookingLocks/${currentDay}/${bookingData.system}`)
      const lockResult = await runTransaction(systemDayLockRef, (currentData) => {
        const lockData = currentData || {}
        const currentReservedSlots = lockData.reservedSlots || {}

        const hasAnyConflict = reservedSlots.some((slot) => Boolean(currentReservedSlots[slot]))
        if (hasAnyConflict) {
          return
        }

        const nextReservedSlots = { ...currentReservedSlots }
        reservedSlots.forEach((slot) => {
          nextReservedSlots[slot] = bookingId
        })

        return {
          ...lockData,
          reservedSlots: nextReservedSlots
        }
      })

      if (!lockResult.committed) {
        setMessage('This system is already booked for an overlapping time slot today')
        setIsError(true)
        return
      }

      try {
        await set(newBookingRef, {
          userId: user.uid,
          userEmail: user.email,
          lab: labId,
          system: bookingData.system,
          startTime: bookingData.startTime,
          tenure: bookingData.tenure,
          bookingDay: currentDay,
          bookedSlots: reservedSlots,
          bookingDate: new Date().toISOString(),
          status: 'confirmed'
        })
      } catch (saveError) {
        await runTransaction(systemDayLockRef, (currentData) => {
          if (!currentData || !currentData.reservedSlots) return currentData

          const nextReservedSlots = { ...currentData.reservedSlots }
          reservedSlots.forEach((slot) => {
            if (nextReservedSlots[slot] === bookingId) {
              delete nextReservedSlots[slot]
            }
          })

          return {
            ...currentData,
            reservedSlots: nextReservedSlots
          }
        })

        throw saveError
      }

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

  if (labLoading) {
    return (
      <div className="booking-page">
        <Header></Header>
        <div id="bigdiv">
          <h1>Loading lab...</h1>
        </div>
      </div>
    )
  }

  if (!currentLab) {
    return (
      <div className="booking-page">
        <Header></Header>
        <div id="bigdiv">
          <h1>Lab not found</h1>
          <p className="booking-note">This lab was removed or is not configured by admin.</p>
        </div>
      </div>
    )
  }

  return (<>
 
    <div className="booking-page">
       <Header></Header>
      <div id="bigdiv">
          <h1>{currentLab.name}</h1>

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
                {Array.from({ length: currentLab.systems }, (_, index) => {
                  const systemNumber = index + 1
                  const systemNumberKey = String(systemNumber)
                  if (unavailableSystems.has(systemNumberKey) || bookedSystems.has(systemNumberKey)) return null

                  const prefix = currentLab.prefix
                  return (
                    <option key={systemNumber} value={`${prefix}-SYS${systemNumber}`}>
                      {`${prefix} - System ${systemNumber}`}
                    </option>
                  )
                })}
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
                <option value="08:30">8:30 AM</option>
                <option value="09:30">9:30 AM</option>
                <option value="10:30">10:30 AM</option>
                <option value="11:30">11:30 AM</option>
                <option value="12:30">12:30 PM</option>
                <option value="13:30">1:30 PM</option>
                <option value="14:30">2:30 PM</option>
                <option value="15:30">3:30 PM</option>
                <option value="16:30">4:30 PM</option>
                <option value="17:30">5:30 PM</option>
              </select>

              <span className="inline-label">Tenure :-</span>
              <select
                id="tenure"
                name="tenure"
                className="tenure-select"
                value={bookingData.tenure}
                onChange={handleChange}
              >
                <option value=""></option>
                <option value="1">1 Hour</option>
                <option value="2">2 Hours</option>
                <option value="3">3 Hours</option>
                <option value="4">4 Hours</option>
              </select>
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
        Systems that don't appear on the list are either booked, under maintenance, or broken
      </p>
</div>
    
    </>
  )
}

export default Booking