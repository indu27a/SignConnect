import { useEffect, useState } from 'react'
import './Profile.css'

const API_URL = 'http://127.0.0.1:8000/api/accounts/profile/'

function Profile({ onProfileUpdate }) {
  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')

  const accessToken = localStorage.getItem('signconnect_access')

  // Fetch the logged-in user's profile.
  async function fetchProfile() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Unable to load your profile.')
      }

      const data = await response.json()

      setProfile(data)
      onProfileUpdate?.(data)
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone_number: data.phone_number || '',
        date_of_birth: data.date_of_birth || '',
        preferred_language: data.preferred_language || 'English',
        bio: data.bio || '',
      })

      setPreview(data.profile_picture || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  // Handle form input changes.
  function handleChange(event) {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // Handle profile picture selection.
  function handleImageChange(event) {
    const file = event.target.files[0]

    if (file) {
      setFormData((previous) => ({
        ...previous,
        profile_picture: file,
      }))

      setPreview(URL.createObjectURL(file))
    }
  }

  // Save profile changes.
  async function handleSave(event) {
    event.preventDefault()

    try {
      setSaving(true)
      setMessage('')
      setError('')

      const payload = new FormData()

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          payload.append(key, value)
        }
      })

      const response = await fetch(API_URL, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: payload,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          Object.values(data).flat().join(' ') ||
          'Unable to update your profile.'
        )
      }

      setProfile(data)
      onProfileUpdate?.(data)
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone_number: data.phone_number || '',
        date_of_birth: data.date_of_birth || '',
        preferred_language: data.preferred_language || 'English',
        bio: data.bio || '',
      })

      setPreview(data.profile_picture || '')
      setEditing(false)
      setMessage('Your profile has been updated successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="profile-loading">Loading your profile...</div>
  }

  if (error && !profile) {
    return <div className="profile-error">{error}</div>
  }

  if (!profile) {
    return null
  }

  const displayName =
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
    profile.username

  const initials = displayName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="profile-page">

      <div className="profile-heading">
        <span>YOUR PERSONAL SPACE</span>
        <h1>My Profile</h1>
        <p>Manage your identity and how people connect with you.</p>
      </div>

      {message && (
        <div className="profile-success" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="profile-error" role="alert">
          {error}
        </div>
      )}

      <section className="profile-card">

        <div className="profile-cover"></div>

        <div className="profile-main-info">

          <div className="profile-picture-wrapper">
            {preview ? (
              <img
                src={preview}
                alt="Profile"
                className="profile-picture"
              />
            ) : (
              <div className="profile-picture-placeholder">
                {initials}
              </div>
            )}
          </div>

          <div className="profile-identity">
            <h2>{displayName}</h2>
            <p>@{profile.username}</p>
            <span>SignConnect Member</span>
          </div>

          <button
            type="button"
            className="profile-edit-button"
            onClick={() => {
              setEditing(!editing)
              setMessage('')
              setError('')
            }}
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>

        </div>

        <div className="profile-divider"></div>

        <div className="profile-details">

          <div className="profile-section-heading">
            <h3>Personal Information</h3>
            <p>Your details and communication preferences.</p>
          </div>

          <form onSubmit={handleSave}>

            {editing && (
              <div className="profile-form-group">
                <label>Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            )}

            <div className="profile-form-grid">

              <div className="profile-form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name || ''}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>

              <div className="profile-form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name || ''}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>

              <div className="profile-form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>

              <div className="profile-form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number || ''}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>

              <div className="profile-form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth || ''}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>

              <div className="profile-form-group">
                <label>Preferred Language</label>
                <select
                  name="preferred_language"
                  value={formData.preferred_language || 'English'}
                  onChange={handleChange}
                  disabled={!editing}
                >
                  <option value="English">English</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Indian Sign Language">Indian Sign Language</option>
                </select>
              </div>

            </div>

            <div className="profile-form-group profile-bio-group">
              <label>About Me</label>
              <textarea
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                disabled={!editing}
                maxLength={300}
                placeholder="Tell the community a little about yourself..."
              />
              {editing && (
                <small>
                  {(formData.bio || '').length}/300 characters
                </small>
              )}
            </div>

            {editing && (
              <button
                type="submit"
                className="profile-save-button"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}

          </form>

        </div>

      </section>

    </div>
  )
}

export default Profile