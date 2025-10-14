import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

export default function RSVPList({ eventId, currentGuestId }) {
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRSVPs = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('rsvps')
        .select(`
          id,
          status,
          guest_id,
          guest:guest_id (
            first_name,
            last_name
          )
        `)
        .eq('event_id', eventId)

      if (error) {
        console.error('Error fetching RSVPs:', error)
        toast.error('Could not load RSVP list.')
      } else {
        setAttendees(data)
      }

      setLoading(false)
    }

    if (eventId) {
      fetchRSVPs()
    }
  }, [eventId])

  if (loading) return <p>Loading RSVPs...</p>
  if (!attendees || attendees.length === 0) return <p>No RSVPs yet.</p>

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <strong>RSVPs for this event:</strong>
      <ul>
        {attendees.map((entry) => {
          const isCurrentUser = entry.guest_id === currentGuestId
          const firstName = entry.guest?.first_name || 'Unknown'
          const lastName = entry.guest?.last_name || ''
          const status = entry.status || 'yes'

          return (
            <li key={entry.id || `${entry.guest_id}-${status}`}>
              {firstName} {lastName} — <em>{status}</em> {isCurrentUser ? '(You)' : ''}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
