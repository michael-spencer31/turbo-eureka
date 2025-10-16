// src/components/EventAdminPanel.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

export default function EventAdminPanel({ eventId, currentUserId }) {
  const [rsvps, setRsvps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRsvps = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('rsvps')
        .select('id, guest_id, event_id, status, role, guests ( full_name, email )')
        .eq('event_id', eventId)

      if (error) {
        console.error('Error fetching RSVPs:', error)
        toast.error('Could not load attendees')
      } else {
        setRsvps(data)
      }

      setLoading(false)
    }

    fetchRsvps()
  }, [eventId])

  const updateRole = async (rsvpId, newRole) => {
    const { error } = await supabase
      .from('rsvps')
      .update({ role: newRole })
      .eq('id', rsvpId)

    if (error) {
      console.error('Role update failed:', error)
      toast.error('Failed to update role')
    } else {
      toast.success('Role updated!')
      // Refresh
      setRsvps((prev) =>
        prev.map((r) =>
          r.id === rsvpId ? { ...r, role: newRole } : r
        )
      )
    }
  }

  if (loading) return <p>Loading attendees...</p>

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Manage Attendees</h2>
      <table className="w-full table-auto border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rsvps.map((rsvp) => (
            <tr key={rsvp.id} className="border-t border-gray-200">
              <td className="p-2">{rsvp.guests?.full_name || 'Unknown'}</td>
              <td className="p-2">{rsvp.guests?.email || '-'}</td>
              <td className="p-2">{rsvp.status}</td>
              <td className="p-2 font-semibold">{rsvp.role}</td>
              <td className="p-2 space-x-2">
                {rsvp.guest_id !== currentUserId && (
                  <>
                    {rsvp.role !== 'admin' && (
                      <button
                        onClick={() => updateRole(rsvp.id, 'admin')}
                        className="text-blue-600 hover:underline"
                      >
                        Promote to Admin
                      </button>
                    )}
                    {rsvp.role === 'admin' && (
                      <button
                        onClick={() => updateRole(rsvp.id, 'guest')}
                        className="text-red-600 hover:underline"
                      >
                        Demote to Guest
                      </button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
