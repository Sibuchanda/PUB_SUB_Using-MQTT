import React from 'react'
import Publisher from './Publisher';
import { Toaster } from "react-hot-toast";

const App = () => {
  return (
    <>
     <Publisher />
     <Toaster position="top-center" />
    </>
  )
}


export default App;