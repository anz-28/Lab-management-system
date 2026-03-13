import React from 'react'
import logopg from '../../assets/Hexalogo.png'
import '../Login/Login.css'

function Login() {
  return (
    <form >
        <div id='loginbox'>
          <h2 className="login-title">LOGIN</h2>
            <div className='label-div'>
              <label for="name">Name</label>
            <input type="text" id="name" name="name" placeholder="Your name.."></input>
            </div>
            
            <div className='label-div'>
              <label for="email">Email</label>
            <input type="text" id="email" name="email" placeholder="Your email.."></input>
            </div>
            
            <div className='label-div'>
              <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Your password.."></input>
            </div>
            
           <button>ENTER</button>
        </div>
    </form>
  )
}

export default Login