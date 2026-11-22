import { useState } from 'react'
import './Community.css'

const API_URL = 'http://127.0.0.1:8000/api'

function Community({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
  })

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const endpoint = isRegister
      ? `${API_URL}/accounts/register/`
      : `${API_URL}/accounts/login/`

    const payload = isRegister
      ? formData
      : {
          username: formData.username,
          password: formData.password,
        }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage =
          typeof data === 'object'
            ? Object.values(data).flat().join(' ')
            : 'Something went wrong.'

        throw new Error(errorMessage)
      }

      if (isRegister) {
        setMessage('Registration successful! Please log in.')

        setIsRegister(false)

        setFormData((previous) => ({
          ...previous,
          password: '',
        }))
      } else {
        localStorage.setItem('signconnect_access', data.access)
        localStorage.setItem('signconnect_refresh', data.refresh)
        localStorage.setItem('signconnect_username', data.username)
        localStorage.setItem('signconnect_email', data.email)

        setMessage(`Welcome to SignConnect, ${data.username}!`)

        onLoginSuccess?.(data)
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="community-auth">
      <section className="auth-card">
        <div className="auth-heading">
          <div className="auth-icon">✋</div>

          <h1>
            Sign<span>Connect</span>
          </h1>

          <p>
            A community where everyone can communicate.
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={!isRegister ? 'auth-tab selected' : 'auth-tab'}
            onClick={() => {
              setIsRegister(false)
              setMessage('')
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={isRegister ? 'auth-tab selected' : 'auth-tab'}
            onClick={() => {
              setIsRegister(true)
              setMessage('')
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label>First Name</label>

              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Enter first name"
                required
              />

              <label>Last Name</label>

              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Enter last name"
                required
              />

              <label>Email</label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                required
              />

              <label>Phone Number</label>

              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </>
          )}

          <label>Username</label>

          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter username"
            required
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
            minLength={8}
          />

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : isRegister
                ? 'Create Account'
                : 'Login to Community'}
          </button>
        </form>

        {message && (
          <p className="auth-message" role="status">
            {message}
          </p>
        )}

        <p className="auth-footer">
          Making communication accessible for everyone.
        </p>
      </section>
    </main>
  )
}

export default Community