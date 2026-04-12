const PUBLIC_VAPID_KEY = "BDx2N8k0yjgG_kBeRuTJ8sPtBGLqVXN0N4ZEoXNWCz9UQt5Tt1uL1kxwrV7XrtIWPBY88NyDt79OaH8dNFmO04s";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToNotifications() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if we already have a subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });
    }

    // Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    return true;
  } catch (err) {
    console.error('Failed to subscribe to push notifications:', err);
    return false;
  }
}

export async function checkNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  
  const permission = await Notification.requestPermission();
  return permission;
}
