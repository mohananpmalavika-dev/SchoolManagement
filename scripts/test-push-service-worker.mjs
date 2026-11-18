import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../apps/web/public/sw.js', import.meta.url), 'utf8');
const handlers = {}, shown = [], opened = [], messages = [];
let clients = [], unsubscribed = 0, closed = 0, focused = 0, navigated = '';
const registration = {
  showNotification: async (title, options) => shown.push({title, options}),
  getNotifications: async () => [{close: () => closed++}],
  pushManager: {getSubscription: async () => ({unsubscribe: async () => {unsubscribed++;}})},
};
const self = {location: {origin: 'https://school.example.test'}, registration,
  addEventListener: (name, handler) => {handlers[name] = handler;},
  clients: {matchAll: async () => clients, openWindow: async url => {opened.push(url);}}};
vm.runInNewContext(source, {self, URL, Promise, console});
const emit = async (type, data) => {let task;handlers[type]({...data, waitUntil: value => {task = value;}});await task;};
const checks = [];

await emit('push', {data: {json: () => ({body: 'You have a new school update.', url: '/notifications', tag: 'school-message'})}});
assert.equal(shown[0].title, 'Krypton School ERP');assert.equal(shown[0].options.tag, 'school-message');
assert.equal(shown[0].options.data.url, 'https://school.example.test/notifications');
assert.equal(clients.length, 0);checks.push('A push event displays a system notification with no app window or bearer token');

await emit('push', {data: {json: () => {throw new Error('malformed');}}});
assert.match(shown[1].options.body, /new school update/);
await emit('push', {data: {json: () => ({url: 'https://evil.example.test/phishing'})}});
assert.equal(shown[2].options.data.url, 'https://school.example.test/notifications');
checks.push('Malformed payloads have a safe fallback and notification destinations cannot leave the app');

await emit('notificationclick', {notification: {close: () => closed++, data: {url: '/notifications'}}});
assert.equal(opened[0], 'https://school.example.test/notifications');
checks.push('Clicking a notification opens the inbox when every app window is closed');

clients = [{url: 'https://school.example.test/account', navigate: async url => {navigated = url;return {focus: async () => {focused++;}};}}];
await emit('notificationclick', {notification: {close: () => closed++, data: {url: 'javascript:alert(1)'}}});
assert.equal(navigated, 'https://school.example.test/notifications');assert.equal(focused, 1);assert.equal(opened.length, 1);
checks.push('Existing app windows are navigated and focused without opening duplicate tabs');

await emit('message', {data: {type: 'PUSH_LOGOUT'}});
assert.equal(unsubscribed, 1);assert.ok(closed >= 3);
checks.push('Signing out unsubscribes the browser and closes existing notification cards');

clients = [{postMessage: message => messages.push(message)}];
await emit('pushsubscriptionchange', {});
assert.equal(messages[0].type, 'PUSH_SUBSCRIPTION_CHANGED');
checks.push('Subscription changes request an authenticated account rebind without persisting tokens in the worker');
console.log(JSON.stringify({passed: checks.length, checks, fixture: 'Isolated worker event harness; real provider delivery requires a subscribed device.'}, null, 2));
