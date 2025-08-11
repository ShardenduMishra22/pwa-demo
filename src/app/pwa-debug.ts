// Development utility to help debug PWA install issues
export const logPWADebugInfo = () => {
  if (typeof window === 'undefined') return;
  
  console.group('🔍 PWA Debug Information');
  
  // Basic info
  console.log('🌐 Environment:', {
    protocol: window.location.protocol,
    host: window.location.host,
    userAgent: navigator.userAgent.slice(0, 100) + '...',
    isDev: process.env.NODE_ENV === 'development'
  });
  
  // PWA features
  console.log('📱 PWA Features:', {
    serviceWorkerSupported: 'serviceWorker' in navigator,
    pushManagerSupported: 'PushManager' in window,
    notificationsSupported: 'Notification' in window,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    isIOSStandalone: (navigator as typeof navigator & { standalone?: boolean }).standalone === true
  });
  
  // Manifest check
  const manifestLink = document.querySelector('link[rel="manifest"]');
  console.log('📄 Manifest:', {
    manifestLinkExists: !!manifestLink,
    manifestHref: manifestLink?.getAttribute('href') || 'Not found'
  });
  
  // Service Worker status
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      console.log('🔧 Service Worker:', {
        scope: registration.scope,
        updateViaCache: registration.updateViaCache,
        installing: !!registration.installing,
        waiting: !!registration.waiting,
        active: !!registration.active
      });
    });
  }
  
  // Install criteria tips
  console.log('💡 Install Prompt Tips:');
  console.log('• Visit the site multiple times over several days');
  console.log('• Spend at least 30 seconds on the page');
  console.log('• Interact with the page (click, scroll, etc.)');
  console.log('• Ensure you\'re on HTTPS (localhost is OK)');
  console.log('• Chrome: Check chrome://flags/#bypass-app-banner-engagement-checks');
  console.log('• DevTools: Application > Manifest > "Add to homescreen"');
  
  console.groupEnd();
};

export const forcePWAPrompt = () => {
  if (typeof window === 'undefined') return;
  
  // Try to manually trigger install for testing
  const event = new Event('beforeinstallprompt') as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string; platform: string }>;
  };
  event.prompt = () => Promise.resolve();
  event.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
  
  console.log('🧪 Dispatching fake beforeinstallprompt event for testing...');
  window.dispatchEvent(event);
};
