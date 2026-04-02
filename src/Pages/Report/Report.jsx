import React, { useState, useEffect } from 'react'
import Header from '../../Components/Header'
import { useAuth } from '../../Context/AuthContext'
import { ref, push, onValue } from 'firebase/database'
import { db } from '../../FirebaseConfig'
import '../Report/Report.css'

function Report() {
  const { user } = useAuth()
  const [reportData, setReportData] = useState({
    labNumber: '',
    systemNumber: '',
    description: ''
  })
  const [reports, setReports] = useState([])
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch user's reports
  useEffect(() => {
    if (user) {
      const reportsRef = ref(db, 'reports')
      onValue(reportsRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const userReports = Object.values(data).filter(report => report.userId === user.uid)
          setReports(userReports)
        }
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setReportData(prevState => ({
      ...prevState,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setIsError(false)
    
    if (!reportData.labNumber || !reportData.systemNumber || !reportData.description) {
      setMessage('Please fill all fields')
      setIsError(true)
      return
    }

    setLoading(true)
    try {
      const reportsRef = ref(db, 'reports')
      await push(reportsRef, {
        userId: user.uid,
        userEmail: user.email,
        labNumber: reportData.labNumber,
        systemNumber: reportData.systemNumber,
        description: reportData.description,
        reportDate: new Date().toISOString(),
        status: 'open'
      })

      setMessage('Report submitted successfully!')
      setIsError(false)
      setReportData({ labNumber: '', systemNumber: '', description: '' })
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error submitting report: ' + error.message)
      setIsError(true)
      console.error('Report error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    
  
    <div className="ticket-form">
      <Header/>
      {message && (
        <p className={`report-message ${isError ? 'error' : 'success'}`}>
          {message}
        </p>
      )}

      <div className="field-row">
        <label htmlFor="labNumber">Lab Number :-</label>
        <select 
          id="labNumber" 
          name="labNumber"
          value={reportData.labNumber}
          onChange={handleChange}
        >
          <option value=""></option>
          <option value="lab1"> Lab 1</option>
          <option value="lab2"> Lab 2</option>
        </select>
      </div>

      <div className="field-row">
        <label htmlFor="systemNumber">System Number :-</label>
        <select 
          id="systemNumber" 
          name="systemNumber"
          value={reportData.systemNumber}
          onChange={handleChange}
        >
          <option value=""></option>
          <option value="sys1">System 1</option>
          <option value="sys2">System 2</option>
        </select>
      </div>

      <div className="description-block">
        <span className="description-label-tab">Description :-</span>
        <textarea 
          id="description" 
          name="description"
          value={reportData.description}
          onChange={handleChange}
        />
      </div>

      <button 
        className="submit-btn"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>

      {/* Display submitted reports */}
      {reports.length > 0 && (
        <div className="reports-list">
          <h3>Your Reports</h3>
          {reports.map((report, index) => (
            <div key={index} className="report-card">
              <p><strong>Lab:</strong> {report.labNumber}</p>
              <p><strong>System:</strong> {report.systemNumber}</p>
              <p><strong>Description:</strong> {report.description}</p>
              <p><strong>Status:</strong> {report.status}</p>
              <p className="report-date">Submitted: {new Date(report.reportDate).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  )
}

export default Report