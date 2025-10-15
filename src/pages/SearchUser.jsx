// src/pages/SearchUser.jsx
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function SearchUser() {
    console.log("Test")
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const navigate = useNavigate()

  const handleSearch = async (e) => {
    e.preventDefault()
            

    if (!query.trim()) return
const names = query.trim().split(' ')

    const { data, error } = await supabase
      .from('guests')
      .select('id, first_name, last_name')
      .ilike('first_name', `%${query}%`)
      .or(`last_name.ilike.%${query}%`)
            console.log("Names:", names)

    if (error) {
      toast.error('Search failed')
      console.error(error)
    } else {
      setResults(data || [])
    }
  }

  const handleSelect = (guest) => {
    navigate(`/event-by-host/${guest.id}`)
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Search Host by Name</h2>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          placeholder="First or Last Name"
          onChange={(e) => setQuery(e.target.value)}
          required
        />
        <button type="submit">Search</button>
      </form>

      {results.length > 0 && (
        <ul style={{ marginTop: '1rem' }}>
          {results.map((guest) => (
            <li
              key={guest.id}
              style={{ cursor: 'pointer', margin: '0.5rem 0' }}
              onClick={() => handleSelect(guest)}
            >
              {guest.first_name} {guest.last_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
