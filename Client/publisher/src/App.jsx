import React from 'react'
import Publisher from './components/Publisher';
import { Toaster } from "react-hot-toast";
import AdminLogin from './pages/AdminLogin';
import RegisterDevice from './pages/RegisterDevice'
import { Route, Routes } from 'react-router-dom';


const App = () => {
  return (
    <>
    <Routes>
      <Route path='/' element={<Publisher/>} />
      <Route path='/admin/login' element={<AdminLogin/>} />
      <Route path='/register-device' element={<RegisterDevice/>} />
     </Routes>
      <Toaster position="top-center" />
    </>
  )
}

export default App;