self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    
    const options = {
        body: data.body || 'Ai o notificare nouă de la Ferma Agape!',
        icon: '/favicon.svg', // Iconița fermei
        badge: '/favicon.svg', // Iconița mică de sus din bară (pe Android)
        vibrate: [200, 100, 200], // Model de vibrație
        data: {
            url: data.url || '/' // Unde ducem user-ul când dă click pe notificare
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Ferma Agape', options)
    );
});

// Ce se întâmplă când utilizatorul apasă pe notificare
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
