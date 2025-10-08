// src/components/RSVPButton.jsx
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

export default function RSVPButton({ guestId, eventId }) {
  const [loading, setLoading] = useState(false)
  const [rsvped, setRsvped] = useState(false)

  const handleRSVP = async () => {
    if (!guestId || !eventId) {
      toast.error('Missing guest or event information.')
      console.error('RSVP error: guestId or eventId missing', { guestId, eventId })
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('rsvps')
        .insert({ guest_id: guestId, event_id: eventId })
        .select()

      if (error) {
        if (error.code === '23505') {
          toast.error('Already RSVPed.')
        } else {
          toast.error('Failed to RSVP')
        }
        console.error('RSVP insert error:', error)
      } else if (data && data.length > 0) {
        toast.success('RSVP successful!')
        setRsvped(true)
      } else {
        toast.error('Unexpected response: no data returned from RSVP')
        console.warn('RSVP response:', data)
      }
    } catch (err) {
      toast.error('Unexpected error during RSVP')
      console.error('Unexpected RSVP error:', err)
    }

    setLoading(false)
  }

  return (
    <button onClick={handleRSVP} disabled={loading || rsvped}>
      {rsvped ? 'RSVPed ✔️' : loading ? 'RSVPing…' : 'RSVP'}
    </button>
  )
}
