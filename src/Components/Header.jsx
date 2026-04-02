import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../Context/AuthContext'
import { ref, onValue } from 'firebase/database'
import { db } from '../FirebaseConfig'
import '../Components/Header.css'
import logo from '../assets/logo.png'

function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [userName, setUserName] = useState('User')

  useEffect(() => {
    if (!user) {
      setUserName('User')
      return
    }

    const fallbackName = user.email ? user.email.split('@')[0] : 'User'
    const userRef = ref(db, `users/${user.uid}`)

    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val()
      setUserName(data?.name || fallbackName)
    })

    return () => unsubscribe()
  }, [user])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav>
      <img id='logo' src={logo} onClick={() => navigate('/booking')} style={{cursor: 'pointer'}}></img>
      <div id='linkdiv'>
        <ul>
          <li onClick={() => navigate('/booking')} style={{cursor: 'pointer'}}>Booking</li>
          <li onClick={() => navigate('/report')} style={{cursor: 'pointer'}}>Report</li>
          <li onClick={() => navigate('/user')} style={{cursor: 'pointer'}}>{userName}</li>
          {user && (
            <li onClick={handleLogout} style={{cursor: 'pointer', color: '#ff6b6b'}}>Logout</li>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Header