import{set,ref,push} from 'firebase/database'
import db from './FirebaseConfig'
import Home from './Pages/Home/Home'
import Login from './Pages/Login/Login'
import Report from './Pages/Report/Report'
import Header from './Components/Header'
function App() {
  return (
    <>
    
    {/* <Login/> */}
    {/* <Home/> */}
    <Report/>
    </>
  )
}
export default App
