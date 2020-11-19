self.addEventListener('fetch', function (event) {
    event.respondWith(caches.open('cache').then(function (cache) {
        return cache.match(event.request).then(function (response) {
            console.log("cache request: " + event.request.url);
            var fetchPromise = fetch(event.request).then(function (networkResponse) {
                console.log("fetch completed: " + event.request.url, networkResponse);
                if (networkResponse) {
                    console.debug("updated cached page: " + event.request.url, networkResponse);
                    if (event.request.method === 'GET' && networkResponse.type === 'basic') {
                        cache.put(event.request, networkResponse.clone());
                    }
                }
                return networkResponse;
            }, function (event) {
                console.log("Error in fetch()", event);
                event.waitUntil(
                    caches.open('cache').then(function (cache) {
                        return cache.addAll
                        ([
                            '/',
                            '/index.html',
                            '/index.html?homescreen=1',
                            '/?homescreen=1',
                            '/learn',
                            '/learn/',
                            '/learn/index.html',
                            '/super30.html',
                            '/css/animate.css',
                            '/css/bootstrap.min.css',
                            '/css/ionicons.min.css',
                            '/css/magnific-popup.css',
                            '/css/owl.carousel.min.css',
                            '/css/responsive.css',
                            '/css/styles.css',
                            '/css/swiper.min.css',
                            '/css/super30.css',
                            '/images/assets/events/fba.png',
                            '/images/assets/events/fbw.png',
                            '/images/assets/events/rpj.png',
                            '/images/assets/diversity.png',
                            '/images/assets/logo2.png',
                            '/images/assets/team/avatar.png',
                            '/images/assets/technologies/android.png',
                            '/images/assets/technologies/cloud.png',
                            '/images/assets/technologies/mi.png',
                            '/images/assets/technologies/web.png',
                            '/images/assets/team/avatar.png',
                            '/js/custom.js',
                            '/js/data.js',
                            '/js/super30.js',
                            '/js/firebase.config.js',
                            '/js/vendors/bootstrap.bundle.min.js',
                            '/js/vendors/jquery.easing.min.js',
                            '/js/vendors/jquery.magnific-popup.min.js',
                            '/js/vendors/jquery.min.js',
                            '/js/vendors/owl.carousel.min.js',
                            '/js/vendors/swiper.min.js',
                            '/js/vendors/firebase-app.js',,
                            '/js/vendors/firebase-storage.js',
                            '/js/vendors/firebase-firestore.js',
                            '/js/vendors/handlebars.min.js',
                            'https://fonts.googleapis.com/css?family=Google+Sans:400,500,700|Material+Icons',
                            'https://www.google-analytics.com/analytics.js',
                            'https://use.fontawesome.com/releases/v5.2.80/css/all.css',
                            '/DSCfuta  Super 30 (Responses) - Form Responses 1.tsv',
                            '/service-worker.js',
                            '/manifest.json',
                        ]);
                    })
                );
            });
            return response || fetchPromise;
        });
    }));
});
self.addEventListener('install', function (event) {
    self.skipWaiting();
    console.log("Latest version installed!");
});