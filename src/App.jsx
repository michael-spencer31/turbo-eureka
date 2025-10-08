// src/App.jsx
import { useState, useEffect } from 'react'
import React from 'react'
import Dashboard from './pages/Dashboard'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from 'react-router-dom'
import { supabase } from './supabaseClient'
import toast from 'react-hot-toast'
import CreateEventForm from './components/CreateEventForm'
import HostedEventsList from './components/HostedEventsList'
import RSVPButton from './components/RSVPButton'
import AvailableEventsList from './components/AvailableEventsList'

function Home () {
  return (
    <h1>Hello, World!</h1>
  )
}
function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [guestProfile, setGuestProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // ✅ Fetch session on mount
  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        toast.error('Error getting session')
        console.error(error)
        setLoading(false)
        return
      }

      const sessionUser = data?.session?.user
      if (sessionUser) {
        setUser(sessionUser)
        fetchGuestProfile(sessionUser.id)
      }

      setLoading(false)
    }

    getSession()

    // ✅ Auth change listener
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          fetchGuestProfile(session.user.id)
        } else {
          setUser(null)
          setGuestProfile(null)
        }
      }
    )

    return () => {
      listener?.subscription?.unsubscribe?.()
    }
  }, [])

  // ✅ Handle login or signup
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Try sign up
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signupError) {
        toast.error(signupError.message)
        console.error(signupError)
      } else {
        toast.success('Signed up! Check your email to confirm.')
        setUser(signupData.user)
      }
    } else {
      toast.success('Logged in!')
      setUser(data.user)
    }

    setLoading(false)
  }

  // ✅ Fetch guest profile
  const fetchGuestProfile = async (userId) => {
    if (!userId) return

    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code !== 'PGRST116') {
        toast.error('Error fetching profile')
        console.error(error)
      }
    } else {
      setGuestProfile(data)
    }
  }

  // ✅ Handle profile creation
  const handleProfileSave = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!user || !user.id || !user.email) {
      toast.error('User not authenticated')
      setLoading(false)
      return
    }

    const form = e.target
    const firstName = form.first_name.value
    const lastName = form.last_name.value

    const { data, error } = await supabase
      .from('guests')
      .insert({
        user_id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
      })
      .select()

    if (error) {
      toast.error('Failed to save profile')
      console.error(error)
    } else if (data && data.length > 0) {
      toast.success('Profile saved!')
      setGuestProfile(data[0])
    } else {
      toast.error('Profile saved, but no data returned.')
    }

    setLoading(false)
  }

  // ✅ Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out!')
    setUser(null)
    setGuestProfile(null)
    setEmail('')
    setPassword('')
  }

  // ✅ Show loading screen
  if (loading) return <p>Loading...</p>

  // ✅ Show login form
  if (!user) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Login or Sign Up</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          /><br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          /><br />
          <button type="submit">Submit</button>
        </form>
      </div>
    )
  }

  // ✅ Show profile form if no profile exists
  // ✅ Show profile form if no profile exists
if (!guestProfile) {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Complete Your Profile</h2>
      <form onSubmit={handleProfileSave}>
        <input type="text" name="first_name" placeholder="First Name" required /><br />
        <input type="text" name="last_name" placeholder="Last Name" required /><br />
        <button type="submit">Save Profile</button>
      </form>
      <button onClick={handleLogout} style={{ marginTop: '1rem' }}>
        Log Out
      </button>
    </div>
  )
}


  // ✅ Dashboard after login + profile setup

return (
  <Router>
    <nav>
      <Link to="/">Home</Link> | <Link to="/dashboard">Dashboard</Link>
    </nav>

    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/dashboard"
        element={<Dashboard guestProfile={guestProfile} handleLogout={handleLogout} />}
      />
    </Routes>
  </Router>
)






}

export default App
