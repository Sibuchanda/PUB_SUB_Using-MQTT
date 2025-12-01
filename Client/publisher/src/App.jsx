import Publisher from './components/Publisher';
import { Toaster } from "react-hot-toast";
import AdminLogin from './pages/AdminLogin';
import RegisterDevice from './pages/RegisterDevice'
import TopicRequest from './components/TopicRequest'; 
import { Route, Routes } from 'react-router-dom';


const App = () => {
  return (
    <>
    <Routes>
      <Route path='/' element={<Publisher/>} />
      <Route path='/admin/login' element={<AdminLogin/>} />
      <Route path='/register-device' element={<RegisterDevice/>} />
      <Route path='/topic-request' element={<TopicRequest/>} />
     </Routes>
      <Toaster position="top-center" />
    </>
  )
}

export default App;