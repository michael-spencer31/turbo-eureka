// src/App.jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('guest')

  const [events, setEvents] = useState([])
  const [newEventTitle, setNewEventTitle] = useState('')

  // ✅ Get session on initial load
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        fetchEvents(session.user.id)
      }
    }

    getSession()

    // ✅ Listen for auth state changes (signup/login)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const newUser = session.user
          setUser(newUser)
          fetchEvents(newUser.id)

          // Insert into profiles
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              id: newUser.id,
              full_name: fullName,
              role: role,
            },
          ])

          if (profileError) {
            console.error('Profile insert error:', profileError.message)
          }
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleSignUp = async () => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    alert(error.message)
    return
  }

  const newUser = data.user

  if (!newUser) {
    alert('Check your email to confirm your sign-up.')
    return
  }

  // Wait for session to become available
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    console.warn('No session yet — waiting for auth confirmation.')
    return
  }

  const { error: profileError } = await supabase.from('profiles').insert([
    {
      id: newUser.id,
      full_name: fullName,
      role: role,
    },
  ])

  if (profileError) {
    console.error('Profile insert error:', profileError.message)
    alert('Signup succeeded, but profile could not be created.')
  }

  setUser(newUser)
}


  // ✅ Login user
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    const loggedInUser = data.user
    setUser(loggedInUser)
    fetchEvents(loggedInUser.id)
  }

  // ✅ Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setEvents([])
    setEmail('')
    setPassword('')
    setFullName('')
    setRole('guest')
  }

  // ✅ Fetch events for this user
  const fetchEvents = async (hostId) => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('host_id', hostId)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching events:', error.message)
    } else {
      setEvents(data)
    }
  }

  // ✅ Create a new event
  const handleCreateEvent = async () => {
    if (!newEventTitle.trim()) return

    const { error } = await supabase.from('events').insert([
      {
        host_id: user.id,
        title: newEventTitle,
      },
    ])

    if (error) {
      console.error('Error creating event:', error.message)
    } else {
      setNewEventTitle('')
      fetchEvents(user.id)
    }
  }

  return (
    <div className="auth-container" style={{ padding: '2rem' }}>
      <h1>Event Host App</h1>

      {!user ? (
        <>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          /><br />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          /><br />

          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          /><br />

          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="guest">Guest</option>
            <option value="host">Host</option>
          </select><br />

          <button onClick={handleLogin}>Login</button>
          <button onClick={handleSignUp}>Sign Up</button>
        </>
      ) : (
        <>
          <p>Welcome, {user.email}</p>
          <button onClick={handleLogout}>Log out</button>

          <hr />
          <h2>Your Events</h2>

          {events.length === 0 && <p>No events yet.</p>}
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                {event.title} — {new Date(event.date).toLocaleString()}
              </li>
            ))}
          </ul>

          <input
            type="text"
            placeholder="New event title"
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
          />
          <button onClick={handleCreateEvent}>Create Event</button>
        </>
      )}
    </div>
  )
}

export default App
