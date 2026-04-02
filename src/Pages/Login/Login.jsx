import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext'
import { ref, set } from 'firebase/database'
import { db } from '../../FirebaseConfig'
import logopg from '../../assets/Hexalogo.png'
import '../Login/Login.css'

function Login() {
  const navigate = useNavigate()
  const { signup, login } = useAuth()
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignup) {
        // Sign up new user
        const user = await signup(formData.email, formData.password)
        
        // Store user data in Realtime Database
        await set(ref(db, 'users/' + user.uid), {
          name: formData.name,
          email: formData.email,
          createdAt: new Date().toISOString()
        })
        
        // Navigate to booking page after successful signup
        navigate('/booking')
      } else {
        // Sign in existing user
        await login(formData.email, formData.password)
        navigate('/booking')
      }
    } catch (err) {
      setError(err.message)
      console.error('Auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id='loginbox'>
      <form onSubmit={handleSubmit}> 
        <h2 className="login-title">{isSignup ? 'SIGNUP' : 'LOGIN'}</h2>
        
        {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
        
        {isSignup && (
          <div className='label-div'>
            <label htmlFor="name">Name</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              placeholder="Your name.."
              value={formData.name}
              onChange={handleChange}
              required
            ></input>
          </div>
        )}
        
        <div className='label-div'>
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            placeholder="Your email.."
            value={formData.email}
            onChange={handleChange}
            required
          ></input>
        </div>
        
        <div className='label-div'>
          <label htmlFor="password">Password</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            placeholder="Your password.."
            value={formData.password}
            onChange={handleChange}
            required
          ></input>
        </div>
        
        <button type="submit" id='loginbtn' disabled={loading}>
          {loading ? 'Loading...' : isSignup ? 'SIGNUP' : 'ENTER'}
        </button>

        <div style={{marginTop: '15px', textAlign: 'center'}}>
          <button 
            type="button" 
            onClick={() => {
              setIsSignup(!isSignup)
              setError('')
              setFormData({ name: '', email: '', password: '' })
            }}
            style={{background: 'none', border: 'none', color: '#888888', cursor: 'pointer', textDecoration: 'none'}}
          >
            {isSignup ? 'Already have an account? Login' : "Don't have an account? Signup"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Login