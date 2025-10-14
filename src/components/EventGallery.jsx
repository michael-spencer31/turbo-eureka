import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

export default function EventGallery({ eventId, guestId }) {
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState(null)

  useEffect(() => {
    if (eventId) {
      fetchImages()
    }
  }, [eventId])

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('event_images')
      .select('id, file_path')
      .eq('event_id', eventId)
      .order('inserted_at', { ascending: false })

    if (error) {
      console.error('Error fetching event images:', error)
      toast.error('Failed to load images.')
    } else {
      // Fetch signed URLs
      const signedUrls = await Promise.all(
        data.map(async (img) => {
          const { data: signedData, error: signedError } = await supabase.storage
            .from('event-images')
            .createSignedUrl(img.file_path, 60 * 60) // 1 hour URL

          if (signedError) {
            console.error('Error creating signed URL:', signedError)
            return null
          }

          return {
            id: img.id,
            url: signedData?.signedUrl,
          }
        })
      )

      setImages(signedUrls.filter(Boolean))
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile)
    } else {
      toast.error('Please select a valid image file.')
    }
  }

  const handleUpload = async () => {
    if (!file || !eventId || !guestId) {
        console.log({ file, eventId, guestId })
      toast.error('Missing required information')
      return
    }

    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${eventId}/${fileName}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file)

    if (uploadError) {
      toast.error('Upload failed')
      console.error(uploadError)
      setUploading(false)
      return
    }

    // Insert metadata
    const { error: insertError } = await supabase
      .from('event_images')
      .insert({
        event_id: eventId,
        uploaded_by: guestId,
        file_path: filePath,
      })

    if (insertError) {
      toast.error('Failed to record image metadata')
      console.error(insertError)
    } else {
      toast.success('Image uploaded!')
      setFile(null)
      fetchImages()
    }

    setUploading(false)
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Event Gallery</h3>

      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading || !file}>
        {uploading ? 'Uploading...' : 'Upload Photo'}
      </button>

      {images.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          {images.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt="Event"
              style={{ width: '100%', borderRadius: '8px' }}
            />
          ))}
        </div>
      ) : (
        <p style={{ marginTop: '1rem' }}>No photos yet. Be the first to upload!</p>
      )}
    </div>
  )
}
