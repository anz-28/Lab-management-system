import Header from '../../Components/Header'
import '../Report/Report.css'

function Report() {
  return (
    <>
    <Header/>
  
    <div className="ticket-form">

      <div className="field-row">
        <label htmlFor="labNumber">Lab Number :-</label>
        <select id="labNumber" name="labNumber" >
          <option value=""></option>
          <option value="lab1"> Lab 1</option>
          <option value="lab2"> Lab 2</option>
        </select>
      </div>

      <div className="field-row">
        <label htmlFor="systemNumber">System Number :-</label>
        <select id="systemNumber" name="systemNumber">
          <option value=""></option>
          <option value="sys1">System 1</option>
          <option value="sys2">System 2</option>
        </select>
      </div>

      <div className="description-block">
        <span className="description-label-tab">Description :-</span>
        <textarea id="description" name="description" />
      </div>

      <button className="submit-btn">Submit</button>

    </div>
    </>
  )
}

export default Report