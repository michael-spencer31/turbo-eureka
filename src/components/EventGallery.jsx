// src/components/EventGallery.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

export default function EventGallery({ eventId, guestId }) {
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)

  // ✅ Fetch images on load
  useEffect(() => {
    if (!eventId) return

    const fetchImages = async () => {
      const { data, error } = await supabase
        .from('event_images')
        .select('id, file_path')
        .eq('event_id', eventId)

      if (error) {
        console.error('Error fetching image metadata:', error)
        toast.error('Failed to load images')
        return
      }

      const signedUrls = await Promise.all(
        data.map(async (image) => {
          const { data: signedUrlData, error: signedUrlError } = await supabase
            .storage
            .from('event_images') // Bucket name
            .createSignedUrl(image.file_path, 60 * 60)

          if (signedUrlError) {
            console.error('Error getting signed URL for', image.file_path, signedUrlError)
            return null
          }

          return {
            id: image.id,
            url: signedUrlData.signedUrl,
          }
        })
      )

      setImages(signedUrls.filter(Boolean))
    }

    fetchImages()
  }, [eventId])

  // ✅ Upload handler
  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !eventId || !guestId) {
      toast.error('Missing required information')
      return
    }

    setUploading(true)

    const filePath = `${eventId}/${Date.now()}-${file.name}`

    // Upload to storage
    const { error: uploadError } = await supabase
      .storage
      .from('event_images')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      toast.error('Image upload failed')
      setUploading(false)
      return
    }

    // Insert metadata to DB
    const { error: dbError } = await supabase
      .from('event_images')
      .insert({
        event_id: eventId,
        guest_id: guestId,
        file_path: filePath,
      })

    if (dbError) {
      console.error('DB insert error:', dbError)
      toast.error('Failed to save image metadata')
      setUploading(false)
      return
    }

    toast.success('Image uploaded!')
    setUploading(false)

    // Refetch images
    const { data: newImageData } = await supabase
      .storage
      .from('event_images')
      .createSignedUrl(filePath, 60 * 60)

    setImages((prev) => [...prev, { id: filePath, url: newImageData.signedUrl }])
  }

  return (
    <div className="mt-6">
      <h3 className="text-2xl font-semibold mb-4">📸 Event Gallery</h3>

      {/* Upload */}
      <label className="inline-block mb-4">
        <span className="text-sm font-medium">Upload a photo:</span><br />
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="mt-1"
        />
      </label>

      {uploading && <p className="text-gray-500">Uploading...</p>}

      {/* Gallery */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {images.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt="Event"
              className="w-full h-auto rounded shadow-md object-cover"
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No images uploaded yet.</p>
      )}
    </div>
  )
}
