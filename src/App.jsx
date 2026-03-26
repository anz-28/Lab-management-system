import{set,ref,push} from 'firebase/database'
import db from './FirebaseConfig'
import Home from './Pages/Home/Home'
import Login from './Pages/Login/Login'
import Report from './Pages/Report/Report'
import Header from './Components/Header'
import User from './Pages/User/User'
import Booking from './Pages/Booking/Booking'
function App() {
  return (
    <>
   <Booking/>
    {/* <Login/> */}
    {/* <Home/> */}
    {/* <Report/> */}
    {/* <User/> */}
    </>
  )
}
export default App
