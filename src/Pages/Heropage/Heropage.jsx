import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../Components/Header'
import './Heropage.css'
import { ref, onValue } from 'firebase/database'
import { db } from '../../FirebaseConfig'

const formatDayKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function Heropage() {
  const navigate = useNavigate()

  const [labs, setLabs] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch booking locks and reports to compute availability
  useEffect(() => {
    const today = formatDayKey(new Date())
    const labsRef = ref(db, 'labs')
    const locksRef = ref(db, `bookingLocks/${today}`)
    const reportsRef = ref(db, 'reports')

    let labsData = {}
    let locksData = {}
    let reportsData = []

    const recalculate = () => {
      const baseLabs = Object.entries(labsData).map(([id, labInfo]) => ({
        id,
        name: labInfo.name || id.toUpperCase(),
        prefix: labInfo.prefix || id.toUpperCase(),
        total: Number(labInfo.total) || 0,
        available: 0,
        broken: 0,
        maintenance: 0,
      }))

      setLabs(baseLabs.map(lab => {
        // Count how many systems in this lab have any booking today
        let bookedCount = 0
        for (const [systemId, lockInfo] of Object.entries(locksData)) {
          if (!systemId.startsWith(lab.prefix + '-SYS')) continue
          const slots = lockInfo.reservedSlots || {}
          // If the system has any reserved slot at all today, it's booked
          if (Object.keys(slots).length > 0) {
            bookedCount++
          }
        }

        // Count broken reports for this lab
        const labReports = reportsData.filter(r => r.labNumber === lab.id)
        const brokenCount = labReports.filter(r => r.status === 'open' && (r.reportType === 'broken' || !r.reportType)).length
        const maintenanceCount = labReports.filter(r => r.status === 'open' && r.reportType === 'maintenance').length

        const available = lab.total - bookedCount - brokenCount - maintenanceCount

        return {
          ...lab,
          available: Math.max(0, available),
          broken: brokenCount,
          maintenance: maintenanceCount,
        }
      }))
    }

    const unsubLabs = onValue(labsRef, (snapshot) => {
      labsData = snapshot.exists() ? snapshot.val() : {}
      recalculate()
    })

    const unsubLocks = onValue(locksRef, (snapshot) => {
      locksData = snapshot.exists() ? snapshot.val() : {}
      recalculate()
    })

    const unsubReports = onValue(reportsRef, (snapshot) => {
      reportsData = snapshot.exists() ? Object.values(snapshot.val()) : []
      recalculate()
    })

    // Recalculate every minute so availability updates as time slots pass
    const interval = setInterval(recalculate, 60000)

    return () => {
      unsubLabs()
      unsubLocks()
      unsubReports()
      clearInterval(interval)
    }
  }, [])

  const formattedTime = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  return (
    <div className="main-page-wrapper">
      <Header />
      <div className="main-content-container">
        <div className="labs-container">
          {labs.length === 0 && <p className="no-labs-note">No labs available. Please add labs from admin panel.</p>}
          {labs.map((lab) => (
            <div key={lab.id} className="lab-card">
              <h2>{lab.name}</h2>
              <span className="lab-time">{formattedTime}</span>
              <div className="stat-tree">
                <div className="stat-node">
                  <span className="arrow-icon"></span>
                  <span>{lab.available} Available now</span>
                </div>
                <div className="stat-node">
                  <span className="arrow-icon"></span>
                  <span>{lab.broken} Broken</span>
                </div>
                <div className="stat-node">
                  <span className="arrow-icon"></span>
                  <span>{lab.maintenance} Maintenance</span>
                </div>
              </div>
              <div className="card-actions">
                <button className="card-btn" onClick={() => navigate(`/booking/${lab.id}`)}>BOOK</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Heropage
