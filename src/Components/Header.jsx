import React from 'react'
import '../Components/Header.css'
import logo from '../assets/logo.png'
function Header() {
  return (
    <nav>
      <img id='logo' src={logo}></img>
      <div id = 'linkdiv'>
        <ul>
          <li>Home</li>
          <li>Ticket</li>
          <li>User</li>
        </ul>
      </div>
    </nav>
  )
}

export default Header