import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const navigate = useNavigate()

  const handleSearch = async () => {
    if (!query.trim()) return

    const words = query.trim().split(/\s+/)
    let guestMatches = []

    if (words.length === 1) {
      const { data, error } = await supabase
        .from('guests')
        .select('id, first_name, last_name')
        .or(`first_name.ilike.%${words[0]}%,last_name.ilike.%${words[0]}%`)

      guestMatches = data || []
      if (error) console.error(error)
    } else {
      const first = words[0]
      const last = words.slice(1).join(' ')
      const { data, error } = await supabase
        .from('guests')
        .select('id, first_name, last_name')
        .ilike('first_name', `%${first}%`)
        .ilike('last_name', `%${last}%`)

      guestMatches = data || []
      if (error) console.error(error)
    }

    // Fetch events for each guest
    const eventResults = []
    for (const guest of guestMatches) {
      const { data: events } = await supabase
        .from('events')
        .select('id, name, event_date, location')
        .eq('event_host', guest.id)

      if (events && events.length > 0) {
        for (const event of events) {
          eventResults.push({
            ...event,
            host: guest,
          })
        }
      }
    }

    setResults(eventResults)
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-semibold mb-6 text-center">Find a Wedding</h2>

      <div className="flex items-center gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name (e.g. Emma Otteson)"
          className="flex-grow px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition"
        >
          Search
        </button>
      </div>

      {results.length > 0 ? (
        <ul className="space-y-4">
          {results.map((event) => (
            <li
              key={event.id}
              className="bg-white p-4 rounded shadow hover:bg-pink-50 transition"
            >
              <button
                onClick={() => navigate(`/event/${event.id}`)}
                className="text-lg font-medium text-pink-700 hover:underline"
              >
                {event.name}
              </button>
              <p className="text-sm text-gray-500">
                Hosted by {event.host.first_name} {event.host.last_name}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(event.event_date).toLocaleDateString()} @ {event.location}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        query && <p className="text-center text-gray-500">No results found for “{query}”.</p>
      )}
    </div>
  )
}
