import './App.css'
import Header from './components/shared/Header'
import { Outlet } from 'react-router-dom'

function App() {
  return (
    <div className='min-h-screen bg-neutral-50 flex flex-col'>
      <Header />
      <main className='flex-1 flex flex-col'>
        <Outlet />
      </main>
    </div>
  )
}

export default App
