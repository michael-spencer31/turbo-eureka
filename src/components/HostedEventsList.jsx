// src/components/HostedEventsList.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import RSVPList from './RSVPList'
import toast from 'react-hot-toast'

export default function HostedEventsList({ guestId }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!guestId) return

    const fetchEvents = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_host', guestId)
        .order('event_date', { ascending: true })

      if (error) {
        console.error(error)
        toast.error('Failed to fetch events')
      } else {
        setEvents(data)
      }

      setLoading(false)
    }

    fetchEvents()
  }, [guestId])

  if (loading) return <p>Loading your events...</p>

  if (events.length === 0) return <p>You haven't created any events yet.</p>

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Your Hosted Events</h3>
      <ul>
        {events.map(event => (
          <li key={event.id} style={{ marginBottom: '1rem' }}>
            <strong>{event.name}</strong><br />
            📍 {event.location || 'No location'}<br />
            🗓️ {new Date(event.event_date).toLocaleString()}
            {event.description && <p>{event.description}</p>}

             {/* Show RSVP list for each event */}
            <RSVPList eventId={event.id} />
          </li>
        ))}
      </ul>
    </div>
  )
}
