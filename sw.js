// Service Worker for Doctor Chanda Medical App
const CACHE_NAME = 'doctor-chanda-v1.0.0';
const STATIC_CACHE = 'doctor-chanda-static-v1.0.0';
const DYNAMIC_CACHE = 'doctor-chanda-dynamic-v1.0.0';

// Static assets to cache
const STATIC_ASSETS = [
    '/',
    '/favicon.ico',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/lucide@latest',
    'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache static assets:', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
    // Skip non-GET requests and external requests
    if (event.request.method !== 'GET' ||
        !event.request.url.startsWith(self.location.origin) &&
        !STATIC_ASSETS.some(asset => event.request.url.includes(asset))) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version if found
                if (response) {
                    return response;
                }

                // Otherwise, fetch from network
                return fetch(event.request)
                    .then(networkResponse => {
                        // Don't cache non-successful responses
                        if (!networkResponse.ok) {
                            return networkResponse;
                        }

                        // Cache successful responses
                        return caches.open(DYNAMIC_CACHE)
                            .then(cache => {
                                cache.put(event.request, networkResponse.clone());
                                return networkResponse;
                            });
                    })
                    .catch(error => {
                        console.log('Service Worker: Fetch failed, returning offline page if available');
                        // Return offline fallback for HTML requests
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/');
                        }
                    });
            })
    );
});

// Background sync for data operations
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync triggered:', event.tag);

    if (event.tag === 'background-data-sync') {
        event.waitUntil(syncPendingData());
    }
});

// Push notifications
self.addEventListener('push', event => {
    console.log('Service Worker: Push received');

    const options = {
        body: event.data ? event.data.text() : 'New notification from Doctor Chanda',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View',
                icon: '/favicon.ico'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/favicon.ico'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Doctor Chanda', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked');

    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Sync pending data (placeholder for future implementation)
async function syncPendingData() {
    try {
        // This would sync any pending data operations when back online
        console.log('Service Worker: Syncing pending data...');
        // Implementation would depend on specific data sync requirements
    } catch (error) {
        console.error('Service Worker: Data sync failed:', error);
    }
}