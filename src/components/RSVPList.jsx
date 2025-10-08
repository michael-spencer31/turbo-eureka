import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

export default function RSVPList({ eventId }) {
    const [attendees, setAttendees] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorShown, setErrorShown] = useState(false) // prevent spammy toasts

    useEffect(() => {
        const fetchRSVPs = async () => {
            if (!eventId) return

            setLoading(true)

            const { data, error } = await supabase
                .from('rsvps')
                .select('id, guest_id, guest_id(first_name, last_name)')
                .eq('event_id', eventId)

            if (error) {
                console.error('RSVP fetch error:', error)
                if (!errorShown) {
                    toast.error('Failed to fetch RSVPs')
                    setErrorShown(true)
                }
                setAttendees([])
            } else {
                setAttendees(data)
            }

            setLoading(false)
        }

        fetchRSVPs()
    }, [eventId, errorShown])

    if (loading) return <p>Loading RSVPs...</p>
    if (!attendees.length) return <p>No RSVPs yet.</p>

    return (
        <div style={{ marginTop: '0.5rem' }}>
            <strong>Attendees:</strong>
            <ul>
                {attendees.map((entry) => {
                    const firstName = entry.guest_id?.first_name || 'Unknown'
                    const lastName = entry.guest_id?.last_name || ''
                    return (
                        <li key={entry.id}>
                            {firstName} {lastName}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
