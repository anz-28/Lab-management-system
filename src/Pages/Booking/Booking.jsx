import React from 'react'
import './Booking.css'

function Booking() {
  return (<>
    <div className="booking-page">
      <div id="bigdiv">
          <h1>LAB1</h1>

          <div className="booking-form">
            <div className="field-row">
              <label htmlFor="system">Select System for Booking :-</label>
              <select id="system" name="system" className="select-system">
                <option value=""></option>
                <option value="sys1">System 1</option>
                <option value="sys2">System 2</option>
              </select>
            </div>

            <div className="field-row">
              <label htmlFor="startTime">Starting Time :-</label>
              <select id="startTime" name="startTime" className="select-time">
                <option value=""></option>
                <option value="9">9:00</option>
                <option value="10">10:00</option>
                <option value="11">11:00</option>
                <option value="12">12:00</option>
              </select>

              <span className="inline-label">Teniure :-</span>
              <input
                type="number"
                className="tenure-input"
                name="tenure"
                min="1"
                max="4"
              />
            </div>

            
            <button className="confirm-btn">Confirm Booking</button>

          </div>
      </div>

      <p className="booking-note">
        Systems that don't appear on the list are either in use, under maintenance or broken
      </p>
</div>
    
    </>
  )
}

export default Booking
 

