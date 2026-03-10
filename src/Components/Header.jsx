import React from 'react'
import '../Components/Header.css'
import logo from '../assets/logo.png'
function Header() {
  return (
    <nav>
      <img id='logo' src={logo}></img>
      <div id = 'linkdiv'>
        <button>Home</button>
        <button>Ticket</button>
        <button>User</button>
      </div>
    </nav>
  )
}

export default Header