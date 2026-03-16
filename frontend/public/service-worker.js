/**
 * Service Worker for CBC Learning Ecosystem PWA
 * Enables offline functionality for students and teachers
 */

const CACHE_VERSION = 'cbc-learning-v1.2.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Files to cache immediately (critical app shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/assets/logo.svg',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
];

// API endpoints to cache (for offline access)
const CACHEABLE_API_PATTERNS = [
  /\/api\/v1\/students\/\d+\/profile/,
  /\/api\/v1\/students\/\d+\/competencies/,
  /\/api\/v1\/students\/\d+\/assignments/,
  /\/api\/v1\/teachers\/dashboard/,
  /\/api\/v1\/teachers\/classes/,
];

// API endpoints that should NEVER be cached (always fresh)
const NO_CACHE_PATTERNS = [
  /\/api\/v1\/auth\//,
  /\/api\/v1\/payments\//,
  /\/api\/v1\/notifications/,
];

/**
 * Install Event
 * Cache static assets when service worker is installed
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

/**
 * Activate Event
 * Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('cbc-learning-') && name !== CACHE_VERSION)
          .map((name) => {
            console.log('[ServiceWorker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Claim clients to activate immediately
      return self.clients.claim();
    })
  );
});

/**
 * Fetch Event
 * Intercept network requests and implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Determine caching strategy based on URL
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

/**
 * Handle API Requests
 * Strategy: Network First (with cache fallback)
 */
async function handleAPIRequest(request) {
  const url = new URL(request.url);

  // Check if this endpoint should never be cached
  if (NO_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    return networkOnly(request);
  }

  // Check if this endpoint should be cached
  const shouldCache = CACHEABLE_API_PATTERNS.some((pattern) =>
    pattern.test(url.pathname)
  );

  if (shouldCache) {
    return networkFirstStrategy(request, API_CACHE);
  }

  // Default: Network only for API requests
  return networkOnly(request);
}

/**
 * Handle Static Requests
 * Strategy: Cache First (with network fallback)
 */
async function handleStaticRequest(request) {
  return cacheFirstStrategy(request, DYNAMIC_CACHE);
}

/**
 * Network First Strategy
 * Try network first, fall back to cache if offline
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const response = await fetch(request);

    // Clone response before caching
    const responseClone = response.clone();

    // Cache successful responses
    if (response.ok) {
      caches.open(cacheName).then((cache) => {
        cache.put(request, responseClone);
      });
    }

    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[ServiceWorker] Serving from cache (offline):', request.url);
      return cachedResponse;
    }

    // No cache available, return offline page
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }

    // Return error response
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Cache First Strategy
 * Try cache first, fall back to network if not cached
 */
async function cacheFirstStrategy(request, cacheName) {
  // Try cache first
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Not in cache, fetch from network
  try {
    const response = await fetch(request);

    // Clone and cache if successful
    if (response.ok) {
      const responseClone = response.clone();
      caches.open(cacheName).then((cache) => {
        cache.put(request, responseClone);
      });
    }

    return response;
  } catch (error) {
    // Network failed and not in cache
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }

    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Network Only Strategy
 * Always fetch from network, no caching
 */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Background Sync Event
 * Sync offline data when connection is restored
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);

  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }

  if (event.tag === 'sync-assignment-submissions') {
    event.waitUntil(syncAssignmentSubmissions());
  }

  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  }
});

/**
 * Sync Offline Data
 * Send all queued offline actions to server
 */
async function syncOfflineData() {
  try {
    // Get offline queue from IndexedDB
    const db = await openDB();
    const queue = await getAllFromStore(db, 'offline-queue');

    if (queue.length === 0) {
      console.log('[ServiceWorker] No offline data to sync');
      return;
    }

    console.log(`[ServiceWorker] Syncing ${queue.length} offline actions`);

    // Process each queued item
    for (const item of queue) {
      try {
        const response = await fetch('/api/v1/sync/offline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item),
        });

        if (response.ok) {
          // Remove from queue
          await deleteFromStore(db, 'offline-queue', item.id);
          console.log('[ServiceWorker] Synced:', item.action);
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync:', item.action, error);
      }
    }

    console.log('[ServiceWorker] Offline sync complete');
  } catch (error) {
    console.error('[ServiceWorker] Sync error:', error);
  }
}

/**
 * Sync Assignment Submissions
 */
async function syncAssignmentSubmissions() {
  // Similar implementation to syncOfflineData
  console.log('[ServiceWorker] Syncing assignment submissions');
}

/**
 * Sync Attendance
 */
async function syncAttendance() {
  // Similar implementation to syncOfflineData
  console.log('[ServiceWorker] Syncing attendance data');
}

/**
 * Push Notification Event
 * Handle push notifications (grades, announcements, etc.)
 */
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/badge.png',
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Notification Click Event
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if already open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

/**
 * IndexedDB Helpers
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cbc-learning-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offline-queue')) {
        db.createObjectStore('offline-queue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteFromStore(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

console.log('[ServiceWorker] Loaded');
