import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function PhotoUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState([]); // [{ url, filePath }]
  const [userId, setUserId] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null)
  // 🔐 Get current user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error('Failed to fetch user:', error);
      } else {
        setUserId(user?.id);
      }
    };

    getUser();
  }, []);

  // 🔁 Load all images on mount
  useEffect(() => {
    if (!userId) return;

    const fetchImages = async () => {
      const { data, error } = await supabase
        .from('user_images')
        .select('file_path')
        .eq('user_id', userId)
        .order('inserted_at', { ascending: false });

      if (error) {
        console.error('Error fetching image paths:', error);
        return;
      }

      const urls = await Promise.all(
        data.map(async (item) => {
          const pathParts = item.file_path.split('/');
          const folder = pathParts.slice(0, -1).join('/');
          const filename = pathParts[pathParts.length - 1];

          // Check if file exists
          const { data: listData, error: listError } = await supabase
            .storage
            .from('images')
            .list(folder);

          if (listError) {
            console.error('Error listing folder:', listError);
            return null;
          }

          const fileExists = listData?.some(file => file.name === filename);
          if (!fileExists) {
            // Clean up missing file references
            await supabase
              .from('user_images')
              .delete()
              .eq('file_path', item.file_path)
              .eq('user_id', userId);
            return null;
          }

          // Create signed URL
          const { data: urlData, error: urlError } = await supabase
            .storage
            .from('images')
            .createSignedUrl(item.file_path, 60 * 10);

          if (urlError) {
            console.error('Error creating signed URL:', urlError);
            return null;
          }

          return { url: urlData.signedUrl, filePath: item.file_path };
        })
      );

      setImageUrls(urls.filter((item) => item !== null));
    };

    fetchImages();
  }, [userId]);

  // 📤 Upload handler
  const handleUpload = async () => {
    if (!file || !userId) {
      alert('Missing file or user ID.');
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    setUploading(true);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError.message);
      setUploading(false);
      return;
    }

    // Save path to DB
    const { error: insertError } = await supabase
      .from('user_images')
      .insert([{ user_id: userId, file_path: filePath }]);

    if (insertError) {
      console.error('DB insert error:', insertError.message);
      setUploading(false);
      return;
    }

    // Generate signed URL for the new image
    const { data: urlData, error: urlError } = await supabase
      .storage
      .from('images')
      .createSignedUrl(filePath, 60 * 10);

    if (urlError) {
      console.error('Signed URL error:', urlError.message);
    } else {
      setImageUrls((prev) => [{ url: urlData?.signedUrl, filePath }, ...prev]);
    }

    setUploading(false);
    setFile(null);
  };
  const handleDelete = async (filePath) => {
  const cleanedPath = filePath.trim().normalize('NFC');

  const { error: storageError } = await supabase
    .storage
    .from('images')
    .remove([cleanedPath]);

  if (storageError) {
    return;
  }

  const { error: dbError, data: deleted } = await supabase
    .from('user_images')
    .delete()
    .match({
      user_id: userId,
      file_path: cleanedPath,
    });

  if (dbError) {
    return;
  }

  
  setImageUrls((prev) =>
    prev.filter((item) => item.filePath !== filePath)
  );
  setSelectedIndex(null);
  setDeleteTarget(null);
};

  

  // ⌨️ Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const prevImage = () => {
    setSelectedIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setSelectedIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  };

  return (
    <div style={{ marginTop: '2rem', maxWidth: '600px' }}>
      <h3 style={{ marginBottom: '1rem' }}>Upload a Photo</h3>

      {/* Upload Form */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ flex: 1 }}
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            cursor: uploading ? 'not-allowed' : 'pointer',
            backgroundColor: uploading ? '#ccc' : '#007bff',
            color: '#fff',
            fontWeight: 'bold',
          }}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {/* Image Grid */}
      {imageUrls.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>Your Uploaded Images:</h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {imageUrls.map((image, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '200px',
                  overflow: 'hidden',
                  borderRadius: '10px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
                }}
                onClick={() => setSelectedIndex(index)}
              >
                <img
                  src={image.url}
                  alt={`Uploaded ${index}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(image.filePath);
                  }}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(255, 0, 0, 0.7)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {deleteTarget && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}
  >
    <div
      style={{
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%',
      }}
    >
      <h4>Delete Image</h4>
      <p>Are you sure you want to permanently delete this image?</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
        <button
          onClick={() => {
            handleDelete(deleteTarget);
          }}
          style={{
            padding: '0.5rem 1.5rem',
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
        <button
          onClick={() => setDeleteTarget(null)}
          style={{
            padding: '0.5rem 1.5rem',
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}


      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          {/* Close Button */}
          <div
            onClick={() => setSelectedIndex(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#fff',
              cursor: 'pointer',
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: '8px 12px',
              borderRadius: '6px',
            }}
          >
            ✕
          </div>

          {/* Prev Button */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            style={{
              position: 'absolute',
              left: '20px',
              fontSize: '40px',
              fontWeight: 'bold',
              color: '#fff',
              cursor: 'pointer',
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: '10px 16px',
              borderRadius: '6px',
              userSelect: 'none',
            }}
          >
            ‹
          </div>

          {/* Next Button */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            style={{
              position: 'absolute',
              right: '20px',
              fontSize: '40px',
              fontWeight: 'bold',
              color: '#fff',
              cursor: 'pointer',
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: '10px 16px',
              borderRadius: '6px',
              userSelect: 'none',
            }}
          >
            ›
          </div>

          {/* Image */}
          <img
            src={imageUrls[selectedIndex].url}
            alt="Enlarged"
            style={{
              maxWidth: '85%',
              maxHeight: '85%',
              borderRadius: '10px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Fade-in Keyframes */}
          <style>
            {`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}
          </style>
        </div>
      )}
    </div>
  );
}
