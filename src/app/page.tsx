'use client'

import { useState, useEffect } from 'react'
import { subscribeUser, unsubscribeUser, sendNotification } from '../test/actions'
import { logPWADebugInfo, forcePWAPrompt } from '../test/pwa-debug'

// Type definition for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  )
  const [message, setMessage] = useState('')

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
  }

  async function subscribeToPush() {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    })
    setSubscription(sub)
    const serializedSub = JSON.parse(JSON.stringify(sub))
    await subscribeUser(serializedSub)
  }

  async function unsubscribeFromPush() {
    await subscription?.unsubscribe()
    setSubscription(null)
    await unsubscribeUser()
  }

  async function sendTestNotification() {
    if (subscription) {
      await sendNotification(message)
      setMessage('')
    }
  }

  if (!isSupported) {
    return <p>Push notifications are not supported in this browser.</p>
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
      <h3 className="text-xl font-semibold mb-4">Push Notifications</h3>
      {subscription ? (
        <>
          <p className="text-green-600 mb-4">You are subscribed to push notifications.</p>
          <button 
            onClick={unsubscribeFromPush}
            className="bg-red-500 text-white px-4 py-2 rounded mb-4 mr-2 hover:bg-red-600"
          >
            Unsubscribe
          </button>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Enter notification message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2"
            />
            <button 
              onClick={sendTestNotification}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Send Test
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-gray-600 mb-4">You are not subscribed to push notifications.</p>
          <button 
            onClick={subscribeToPush}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Subscribe
          </button>
        </>
      )}
    </div>
  )
}

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
    )

    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    // Debug information for development
    const isDev = process.env.NODE_ENV === 'development'
    if (isDev) {
      const debugDetails = [
        `UA: ${navigator.userAgent.slice(0, 50)}...`,
        `Standalone: ${window.matchMedia('(display-mode: standalone)').matches}`,
        `SW Support: ${'serviceWorker' in navigator}`,
        `Protocol: ${window.location.protocol}`,
        `Host: ${window.location.host}`
      ]
      setDebugInfo(debugDetails.join(' | '))
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🎯 beforeinstallprompt event fired!', e)
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
      
      if (isDev) {
        console.log('✅ Install prompt is now available')
      }
    }

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      console.log('🎉 PWA was installed')
      setCanInstall(false)
      setDeferredPrompt(null)
    }

    // Check if already installed
    const checkIfInstalled = () => {
      // Check for display-mode: standalone
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      // Check for iOS standalone mode
      const isIOSStandalone = (window.navigator as typeof navigator & { standalone?: boolean }).standalone === true
      
      if (isStandaloneMode || isIOSStandalone) {
        console.log('✅ App is already installed')
        setIsStandalone(true)
      }
    }

    checkIfInstalled()

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // For development: Log when the component mounts
    if (isDev) {
      console.log('🔧 InstallPrompt component mounted')
      
      // Check PWA criteria in development
      setTimeout(() => {
        if (!canInstall) {
          console.log('ℹ️ beforeinstallprompt not fired. This is normal in development.')
          console.log('💡 To trigger it: Visit multiple times, wait 30+ seconds, or use Chrome DevTools')
        }
      }, 2000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [canInstall]) // Added canInstall to dependencies

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support beforeinstallprompt
      alert('To install this app:\n\n• Chrome: Click the install icon in the address bar\n• Firefox: Look for "Add to Home Screen" in the menu\n• Safari: Use "Add to Home Screen" from the share menu')
      return
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt()

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt')
      } else {
        console.log('❌ User dismissed the install prompt')
      }

      // Clear the deferredPrompt
      setDeferredPrompt(null)
      setCanInstall(false)
    } catch (error) {
      console.error('Error during installation:', error)
    }
  }

  const forceRefreshInstallState = () => {
    // Clear current state
    setDeferredPrompt(null)
    setCanInstall(false)
    
    // Check again after a brief delay
    setTimeout(() => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as typeof navigator & { standalone?: boolean }).standalone === true
      setIsStandalone(isStandaloneMode || isIOSStandalone)
      
      console.log('🔄 Install state refreshed')
    }, 100)
  }

  if (isStandalone) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
        <h3 className="text-xl font-semibold mb-4">App Installed</h3>
        <p className="text-green-600">✅ This app is already installed on your device!</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
      <h3 className="text-xl font-semibold mb-4">Install App</h3>
      
      {/* Development Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
          <div className="font-semibold mb-2">🔧 Dev Debug:</div>
          <div className="text-gray-600 mb-2">{debugInfo}</div>
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={forceRefreshInstallState}
              className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
            >
              🔄 Refresh
            </button>
            <button 
              onClick={logPWADebugInfo}
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
            >
              📊 Debug Info
            </button>
            <button 
              onClick={forcePWAPrompt}
              className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600"
            >
              🧪 Test Prompt
            </button>
          </div>
        </div>
      )}
      
      {canInstall && !isIOS && (
        <button 
          onClick={handleInstallClick}
          className="bg-purple-500 text-white px-4 py-2 rounded mb-4 hover:bg-purple-600 w-full"
        >
          📱 Install App
        </button>
      )}
      
      {!canInstall && !isIOS && (
        <div className="mb-4">
          <button 
            onClick={handleInstallClick}
            className="bg-blue-500 text-white px-4 py-2 rounded mb-2 w-full hover:bg-blue-600"
          >
            📱 Install App (Manual)
          </button>
          <p className="text-gray-600 text-sm mb-2">
            Install this app on your device for the best experience!
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded mb-2">
              <strong>🛠️ Development Mode:</strong> The install prompt may not always appear due to:
              <br />• Service Worker registration timing
              <br />• Browser engagement heuristics 
              <br />• Page refresh clearing browser state
              <br />• HTTPS requirements (use localhost or ngrok)
            </div>
          )}
          
          <p className="text-xs text-gray-500">
            💡 Automatic install prompt will appear when:
            <br />• You visit the site multiple times
            <br />• You spend time engaging with the page
            <br />• Your browser supports PWA installation
          </p>
        </div>
      )}
      
      {isIOS && (
        <div>
          <button 
            className="bg-purple-500 text-white px-4 py-2 rounded mb-4 hover:bg-purple-600 w-full opacity-50 cursor-not-allowed"
            disabled
          >
            📱 Install App (iOS)
          </button>
          <p className="text-sm text-gray-600">
            To install this app on your iOS device, tap the share button
            <span role="img" aria-label="share icon">
              {' '}
              ⎋{' '}
            </span>
            and then &ldquo;Add to Home Screen&rdquo;
            <span role="img" aria-label="plus icon">
              {' '}
              ➕{' '}
            </span>.
          </p>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to the PWA Demo</h1>
          <p className="text-lg text-gray-600">This is a Progressive Web App built with Next.js</p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2">
          <PushNotificationManager />
          <InstallPrompt />
        </div>
        
        <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">PWA Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>📱 Install to home screen</li>
            <li>🔔 Push notifications</li>
            <li>⚡ Fast loading</li>
            <li>📱 Native app-like experience</li>
            <li>🌐 Works offline (with service worker)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
