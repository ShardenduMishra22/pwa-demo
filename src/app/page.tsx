'use client'

import { useState, useEffect } from 'react'
import { subscribeUser, unsubscribeUser, sendNotification } from './actions'

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

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
    )

    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
  }, [])

  if (isStandalone) {
    return null // Don't show install button if already installed
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
      <h3 className="text-xl font-semibold mb-4">Install App</h3>
      <button className="bg-purple-500 text-white px-4 py-2 rounded mb-4 hover:bg-purple-600">
        Add to Home Screen
      </button>
      {isIOS && (
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
