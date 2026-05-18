/*import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      
    </>
  )
}

export default App*/
import { useEffect } from 'react'
import { supabase } from './supabase'

function App() {

   useEffect(() => {
      probarConexion()
   }, [])

   async function probarConexion() {

      const { data, error } = await supabase
         .from('usuario')
         .select('*')

      if(error){
         console.log(error)
      }
      else{
         console.log(data)
      }
   }

   return (
      <h1>FanMeet</h1>
   )
}

export default App
