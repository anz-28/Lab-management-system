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
  const [labs, setLabs] = useState([])
  const [systems, setSystems] = useState([])
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch labs from database
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
      } else {
        setLabs([])
      }
    })
  }, [])

  // Update systems when lab is selected
  useEffect(() => {
    if (reportData.labNumber) {
      const selectedLab = labs.find(lab => lab.id === reportData.labNumber)
      if (selectedLab && selectedLab.total) {
        const systemArray = Array.from({ length: selectedLab.total }, (_, i) => ({
          number: (i + 1).toString(),
          label: `System ${i + 1}`
        }))
        setSystems(systemArray)
      }
    } else {
      setSystems([])
    }
  }, [reportData.labNumber, labs])

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
        <p className={`report-message ${isError ? 'error' : 'success'} toast-right`}>
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
          <option value="">Select a Lab</option>
          {labs.map((lab) => (
            <option key={lab.id} value={lab.id}>{lab.name} ({lab.id})</option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <label htmlFor="systemNumber">System Number :-</label>
        <select 
          id="systemNumber" 
          name="systemNumber"
          value={reportData.systemNumber}
          onChange={handleChange}
          disabled={!reportData.labNumber}
        >
          <option value="">Select a System</option>
          {systems.map((system) => (
            <option key={system.number} value={system.number}>{system.label}</option>
          ))}
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
    </div>
    </>
  )
}

export default Report