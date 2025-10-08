import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import RSVPButton from './RSVPButton'
import RSVPList from './RSVPList'

export default function AvailableEventsList({ guestId }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  if (!guestId) {
    console.warn('guestId not ready yet')
    return
  }

  const fetchAvailableEvents = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .neq('event_host', guestId)
      .order('event_date', { ascending: true })

    console.log('Current guestId:', guestId)
    console.log('Fetched events (excluding host):', data)

    if (error) {
      toast.error('Failed to fetch events')
      console.error(error)
    } else {
      setEvents(data)
    }

    setLoading(false)
  }

  fetchAvailableEvents()
}, [guestId])


  if (loading) return <p>Loading events to RSVP to...</p>
  if (events.length === 0) return <p>No events available for RSVP.</p>

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Available Events to RSVP</h3>
      <ul>
        {events.map(event => (
          <li key={event.id} style={{ marginBottom: '1rem' }}>
            <strong>{event.name}</strong><br />
            📍 {event.location || 'No location'}<br />
            🗓️ {new Date(event.event_date).toLocaleString()}
            {event.description && <p>{event.description}</p>}
            <RSVPButton guestId={guestId} eventId={event.id} />
            <RSVPList eventId={event.id} />
          </li>
        ))}
      </ul>
    </div>
  )
}
