// src/pages/EventByHost.jsx
import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import EventPage from './EventPage'
import toast from 'react-hot-toast'

export default function EventByHost({ user, guestProfile }) {
  const { hostGuestId } = useParams()
  const [eventId, setEventId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('event_host', hostGuestId)
        .limit(1)
        .single()

      if (error) {
        toast.error('Event not found')
        console.error('Error loading event by host:', error)
      } else {
        setEventId(data.id)
      }
      setLoading(false)
    }

    fetchEvent()
  }, [hostGuestId])

  if (loading) return <p>Loading event...</p>
  if (!eventId) return <p>No event found for this host.</p>

  return (
    <EventPage eventId={eventId} guestProfile={guestProfile} />
  )
}
