import { useState, useRef, useEffect } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import './App.css'

function App() {
  const [recognizedText, setRecognizedText] = useState('')
  const [activePage, setActivePage] = useState('Home')
  const [speechStatus, setSpeechStatus] = useState('')

  const [cameraActive, setCameraActive] = useState(false)
  const [cameraStatus, setCameraStatus] = useState('Camera is stopped')
  const [prediction, setPrediction] = useState('--')
  const [confidence, setConfidence] = useState(0)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const landmarkerRef = useRef(null)
  const streamRef = useRef(null)
  const animationRef = useRef(null)

  const predictionHistoryRef = useRef([])
  const lastAddedPredictionRef = useRef(null)
  const lastRequestTimeRef = useRef(0)
  const isRequestingRef = useRef(false)

  const navigation = ['Home', 'Translator', 'About']

  // Initialize MediaPipe.
  async function initializeHandLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
    )

    const landmarker = await HandLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath: '/models/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      }
    )

    landmarkerRef.current = landmarker
  }

  // Start webcam.
  async function startCamera() {
    try {
      setCameraStatus('Requesting camera permission...')

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is unavailable. Use localhost or HTTPS.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      })

      streamRef.current = stream

      if (!landmarkerRef.current) {
        setCameraStatus('Loading hand detection model...')
        await initializeHandLandmarker()
      }

      const video = videoRef.current

      if (!video) {
        throw new Error('Camera preview is unavailable.')
      }

      video.srcObject = stream

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve
        video.onerror = () => reject(
          new Error('Could not load camera video.')
        )
      })

      await video.play()

      predictionHistoryRef.current = []
      lastAddedPredictionRef.current = null
      lastRequestTimeRef.current = 0

      setPrediction('--')
      setConfidence(0)
      setCameraActive(true)
      setCameraStatus('Camera is running. Show A, B or C.')

      processCameraFrame()

    } catch (error) {
      console.error('Camera error:', error)

      stopCamera()

      setCameraStatus(error.message || 'Unable to start camera.')
    }
  }

  // Send landmarks to Django.
  async function sendLandmarksToBackend(features) {
    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/prediction/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ features })
        }
      )

      if (!response.ok) {
        throw new Error(`Django API error: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      console.error('Prediction API error:', error)

      setCameraStatus(
        'Cannot connect to Django. Check the backend server.'
      )

      return null
    }
  }

  // Process webcam frames.
  async function processCameraFrame() {
    const video = videoRef.current
    const canvas = canvasRef.current
    const landmarker = landmarkerRef.current

    if (
      !video ||
      !canvas ||
      !landmarker ||
      video.readyState < 2
    ) {
      animationRef.current = requestAnimationFrame(processCameraFrame)
      return
    }

    const context = canvas.getContext('2d')

    const width = video.videoWidth
    const height = video.videoHeight

    canvas.width = width
    canvas.height = height

    // Mirror the camera frame before detection.
    context.save()
    context.translate(width, 0)
    context.scale(-1, 1)
    context.drawImage(video, 0, 0, width, height)
    context.restore()

    const results = landmarker.detectForVideo(
      canvas,
      performance.now()
    )

    if (results.landmarks && results.landmarks.length > 0) {
      const hand = results.landmarks[0]

      const features = []

      hand.forEach((landmark) => {
        features.push(
          landmark.x,
          landmark.y,
          landmark.z
        )
      })

      if (
        features.length === 63 &&
        !isRequestingRef.current &&
        performance.now() - lastRequestTimeRef.current >= 200
      ) {
        isRequestingRef.current = true
        lastRequestTimeRef.current = performance.now()

        try {
          const result = await sendLandmarksToBackend(features)

          if (result && result.prediction) {
            const currentPrediction = result.prediction

            setPrediction(currentPrediction)
            setConfidence(result.confidence || 0)

            const history = predictionHistoryRef.current

            history.push(currentPrediction)

            if (history.length > 10) {
              history.shift()
            }

            // Require 10 consecutive matching predictions.
            if (
              history.length === 10 &&
              history.every((item) => item === currentPrediction)
            ) {
              if (
                lastAddedPredictionRef.current !== currentPrediction
              ) {
                setRecognizedText((previous) => {
                  return previous + currentPrediction
                })

                lastAddedPredictionRef.current = currentPrediction
              }
            }
          }

        } finally {
          isRequestingRef.current = false
        }
      }

    } else {
      predictionHistoryRef.current = []
      lastAddedPredictionRef.current = null

      setPrediction('No hand')
      setConfidence(0)
    }

    animationRef.current = requestAnimationFrame(processCameraFrame)
  }

  // Stop webcam.
  function stopCamera() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    if (landmarkerRef.current) {
      landmarkerRef.current.close()
      landmarkerRef.current = null
    }

    predictionHistoryRef.current = []
    lastAddedPredictionRef.current = null
    isRequestingRef.current = false

    setCameraActive(false)
    setPrediction('--')
    setConfidence(0)
    setCameraStatus('Camera is stopped')
  }

  // Add a space between words.
  function addSpace() {
    setRecognizedText((previous) => {
      if (!previous || previous.endsWith(' ')) {
        return previous
      }

      return previous + ' '
    })
  }

  // Delete the last character.
  function deleteLastLetter() {
    setRecognizedText((previous) => previous.slice(0, -1))
  }

  // Clear translated text.
  function clearText() {
    window.speechSynthesis?.cancel()

    setRecognizedText('')
    setSpeechStatus('')

    lastAddedPredictionRef.current = null
    predictionHistoryRef.current = []
  }

  // Convert text to speech.
  function speakText() {
    const text = recognizedText.trim()

    if (!text) {
      setSpeechStatus('Please enter some text before clicking Speak text.')
      return
    }

    if (!('speechSynthesis' in window)) {
      setSpeechStatus('Your browser does not support text-to-speech.')
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    utterance.lang = 'en-US'
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1

    utterance.onstart = () => {
      setSpeechStatus('Speaking...')
    }

    utterance.onend = () => {
      setSpeechStatus('Speech completed.')
    }

    utterance.onerror = (event) => {
      setSpeechStatus(`Speech failed: ${event.error}`)
    }

    window.speechSynthesis.speak(utterance)
  }

  // Navigation.
  function openPage(page) {
    if (page !== activePage) {
      window.speechSynthesis?.cancel()
      setSpeechStatus('')
    }

    if (page !== 'Translator' && cameraActive) {
      stopCamera()
    }

    setActivePage(page)

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Cleanup resources.
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      streamRef.current?.getTracks().forEach((track) => track.stop())

      landmarkerRef.current?.close()
    }
  }, [])

  return (
    <div className="app">

      {/* Navigation */}
      <header className="navbar">

        <a
          className="brand"
          href="#home"
          onClick={(event) => {
            event.preventDefault()
            openPage('Home')
          }}
        >
          <span className="brand-icon">✋</span>

          <span>
            Sign<span className="brand-accent">Connect</span>
          </span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">

          {navigation.map((item) => (
            <button
              key={item}
              type="button"
              className={
                activePage === item
                  ? 'nav-link active'
                  : 'nav-link'
              }
              onClick={() => openPage(item)}
            >
              {item}
            </button>
          ))}

        </nav>

        <button
          type="button"
          className="nav-cta"
          onClick={() => openPage('Translator')}
        >
          Start Translating →
        </button>

      </header>

      {/* Home Page */}
      {activePage === 'Home' && (

        <main>

          <section className="hero">

            <div className="hero-content">

              <div className="eyebrow">
                <span className="status-dot" />
                AI-POWERED COMMUNICATION
              </div>

              <h1>
                Every gesture
                <br />
                tells a <span>story.</span>
              </h1>

              <p className="hero-description">
                Bridging communication gaps through intelligent sign
                recognition. Turn hand gestures into meaningful text
                and make communication more accessible.
              </p>

              <div className="hero-actions">

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => openPage('Translator')}
                >
                  Try the Translator →
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => openPage('About')}
                >
                  Explore the Project
                </button>

              </div>

              <div className="hero-note">
                <span>✦</span>
                Built with React, Django and AI
              </div>

            </div>

            <div className="hero-visual">

              <div className="visual-orbit orbit-one" />
              <div className="visual-orbit orbit-two" />

              <div className="visual-card">

                <div className="visual-card-header">
                  <span>LIVE RECOGNITION</span>
                  <span className="preview-badge">AI MODEL</span>
                </div>

                <div className="hand-illustration">✋</div>

                <div className="recognition-label">
                  Supported gestures
                </div>

                <div className="recognition-result">
                  A · B · C
                </div>

                <div className="visual-divider" />

                <div className="visual-footer">
                  <span>AI Sign Recognition</span>
                  <span className="footer-indicator" />
                </div>

              </div>

              <div className="floating-chip chip-top">
                <span>✦</span> Intelligent Recognition
              </div>

              <div className="floating-chip chip-bottom">
                <span>✓</span> Accessible Communication
              </div>

            </div>

          </section>

          <section className="features">

            <div className="section-heading">
              <span className="section-kicker">WHAT WE OFFER</span>
              <h2>Communication without barriers.</h2>
              <p>
                Designed to make sign recognition simple and accessible.
              </p>
            </div>

            <div className="feature-grid">

              <article className="feature-card">
                <div className="feature-icon">✋</div>
                <h3>AI Recognition</h3>
                <p>
                  Recognize supported hand gestures using a trained
                  machine-learning model.
                </p>
              </article>

              <article className="feature-card">
                <div className="feature-icon">Aa</div>
                <h3>Text Conversion</h3>
                <p>
                  View recognized letters and build text from supported signs.
                </p>
              </article>

              <article className="feature-card">
                <div className="feature-icon">♫</div>
                <h3>Voice Output</h3>
                <p>
                  Listen to entered or recognized text using browser
                  text-to-speech.
                </p>
              </article>

            </div>

          </section>

        </main>

      )}

      {/* Translator Page */}
      {activePage === 'Translator' && (

        <main className="translator-page">

          <div className="page-heading">

            <span className="section-kicker">
              YOUR TRANSLATION SPACE
            </span>

            <h1>Sign Language Translator</h1>

            <p>
              Show your hand gestures to recognize signs A, B and C.
            </p>

          </div>

          <div className="translator-grid">

            {/* Camera Panel */}
            <section className="translator-panel">

              <div className="panel-heading">
                <h2>Live Camera</h2>

                <span className="preview-badge">
                  {cameraActive ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>

              <div className="camera-container">

                <video
                  ref={videoRef}
                  className="camera-video"
                  autoPlay
                  playsInline
                  muted
                />

                <canvas
                  ref={canvasRef}
                  className="processing-canvas"
                />

                {!cameraActive && (

                  <div className="camera-overlay">

                    <div className="camera-icon">▣</div>

                    <h3>Camera is ready</h3>

                    <p>
                      Start your camera to detect hand gestures.
                    </p>

                  </div>

                )}

              </div>

              <div className="camera-actions">

                <button
                  type="button"
                  className="primary-button"
                  onClick={startCamera}
                  disabled={cameraActive}
                >
                  Start Camera
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={stopCamera}
                  disabled={!cameraActive}
                >
                  Stop Camera
                </button>

              </div>

              <p className="panel-footnote" role="status">
                {cameraStatus}
              </p>

              <div className="prediction-card">

                <div>
                  <span className="prediction-label">
                    PREDICTED SIGN
                  </span>

                  <h2>{prediction}</h2>
                </div>

                <div>
                  <span className="prediction-label">
                    CONFIDENCE
                  </span>

                  <h2>{confidence.toFixed(1)}%</h2>
                </div>

              </div>

              <p className="panel-footnote">
                Keep one hand visible and hold each gesture steadily.
                A letter is added after 10 consecutive matching predictions.
              </p>

            </section>

            {/* Recognized Text Panel */}
            <section className="translator-panel">

              <div className="panel-heading">

                <h2>Recognized Text</h2>

                <span className="text-count">
                  {recognizedText.length} characters
                </span>

              </div>

              <textarea
                className="recognized-text"
                value={recognizedText}
                onChange={(event) => {
                  setRecognizedText(event.target.value)
                  setSpeechStatus('')
                }}
                placeholder="Your recognized letters will appear here..."
                aria-label="Recognized text"
              />

              {/* Text Editing Buttons */}
              <div className="text-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={addSpace}
                >
                  Add Space
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={deleteLastLetter}
                >
                  Backspace
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={clearText}
                >
                  Clear Text
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={speakText}
                >
                  🔊 Speak Text
                </button>

              </div>

              {speechStatus && (

                <p className="panel-footnote" role="status">
                  {speechStatus}
                </p>

              )}

              <div className="about-note">

                <h2>Supported Signs</h2>

                <p>
                  The current trained Random Forest model recognizes
                  three classes: A, B and C.
                </p>

              </div>

            </section>

          </div>

        </main>

      )}

      {/* About Page */}
      {activePage === 'About' && (

        <main className="about-page">

          <span className="section-kicker">
            ABOUT THE PROJECT
          </span>

          <h1>
            Technology that brings people closer.
          </h1>

          <p>
            SignConnect is an AI Sign Language Translator project combining
            a React frontend, a Django backend, and machine-learning-based
            hand gesture recognition.
          </p>

          <div className="about-note">

            <h2>Current recognition model</h2>

            <p>
              The existing trained model supports three classes: A, B and C.
              Additional signs require suitable training data and model
              training.
            </p>

          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() => openPage('Translator')}
          >
            Open Translator →
          </button>

        </main>

      )}

      {/* Footer */}
      <footer className="footer">

        <div className="footer-brand">
          Sign<span>Connect</span>
        </div>

        <p>
          Making communication more accessible through AI.
        </p>

        <span>
          AI Sign Language Translator · 2026
        </span>

      </footer>

    </div>
  )
}

export default App