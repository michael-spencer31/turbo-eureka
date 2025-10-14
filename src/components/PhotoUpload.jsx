import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function PhotoUpload() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [imageUrls, setImageUrls] = useState([]) // multiple image URLs
  const [userId, setUserId] = useState(null)

  // 🔐 Get current user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        console.error('Failed to fetch user:', error)
      } else {
        setUserId(user?.id)
      }
    }

    getUser()
  }, [])

  // 🔁 Load all images on mount (once userId is available)
  useEffect(() => {
    if (!userId) return

    const fetchImages = async () => {
      const { data, error } = await supabase
        .from('user_images')
        .select('file_path')
        .eq('user_id', userId)
        .order('inserted_at', { ascending: false })

      if (error) {
        console.error('Error fetching image paths:', error)
        return
      }

      // Create signed URLs for each image
      const urls = await Promise.all(
        data.map(async (item) => {
          const { data: urlData, error: urlError } = await supabase
            .storage
            .from('images')
            .createSignedUrl(item.file_path, 60 * 10)

          if (urlError) {
            console.error('Error creating signed URL:', urlError)
            return null
          }

          return urlData?.signedUrl
        })
      )

      // Filter out any null values and update state
      setImageUrls(urls.filter((url) => url !== null))
    }

    fetchImages()
  }, [userId])

  // 📤 Upload handler
  const handleUpload = async () => {
    if (!file || !userId) {
      alert('Missing file or user ID.')
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    setUploading(true)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('images')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error:', uploadError.message)
      setUploading(false)
      return
    }

    // Save path to DB
    const { error: insertError } = await supabase
      .from('user_images')
      .insert([{ user_id: userId, file_path: filePath }])

    if (insertError) {
      console.error('DB insert error:', insertError.message)
      setUploading(false)
      return
    }

    // Generate signed URL for the new image
    const { data: urlData, error: urlError } = await supabase
      .storage
      .from('images')
      .createSignedUrl(filePath, 60 * 10)

    if (urlError) {
      console.error('Signed URL error:', urlError.message)
    } else {
      setImageUrls((prev) => [urlData?.signedUrl, ...prev]) // add to top
    }

    setUploading(false)
    setFile(null)
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Upload a Photo</h3>

      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{ marginLeft: '1rem' }}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>

      {imageUrls.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h4>Your Uploaded Images:</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {imageUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Uploaded ${index}`}
                style={{
                  width: '200px',
                  height: 'auto',
                  borderRadius: '8px',
                  objectFit: 'cover',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
