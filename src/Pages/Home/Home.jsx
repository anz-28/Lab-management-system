import React from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../Components/Header'
import '../../Pages/Home/Home.css'
import logo from '../../assets/Hexalogo.png'

function Home() {
  const navigate = useNavigate()
  
  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <>
        <div id='home-con'>
      <img id='home-img' src={logo} alt='logoimg'></img>
      <button id='home-button' onClick={handleLogin}>LOGIN</button>
    </div>
    </>
  )
}

export default Home