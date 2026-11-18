import { apiClient } from './api-client';
import { isIOSDevice, isPWA } from './pwa';

export function supportsBackgroundPush() {
  return typeof window !== 'undefined' && window.isSecureContext && 'Notification' in window &&
    'serviceWorker' in navigator && 'PushManager' in window;
}

export async function pushConfiguration() {
  return (await apiClient.get<{ enabled: boolean; publicKey: string | null }>('/push/config')).data;
}

function serverKey(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64 + '='.repeat((4 - base64.length % 4) % 4));
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index);
  return bytes.buffer;
}

export function usesPushServerKey(subscription: PushSubscription, publicKey: string) {
  const existing = subscription.options.applicationServerKey;
  return !!existing && new Uint8Array(existing).join(',') === new Uint8Array(serverKey(publicKey)).join(',');
}

export async function currentPushSubscription() {
  if (!supportsBackgroundPush()) return null;
  const registration = await navigator.serviceWorker.getRegistration('/');
  return registration?.pushManager.getSubscription() || null;
}

async function save(subscription: PushSubscription) {
  await apiClient.post('/push/subscriptions', subscription.toJSON());
  window.dispatchEvent(new Event('krypton-push-changed'));
}

export async function enableBackgroundPush() {
  if (!supportsBackgroundPush()) throw new Error('This browser does not support background push. Use a supported browser over HTTPS.');
  if (isIOSDevice() && !isPWA()) throw new Error('Add Krypton to your Home Screen, open the installed app, then enable notifications.');
  // Request permission while this call is still attached to the user's button click.
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') throw new Error(permission === 'denied'
    ? 'Notifications are blocked. Allow them in your browser settings, then try again.'
    : 'Notification permission was not granted.');
  const config = await pushConfiguration();
  if (!config.enabled || !config.publicKey) throw new Error('Your school has not configured background push yet.');
  await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  const key = serverKey(config.publicKey);
  // An explicit enable also repairs subscriptions that the provider has expired.
  if (subscription) {
    await apiClient.delete('/push/subscriptions', { data: { endpoint: subscription.endpoint } });
    await subscription.unsubscribe(); subscription = null;
  }
  subscription ||= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  await save(subscription);
}

export async function syncBackgroundPush() {
  // Existing opt-in devices are rebound on login, without prompting other users.
  if (!supportsBackgroundPush() || Notification.permission !== 'granted') return;
  const subscription = await currentPushSubscription();
  if (!subscription) return;
  const config = await pushConfiguration();
  if (config.enabled && config.publicKey && usesPushServerKey(subscription, config.publicKey)) await save(subscription);
}

export async function disableBackgroundPush() {
  if (!supportsBackgroundPush()) return;
  const subscription = await currentPushSubscription();
  try {
    if (subscription) await apiClient.delete('/push/subscriptions', { data: { endpoint: subscription.endpoint } });
  } finally {
    if (subscription) await subscription.unsubscribe();
    const registration = await navigator.serviceWorker.getRegistration('/');
    const notifications = await registration?.getNotifications();
    notifications?.forEach(notification => notification.close());
    window.dispatchEvent(new Event('krypton-push-changed'));
  }
}

export async function testBackgroundPush() {
  const subscription = await currentPushSubscription();
  if (!subscription) throw new Error('Enable notifications on this device first.');
  return (await apiClient.post<{ message: string }>('/push/test', { endpoint: subscription.endpoint })).data;
}
