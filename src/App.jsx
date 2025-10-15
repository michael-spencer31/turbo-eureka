// src/App.jsx
import { useState, useEffect } from 'react'
import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from 'react-router-dom'

import PublicEventPage from './pages/PublicEventPage'
import { supabase } from './supabaseClient'
import toast from 'react-hot-toast'
import SearchUser from './pages/SearchUser'
import EventByHost from './pages/EventByHost'
import Search from './pages/Search'
import Dashboard from './pages/Dashboard'
import Images from './pages/Images'
import EventPage from './pages/EventPage' // 👈 Make sure this exists
import CreateEventForm from './components/CreateEventForm'
import HostedEventsList from './components/HostedEventsList'
import RSVPButton from './components/RSVPButton'
import AvailableEventsList from './components/AvailableEventsList'

function Home () {
  return (
    <main className="flex flex-col items-center text-center bg-white text-gray-800">
      <section
        className="relative w-full h-[90vh] flex flex-col justify-center items-center bg-cover bg-center"
        style={{ backgroundImage: "url('/images/hero-photo.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 text-white">
          <h1 className="text-5xl md:text-7xl font-serif mb-4">Emma & Noah</h1>
          <p className="text-xl md:text-2xl font-light mb-6">are getting married</p>
          <p className="text-lg font-medium tracking-wide">June 14, 2026 • Halifax, Nova Scotia</p>
        </div>
      </section>

      <section className="py-12 px-6 bg-pink-50 w-full">
        <h2 className="text-3xl font-semibold mb-6">Countdown to Our Big Day</h2>
        <div id="countdown" className="text-2xl font-light">258 days to go</div>
      </section>

      <section className="py-16 px-6 max-w-4xl">
        <h2 className="text-3xl font-semibold mb-8">Our Story</h2>
        <p className="text-lg leading-relaxed">
          It all began with a cup of coffee and a shared love for adventure...
        </p>
      </section>

      <section className="py-16 px-6 bg-gray-100 w-full">
        <h2 className="text-3xl font-semibold mb-8">Wedding Details</h2>
        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          <div>
            <h3 className="text-xl font-semibold mb-2">Ceremony</h3>
            <p>3:00 PM at Saint Mary’s Chapel, Halifax</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Reception</h3>
            <p>6:00 PM at The Harbourview Ballroom</p>
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <h2 className="text-3xl font-semibold mb-6">Join Us!</h2>
        <p className="text-lg mb-8">We’d love to celebrate with you. Please RSVP by May 1st.</p>
        <a
          href="/dashboard"
          className="bg-pink-600 text-white px-8 py-3 rounded-full font-medium hover:bg-pink-700 transition"
        >
          RSVP Now
        </a>
      </section>

      <footer className="py-8 bg-gray-900 text-white w-full text-center">
        <p>© {new Date().getFullYear()} Emma & Noah’s Wedding • Made with ❤️</p>
      </footer>
    </main>
  )
}

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [guestProfile, setGuestProfile] = useState(null)
  const [loading, setLoading] = useState(true)

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

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const { data: signupData, error: signupError } = await supabase.auth.signUp({ email, password })

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out!')
    setUser(null)
    setGuestProfile(null)
    setEmail('')
    setPassword('')
  }

  if (loading) return <p>Loading...</p>

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

  return (
    <Router>
      <nav>
        <Link to="/">Home</Link> |{' '}
        <Link to="/dashboard">Dashboard</Link> |{' '}
        <Link to="/images">Images</Link> | {' '}
        <Link to="/search">Find an Event</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard guestProfile={guestProfile} handleLogout={handleLogout} />} />
        <Route path="/images" element={<Images guestProfile={guestProfile} handleLogout={handleLogout} />} />
        <Route path="/event-by-host/:hostGuestId" element={<EventByHost guestProfile={guestProfile} />} />
        <Route path="/search" element={<Search />} />
        <Route
          path="/event/:eventId"
          element={<PublicEventPage guestProfile={guestProfile} />}
        />

      </Routes>
    </Router>
  )
}

export default App
