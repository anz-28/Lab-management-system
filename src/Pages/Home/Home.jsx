import React from 'react'
import Header from '../../Components/Header'
import '../../Pages/Home/Home.css'
import logo from '../../assets/Hexalogo.png'

function Home() {
  return (
    <>
    
    <div id='home-con'>
      <img id='home-img' src={logo} alt='logoimg'></img>
      <button id='home-button'>LOGIN</button>
    </div>
    </>
  )
}

export default Home