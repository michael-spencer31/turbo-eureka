import { useState } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

export default function RSVPButton({ guestId, eventId, onRSVP }) {
  const [loading, setLoading] = useState(false)

  const handleRSVP = async (status) => {
    if (!guestId || !eventId) {
      toast.error('Missing guest or event information.')
      console.error('RSVP error: guestId or eventId missing', { guestId, eventId })
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('rsvps')
        .upsert(
          { guest_id: guestId, event_id: eventId, status },
          { onConflict: ['guest_id', 'event_id'] }
        )
        .select() // 👈 ensure we get a response back

      if (error) {
        if (error.code === '23505') {
          toast.error('Already RSVPed.')
        } else if (error.code === '23514') {
          toast.error('Invalid RSVP status')
        } else {
          toast.error('Failed to RSVP')
        }
        console.error('RSVP insert error:', error)
      } else if (data && data.length > 0) {
        toast.success(`RSVP: ${status}`)

        // ✅ Refresh RSVP list if parent passed a callback
        if (onRSVP) {
          await onRSVP()
        }
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
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
      <button onClick={() => handleRSVP('yes')} disabled={loading}>
        {loading ? 'Saving...' : 'Yes'}
      </button>
      <button onClick={() => handleRSVP('maybe')} disabled={loading}>
        {loading ? 'Saving...' : 'Maybe'}
      </button>
      <button onClick={() => handleRSVP('no')} disabled={loading}>
        {loading ? 'Saving...' : 'No'}
      </button>
    </div>
  )
}
