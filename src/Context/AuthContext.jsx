import React, { createContext, useState, useContext, useEffect } from 'react'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import app from '../FirebaseConfig'

const AuthContext = createContext()
const ADMIN_EMAIL = 'admin@'
const ADMIN_PASSWORD = 'Citkok'

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [adminUser, setAdminUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const auth = getAuth(app)

  useEffect(() => {
    const savedAdminEmail = localStorage.getItem('adminEmail')
    if (savedAdminEmail === ADMIN_EMAIL) {
      setAdminUser({ uid: 'local-admin', email: ADMIN_EMAIL, role: 'admin' })
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [auth])

  const signup = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return userCredential.user
  }

  const login = async (email, password) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const localAdminUser = { uid: 'local-admin', email: ADMIN_EMAIL, role: 'admin' }
      localStorage.setItem('adminEmail', ADMIN_EMAIL)
      setAdminUser(localAdminUser)
      return localAdminUser
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    setAdminUser(null)
    localStorage.removeItem('adminEmail')
    return userCredential.user
  }

  const logout = async () => {
    localStorage.removeItem('adminEmail')
    setAdminUser(null)

    if (auth.currentUser) {
      await signOut(auth)
    }

    setFirebaseUser(null)
  }

  const user = firebaseUser || adminUser

  const value = {
    user,
    loading,
    signup,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
