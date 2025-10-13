// src/components/CreateEventForm.jsx
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

export default function CreateEventForm({ guestId }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    event_date: '',
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!guestId) {
      toast.error("Guest profile not loaded.")
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        name: form.name,
        description: form.description,
        location: form.location,
        event_date: form.event_date,
        event_host: guestId,
      })

    if (error) {
      console.error(error)
      toast.error("Failed to create event.")
    } else {
      toast.success("Event created!")
      setForm({
        name: '',
        description: '',
        location: '',
        event_date: '',
      })
    }

    setLoading(false)
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Create a New Event</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Event Name"
          value={form.name}
          onChange={handleChange}
          required
        /><br />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        /><br />
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
        /><br />
        <input
          type="datetime-local"
          name="event_date"
          value={form.event_date}
          onChange={handleChange}
          required
        /><br />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
  )
}
