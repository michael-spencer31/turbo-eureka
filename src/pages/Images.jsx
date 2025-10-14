// src/App.jsx
import { useState, useEffect } from 'react'
import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,             // my-app\src\supabaseClient.js
} from 'react-router-dom'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import CreateEventForm from '../components/CreateEventForm'
import HostedEventsList from '../components/HostedEventsList'
import RSVPButton from '../components/RSVPButton'
import AvailableEventsList from '../components/AvailableEventsList'
import PhotoUpload from '../components/PhotoUpload'

export default function FAQ({ guestProfile, handleLogout }) {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Welcome, {guestProfile.first_name}!</h2>
        <h3>Click below to upload an image.</h3>
      <PhotoUpload userId={guestProfile.id} />

      <button onClick={handleLogout} style={{ marginTop: '2rem' }}>
        Log Out
      </button>
    </div>
  )
}
