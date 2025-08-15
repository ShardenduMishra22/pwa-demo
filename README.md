# PWA Demo - Progressive Web Application with Next.js

This is a comprehensive Progressive Web Application (PWA) built with Next.js that demonstrates core PWA features including push notifications, home screen installation, and offline capabilities.

## 🚀 Features

- **📱 Installable**: Can be installed to home screen on mobile and desktop
- **🔔 Push Notifications**: Full push notification support with VAPID keys
- **⚡ Fast Loading**: Optimized performance with Next.js
- **🌐 Service Worker**: Background processing and caching
- **🔒 Secure**: Implements security headers and best practices
- **📱 Responsive**: Works seamlessly across all devices

## 🛠️ Setup and Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd pwa-demo
```

2. Install dependencies
```bash
npm install
```

3. Environment variables are already configured with VAPID keys in `.env.local`

4. Start the development server
```bash
npm run dev
```

The app will be available at `http://localhost:3001` (or next available port)

## 🔑 PWA Features

### 1. Web App Manifest
- Configured in `src/app/manifest.ts`
- Defines app name, icons, display mode, and theme colors
- Enables home screen installation

### 2. Push Notifications
- **Subscribe/Unsubscribe**: Users can opt-in to push notifications
- **Send Test Notifications**: Send custom test messages
- **VAPID Authentication**: Secure push notifications using VAPID keys
- **Cross-browser Support**: Works on Chrome, Firefox, Safari, and Edge

### 3. Service Worker
- Located at `public/sw.js`
- Handles push notification display
- Manages notification clicks
- Can be extended for offline caching

### 4. Security Headers
- Content Security Policy (CSP)
- X-Frame-Options for clickjacking protection
- X-Content-Type-Options for MIME sniffing protection
- Referrer Policy configuration

## 📱 Testing the PWA

### Testing Push Notifications

1. **Enable Notifications**: Click "Subscribe" in the Push Notifications section
2. **Send Test**: Enter a message and click "Send Test"
3. **Verify**: You should receive a browser notification

### Testing Installation

#### Desktop (Chrome/Edge):
1. Look for the install icon in the address bar
2. Click to install the PWA

#### Mobile (iOS Safari):
1. Tap the share button
2. Select "Add to Home Screen"

#### Mobile (Android Chrome)
1. Tap the menu (three dots)
2. Select "Add to Home Screen"

### Testing with HTTPS (Required for PWA features)

For full PWA functionality, run with HTTPS:

```bash
npm run dev -- --experimental-https
```

## 🔧 Configuration

### VAPID Keys
The app uses pre-generated VAPID keys in `.env.local`. For production, generate new keys:

```bash
npx web-push generate-vapid-keys
```

Update `.env.local` with your new keys:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

### Customizing the Manifest
Edit `src/app/manifest.ts` to customize:
- App name and description
- Icons and splash screens
- Theme colors
- Display mode

### Adding Offline Support
To add offline functionality, consider integrating:
- [Serwist](https://github.com/serwist/serwist) for service worker management
- Cache strategies for static assets and API responses

## 🏗️ Project Structure

```
src/
├── app/
│   ├── actions.ts          # Server actions for push notifications
│   ├── layout.tsx          # Root layout
│   ├── manifest.ts         # PWA manifest configuration
│   └── page.tsx            # Main page with PWA components
public/
├── icon-192x192.png        # App icon (192x192)
├── icon-512x512.png        # App icon (512x512)
└── sw.js                   # Service worker
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Deployment Considerations
1. **HTTPS Required**: PWAs require HTTPS in production
2. **Service Worker Scope**: Ensure service worker is served from root
3. **Icon Sizes**: Provide multiple icon sizes for different devices
4. **Database Integration**: Replace in-memory subscription storage with a database

## 📚 Learn More

- [Next.js PWA Documentation](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [PWA Best Practices](https://web.dev/pwa/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
