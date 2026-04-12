import { useState, useEffect } from 'react'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any
    initGoogleMaps?: () => void
  }
}

let loadPromise: Promise<void> | null = null

function loadGoogleMapsScript(): Promise<void> {
  if (loadPromise) return loadPromise

  if (window.google?.maps) {
    loadPromise = Promise.resolve()
    return loadPromise
  }

  loadPromise = new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not configured'))
      return
    }

    window.initGoogleMaps = () => resolve()

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`
    script.async = true
    script.defer = true
    script.onerror = () => {
      loadPromise = null
      reject(new Error('Failed to load Google Maps script'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key not configured')
      return
    }
    loadGoogleMapsScript()
      .then(() => setIsLoaded(true))
      .catch((e: Error) => setError(e.message))
  }, [])

  return { isLoaded, error, hasApiKey: !!GOOGLE_MAPS_API_KEY }
}
