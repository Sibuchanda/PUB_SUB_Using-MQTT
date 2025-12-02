import React from 'react'
import { Toaster } from "react-hot-toast";
import Subscriber from '../components/Subscriber';
import TopicRequest from '../components/TopicRequest'; 
import MessageDisplay from '../components/MessageDisplay';
import { Route, Routes } from 'react-router-dom';

const App = () => {
  return (
   <>
      <Routes>
        <Route path='/' element={<Subscriber/>} />
        <Route path='/topic-request' element={<TopicRequest/>} />
        <Route path='/message-display' element={<MessageDisplay/>} />
       </Routes>
        <Toaster position="top-center" />
      </>
  )
}

export default App;
