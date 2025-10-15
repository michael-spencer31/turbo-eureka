// src/pages/PublicEventPage.jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import RSVPButton from '../components/RSVPButton'
import EventGallery from '../components/EventGallery'

export default function PublicEventPage({ guestProfile }) {
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) return

    const fetchEvent = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error) {
        toast.error('Failed to fetch event')
        console.error('Supabase fetchEvent error:', error)
        setEvent(null)
      } else {
        setEvent(data)
      }

      setLoading(false)
    }

    fetchEvent()
  }, [eventId])

  if (loading) return <p>Loading...</p>
  if (!event) return <p>Event not found or could not be loaded.</p>

  return (
    <div className="p-8 max-w-3xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4">{event.name}</h1>
      <p className="text-lg text-gray-600 mb-2">{event.description}</p>
      <p className="text-md text-gray-800 mb-2">📍 {event.location}</p>
      <p className="text-md text-gray-800 mb-6">
        📅 {new Date(event.event_date).toLocaleDateString()}
      </p>

      {guestProfile ? (
        <RSVPButton eventId={eventId} guestId={guestProfile.id} />
      ) : (
        <p className="text-gray-500 mb-4">Log in to RSVP</p>
      )}

      <h2 className="text-2xl font-semibold mt-10 mb-4">Event Gallery</h2>
      <EventGallery
        eventId={eventId}
        guestId={guestProfile?.id} // optional
      />
    </div>
  )
}
