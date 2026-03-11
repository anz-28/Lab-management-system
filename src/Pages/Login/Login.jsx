import React from 'react'
import logopg from '../../assets/Hexalogo.png'

function Login() {
  return (
    <div id='loginbox'>
        <form>
            <label for="name">Name</label>
            <input type="text" id="name" name="name" placeholder="Your name.."></input>

            <label for="email">Email</label>
            <input type="text" id="email" name="email" placeholder="Your email.."></input>

            <label for="password">Last Name</label>
            <input type="password" id="password" name="password" placeholder="Your password.."></input>
            <button>Login</button>
        </form>
    </div>
  )
}

export default Login