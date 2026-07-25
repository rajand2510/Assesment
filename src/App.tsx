import './App.css'
import { useAuth } from './auth/authState'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'

function App() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <DashboardPage />

  const mode = window.location.pathname === '/register' ? 'register' : 'login'
  return <AuthPage mode={mode} />
}

export default App
