import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

export default function RSVPList({ eventId, currentGuestId, attendees }) {
  if (!attendees || attendees.length === 0) return <p>No RSVPs yet.</p>

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <strong>Attendees:</strong>
      <ul>
        {attendees.map((entry) => {
          const isCurrentUser = entry.guest_id === currentGuestId
          const firstName = entry.guest?.first_name || 'Unknown'
          const lastName = entry.guest?.last_name || ''
          const status = entry.status || 'yes'

          return (
            <li key={entry.id || `${entry.guest_id}-${status}`}>
              {firstName} {lastName} — <em>{status}</em> {isCurrentUser && '⭐'}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

