import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext'
import './Admin.css'
import { ref, onValue, remove, set, update } from 'firebase/database'
import { db } from '../../FirebaseConfig'

const TOTAL_SYSTEMS_PER_LAB = 90

function Admin() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [labs, setLabs] = useState([])
  const [bookings, setBookings] = useState([])
  const [reports, setReports] = useState([])
  const [activeTab, setActiveTab] = useState('labs')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form states
  const [newLabData, setNewLabData] = useState({ id: '', name: '' })
  const [newSystemCount, setNewSystemCount] = useState('')
  const [selectedLab, setSelectedLab] = useState('')

  // Fetch labs
  useEffect(() => {
    const labsRef = ref(db, 'labs')
    onValue(labsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const labsArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }))
        setLabs(labsArray)
      }
    })
  }, [])

  // Fetch bookings
  useEffect(() => {
    const bookingsRef = ref(db, 'bookings')
    onValue(bookingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const bookingsArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }))
        setBookings(bookingsArray)
      }
    })
  }, [])

  // Fetch reports
  useEffect(() => {
    const reportsRef = ref(db, 'reports')
    onValue(reportsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const reportsArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }))
        setReports(reportsArray)
      }
    })
  }, [])

  const resetMessage = () => {
    setTimeout(() => setMessage(''), 4000)
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

  // Lab Management
  const handleAddLab = async (e) => {
    e.preventDefault()
    if (!newLabData.id || !newLabData.name) {
      setMessage('Please fill all fields')
      setIsError(true)
      resetMessage()
      return
    }

    setLoading(true)
    try {
      const labRef = ref(db, `labs/${newLabData.id}`)
      await set(labRef, {
        name: newLabData.name,
        prefix: newLabData.id.toUpperCase(),
        total: TOTAL_SYSTEMS_PER_LAB,
        available: TOTAL_SYSTEMS_PER_LAB,
        broken: 0,
        maintenance: 0,
        createdAt: new Date().toISOString()
      })
      setMessage(`Lab "${newLabData.name}" added successfully!`)
      setIsError(false)
      setNewLabData({ id: '', name: '' })
    } catch (error) {
      setMessage('Error adding lab: ' + error.message)
      setIsError(true)
      console.error('Error:', error)
    } finally {
      setLoading(false)
      resetMessage()
    }
  }

  const handleRemoveLab = async (labId) => {
    if (!window.confirm(`Are you sure you want to remove this lab? This will also remove all associated bookings.`)) {
      return
    }

    setLoading(true)
    try {
      const labRef = ref(db, `labs/${labId}`)
      await remove(labRef)
      
      // Remove associated bookings
      const labBookings = bookings.filter(b => b.lab === labId)
      for (const booking of labBookings) {
        await remove(ref(db, `bookings/${booking.id}`))
      }

      setMessage('Lab and associated data removed successfully!')
      setIsError(false)
    } catch (error) {
      setMessage('Error removing lab: ' + error.message)
      setIsError(true)
      console.error('Error:', error)
    } finally {
      setLoading(false)
      resetMessage()
    }
  }

  // System Management
  const handleAddSystems = async (e) => {
    e.preventDefault()
    if (!selectedLab || !newSystemCount) {
      setMessage('Please select a lab and system count')
      setIsError(true)
      resetMessage()
      return
    }

    const count = parseInt(newSystemCount)
    if (isNaN(count) || count <= 0) {
      setMessage('Please enter a valid system count')
      setIsError(true)
      resetMessage()
      return
    }

    setLoading(true)
    try {
      const labRef = ref(db, `labs/${selectedLab}`)
      await update(labRef, {
        total: count,
        available: count
      })
      setMessage('Systems updated successfully!')
      setIsError(false)
      setNewSystemCount('')
      setSelectedLab('')
    } catch (error) {
      setMessage('Error updating systems: ' + error.message)
      setIsError(true)
      console.error('Error:', error)
    } finally {
      setLoading(false)
      resetMessage()
    }
  }

  // Booking Management
  const handleTerminateBooking = async (bookingId) => {
    setLoading(true)
    try {
      const bookingRef = ref(db, `bookings/${bookingId}`)
      const booking = bookings.find(b => b.id === bookingId)
      
      // Remove booking lock
      if (booking && booking.bookedSlots) {
        const today = new Date().toISOString().split('T')[0]
        for (const slot of booking.bookedSlots) {
          const lockRef = ref(db, `bookingLocks/${today}/${booking.system}/${slot}`)
          try {
            await remove(lockRef)
          } catch (e) {
            console.log('Lock already removed or does not exist')
          }
        }
      }

      await update(bookingRef, { status: 'cancelled' })
      setMessage('Booking terminated successfully!')
      setIsError(false)
    } catch (error) {
      setMessage('Error terminating booking: ' + error.message)
      setIsError(true)
      console.error('Error:', error)
    } finally {
      setLoading(false)
      resetMessage()
    }
  }

  // Report Management
  const handleResolveReport = async (reportId) => {
    setLoading(true)
    try {
      const reportRef = ref(db, `reports/${reportId}`)
      await update(reportRef, { status: 'resolved', resolvedAt: new Date().toISOString() })
      setMessage('Report marked as resolved!')
      setIsError(false)
    } catch (error) {
      setMessage('Error resolving report: ' + error.message)
      setIsError(true)
      console.error('Error:', error)
    } finally {
      setLoading(false)
      resetMessage()
    }
  }

  const handleSetReportType = async (reportId, reportType) => {
    setLoading(true)
    try {
      const reportRef = ref(db, `reports/${reportId}`)
      await update(reportRef, {
        reportType,
        updatedAt: new Date().toISOString()
      })
      setMessage(`Issue type set to ${reportType}!`)
      setIsError(false)
    } catch (error) {
      setMessage('Error updating issue type: ' + error.message)
      setIsError(true)
      console.error('Error:', error)
    } finally {
      setLoading(false)
      resetMessage()
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      setMessage('Error logging out: ' + error.message)
      setIsError(true)
      resetMessage()
    }
  }

  return (
    <div className="admin-page">
      {message && (
        <p className={`admin-message ${isError ? 'error' : 'success'} toast-right`}>
          {message}
        </p>
      )}

      <div className="admin-container">
        <div className="admin-topbar">
          <h1>Admin Dashboard</h1>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'labs' ? 'active' : ''}`}
            onClick={() => setActiveTab('labs')}
          >
            Lab Management
          </button>
          <button 
            className={`tab-btn ${activeTab === 'systems' ? 'active' : ''}`}
            onClick={() => setActiveTab('systems')}
          >
            System Management
          </button>
          <button 
            className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Terminate Bookings
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            View Issues
          </button>
        </div>

        <div className="admin-content">
          {/* Lab Management Tab */}
          {activeTab === 'labs' && (
            <div className="admin-section">
              <h2>Add New Lab</h2>
              <form onSubmit={handleAddLab} className="admin-form">
                <div className="form-group">
                  <label htmlFor="labId">Lab ID :-</label>
                  <input 
                    id="labId"
                    type="text" 
                    value={newLabData.id}
                    onChange={(e) => setNewLabData({...newLabData, id: e.target.value})}
                    placeholder="e.g., lab4"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="labName">Lab Name :-</label>
                  <input 
                    id="labName"
                    type="text" 
                    value={newLabData.name}
                    onChange={(e) => setNewLabData({...newLabData, name: e.target.value})}
                    placeholder="e.g., LAB4"
                  />
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Lab'}
                </button>
              </form>

              <h2>Existing Labs</h2>
              <div className="labs-list">
                {labs.length > 0 ? (
                  labs.map((lab) => (
                    <div key={lab.id} className="lab-item">
                      <div className="lab-info">
                        <h3>{lab.name}</h3>
                        <p>ID: {lab.id}</p>
                        <p>Total Systems: {lab.total}</p>
                        <p>Available: {lab.available}</p>
                        <p>Broken: {lab.broken}</p>
                        <p>Maintenance: {lab.maintenance}</p>
                      </div>
                      <button 
                        className="delete-btn" 
                        onClick={() => handleRemoveLab(lab.id)}
                        disabled={loading}
                      >
                        Remove Lab
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No labs found</p>
                )}
              </div>
            </div>
          )}

          {/* System Management Tab */}
          {activeTab === 'systems' && (
            <div className="admin-section">
              <h2>Update System Count</h2>
              <form onSubmit={handleAddSystems} className="admin-form">
                <div className="form-group">
                  <label htmlFor="labSelect">Select Lab :-</label>
                  <select 
                    id="labSelect"
                    value={selectedLab}
                    onChange={(e) => setSelectedLab(e.target.value)}
                  >
                    <option value="">-- Select a Lab --</option>
                    {labs.map((lab) => (
                      <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="systemCount">Number of Systems :-</label>
                  <input 
                    id="systemCount"
                    type="number" 
                    value={newSystemCount}
                    onChange={(e) => setNewSystemCount(e.target.value)}
                    placeholder="e.g., 90"
                  />
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Systems'}
                </button>
              </form>

              <h2>Current System Status by Lab</h2>
              <div className="systems-list">
                {labs.length > 0 ? (
                  labs.map((lab) => (
                    <div key={lab.id} className="system-item">
                      <h3>{lab.name}</h3>
                      <p>Total Systems: {lab.total}</p>
                      <p>Available: {lab.available}</p>
                      <p>Booked: {lab.total - lab.available - lab.broken - lab.maintenance}</p>
                      <p>Broken: {lab.broken}</p>
                      <p>Maintenance: {lab.maintenance}</p>
                    </div>
                  ))
                ) : (
                  <p>No labs found</p>
                )}
              </div>
            </div>
          )}

          {/* Terminate Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="admin-section">
              <h2>Active Bookings</h2>
              <div className="bookings-list">
                {bookings.length > 0 ? (
                  bookings
                    .filter(b => b.status === 'confirmed')
                    .map((booking) => (
                      <div key={booking.id} className="booking-item">
                        <div className="booking-info">
                          <h3>{booking.system}</h3>
                          <p><strong>User Email:</strong> {booking.userEmail}</p>
                          <p><strong>Lab:</strong> {booking.lab}</p>
                          <p><strong>Start Time:</strong> {formatStartTime(booking.startTime)}</p>
                          <p><strong>Duration:</strong> {booking.tenure} hours</p>
                          <p><strong>Booked on:</strong> {new Date(booking.bookingDate).toLocaleString()}</p>
                          <p><strong>Status:</strong> {booking.status}</p>
                        </div>
                        <button 
                          className="terminate-btn" 
                          onClick={() => handleTerminateBooking(booking.id)}
                          disabled={loading}
                        >
                          Terminate
                        </button>
                      </div>
                    ))
                ) : (
                  <p>No active bookings found</p>
                )}
              </div>
            </div>
          )}

          {/* View Reports Tab */}
          {activeTab === 'reports' && (
            <div className="admin-section">
              <h2>Issue Reports</h2>
              <div className="reports-list">
                {reports.filter((report) => report.status !== 'resolved').length > 0 ? (
                  reports.filter((report) => report.status !== 'resolved').map((report) => (
                    <div key={report.id} className={`report-item ${report.status}`}>
                      <div className="report-info">
                        <h3>{report.systemNumber}</h3>
                        <p><strong>Lab:</strong> {report.labNumber}</p>
                        <p><strong>Type:</strong> {report.reportType === 'broken' ? '🔴 Broken' : report.reportType === 'maintenance' ? '🟡 Maintenance' : 'Not set'}</p>
                        <p><strong>Description:</strong> {report.description}</p>
                        <p><strong>Reported by:</strong> {report.userEmail}</p>
                        <p><strong>Status:</strong> <span className={`status-badge ${report.status}`}>{report.status}</span></p>
                        <p><strong>Reported on:</strong> {new Date(report.reportDate).toLocaleString()}</p>
                        {report.resolvedAt && (
                          <p><strong>Resolved on:</strong> {new Date(report.resolvedAt).toLocaleString()}</p>
                        )}
                      </div>
                      <div className="report-actions">
                        {report.status === 'open' && (
                          <button 
                            className="resolve-btn" 
                            onClick={() => handleResolveReport(report.id)}
                            disabled={loading}
                          >
                            Mark Resolved
                          </button>
                        )}
                        <button 
                          className="maintenance-btn" 
                          onClick={() => handleSetReportType(report.id, 'maintenance')}
                          disabled={loading}
                        >
                          Set Maintenance
                        </button>
                        <button 
                          className="broken-btn" 
                          onClick={() => handleSetReportType(report.id, 'broken')}
                          disabled={loading}
                        >
                          Set Broken
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No active issues found</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Admin
