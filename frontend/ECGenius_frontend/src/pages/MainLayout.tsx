import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'


const MainLayout = () => {
  return (
    <>
    
      <Navbar /> 
        {/* Navbar is the constant thingy */}
      <Outlet/> 
      {/* outlet is the variable it changes accordingly */}
    </>
  )
}

export default MainLayout