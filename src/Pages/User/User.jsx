import React from 'react'
import './User.css'
import Header from '../../Components/Header'

function User() {
     const userData = {
    username: 'Anz',
    rollNumber: '1011',
    courses: ['UCSE601', 'UCSE602'],
    attendance: {
      'UCSE601': '85%',
      'UCSE602': '100%',
    }
}
    return (
      <>
      {/* <Header/> */}
      <div id="user-page">

      <div id="user-card">
        <p>User name :- {userData.username}</p>
        <p>Roll Number :- {userData.rollNumber}</p>
        <p>Courses :- {userData.courses.join(', ')}</p>
        <p>Attendance :-</p>

        <table id="attendance-table">
          <thead>
            <tr>
              {userData.courses.map(course => (
                <th key={course}>{course}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {userData.courses.map(course => (
                <td key={course}>{userData.attendance[course]}</td>
              ))}
            </tr>
          </tbody>
        </table>
         </div>

      <button id="logout-btn">Logout</button>

    </div>
</>
  )
}

export default User