import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import RSVPButton from './RSVPButton'
import RSVPList from './RSVPList'

export default function AvailableEventsList({ guestId }) {
  const [events, setEvents] = useState([])
  const [rsvpData, setRsvpData] = useState({})
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

      if (error) {
        toast.error('Failed to fetch events')
        console.error(error)
      } else {
        setEvents(data)

        // Pre-fetch RSVP lists for each event
        data.forEach(event => {
          fetchRSVPsForEvent(event.id)
        })
      }

      setLoading(false)
    }

    fetchAvailableEvents()
  }, [guestId])

  // ✅ Fetch RSVPs for a specific event
  const fetchRSVPsForEvent = async (eventId) => {
    const { data, error } = await supabase
      .from('rsvps')
      .select('id, guest_id, guest:guest_id(first_name, last_name), status')
      .eq('event_id', eventId)

    if (error) {
      console.error('Failed to fetch RSVPs for event', eventId, error)
      toast.error('Failed to fetch RSVPs')
      return
    }

    setRsvpData(prev => ({
      ...prev,
      [eventId]: data
    }))
  }

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

            <RSVPButton
              guestId={guestId}
              eventId={event.id}
              onRSVP={() => fetchRSVPsForEvent(event.id)}
            />

            <RSVPList
              eventId={event.id}
              currentGuestId={guestId}
              attendees={rsvpData[event.id] || []}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
