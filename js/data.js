$(function () {
  // Initialize Cloud Firestore through Firebase
  var db = firebase.firestore();
    

  // Disable deprecated features
  db.settings({
    timestampsInSnapshots: true
  });
  // Initialize Firebase Storage
  var storage = firebase.storage();
  var storageRef = storage.ref();
  var instructorImagesRef = storageRef.child('images/instructors');
  var eventImagesRef = storageRef.child('images/events');

  var $upcomingEventsList = $('#upcomingEventsList');
  var $pastEventsList = $('#pastEventsList');
  var $teamSlider = $('#carouselExample .carousel-inner');
  var eventTemplateSource = document.getElementById('events-template').innerHTML;
  var eventTemplate = Handlebars.compile(eventTemplateSource);
  var pastEventsTemplateSource = document.getElementById('past-events-template').innerHTML;
  var pastEventsTemplate = Handlebars.compile(pastEventsTemplateSource);
  var errorTemplateSource = document.getElementById('error-message-template').innerHTML;
  var errorTemplate = Handlebars.compile(errorTemplateSource);
  var spinnerTemplateSource = document.getElementById('spinner-template').innerHTML;
  var spinnerTemplate = Handlebars.compile(spinnerTemplateSource);
  var teamItemTemplateSource = document.getElementById('team-item-template').innerHTML;
  var teamItemTemplate = Handlebars.compile(teamItemTemplateSource);
  var projectsTemplateSource = document.getElementById('projects-template').innerHTML;
  var projectsTemplate = Handlebars.compile(projectsTemplateSource);
  $upcomingEventsList.empty();
  $pastEventsList.empty();
  $teamSlider.empty();
  // $teamSliderIndicators.empty();
  $upcomingEventsList.html(spinnerTemplate());
  $pastEventsList.html(spinnerTemplate());
  $teamSlider.html(spinnerTemplate());
  db.collection('events').get().then(function (querySnapshot) {
    var promises = [];
    querySnapshot.forEach(function (doc) {
      var data = doc.data();
      var id = doc.id;
      promises.push(new Promise(function (resolve, reject) {
        eventImagesRef.child(id).getDownloadURL().then(function (url) {
          resolve(Object.assign({}, data, {
            id: id,
            imageURL: url
          }));
        }).catch(function (error) {
          if (error.code === 'storage/object-not-found') {
            console.log('Image not found for', id)
            // Admin hasn't uploaded an image
            resolve(Object.assign({}, data, {
              id: id,
              imageURL: ''
            }));
          } else {
            reject(err);
          }
        });
      }))
    });
    return Promise.all(promises).then(function (data) {
      return [data, querySnapshot.metadata.fromCache === true]
    })
  }).then(function (results) {
    var data = results[0];
    var offline = results[1];
    if (!offline) {
      var pastEvents = data.filter(function (doc) {
        var docDate = doc.date;
        var date;
        var now = new Date();
        if (doc.from) {
          date = new Date(doc.to.seconds * 1000);
        } else {
          date = new Date(docDate.seconds * 1000);
        }
        return now > date;
      })
      var upcomingEvents = data.filter(function (doc) {
        var docDate = doc.date;
        var date;
        var now = new Date();
        if (doc.from) {
          date = new Date(doc.to.seconds * 1000);
        } else {
          date = new Date(docDate.seconds * 1000);
        }
        return now < date;
      })
      pastEvents = pastEvents.map(function (datum) {
        var newEvent = Object.assign({}, datum, {
          date: datum.date ? new Date(datum.date.seconds * 1000).toLocaleDateString() : '',
          time: datum.time ? new Date(datum.time.seconds * 1000).toLocaleTimeString() : ''
        });
        return newEvent
      })
      upcomingEvents = upcomingEvents.map(function (datum) {
        var newEvent = Object.assign({}, datum, {
          date: datum.date ? new Date(datum.date.seconds * 1000).toLocaleDateString() : '',
          time: datum.time ? new Date(datum.time.seconds * 1000).toLocaleTimeString() : ''
        });
        return newEvent
      })
      $upcomingEventsList.empty();
      $pastEventsList.empty();
      var html;
      if (upcomingEvents.length === 0) {
        html = errorTemplate({
          error: 'We have nothing planned, for now...'
        })
      } else {
        html = eventTemplate({
          events: upcomingEvents
        });
      }
      $upcomingEventsList.html(html)
      if (pastEvents.length === 0) {
        html = errorTemplate({
          error: 'Our past remains blank, look to the future...'
        })
      } else {
        html = pastEventsTemplate({
          events: pastEvents
        })
      }
      $pastEventsList.html(html);
    } else {
      var html = errorTemplate({
        error: 'Seems like you\'re offline. Please check your internet connection.'
      })
      $upcomingEventsList.html(html);
      $pastEventsList.html(html);
      function imageIntersectionObserverCallback(imageEntries, observer) {
        imageEntries.forEach(imgEntry => {
          if (imgEntry.isIntersecting) {
            imgEntry.target.setAttribute('src', imgEntry.target.dataset.src);
            observer.unobserve(imgEntry.target);
          }
        })
      }
      const imageObserver = new IntersectionObserver(imageIntersectionObserverCallback, { rootMargin: '30px 0px' });
      imageObserver.POLL_INTERVAL = 200;
      imageObserver.USE_MUTATION_OBSERVER = false;
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      })
    }
  }).catch(function (err) {
    console.warn(err);
    $upcomingEventsList.empty();
    $pastEventsList.empty();
    var html = errorTemplate({
      error: 'Failed to fetch events, please check your internet connection'
    });
    $upcomingEventsList.html(html);
    $pastEventsList.html(html);
  })
  db.collection('instructors').get().then(function (querySnapshot) {
    var promises = [];
    querySnapshot.forEach(function (doc) {
      promises.push(new Promise(function (resolve, reject) {
        var data = doc.data();
        var id = doc.id;
        instructorImagesRef.child(id).getDownloadURL().then(function (url) {
          resolve(Object.assign({}, data, {
            id: id,
            imageURL: url
          }));
        }).catch(function (error) { 
          if (error.code === 'storage/object-not-found') {
            // Instructor hasn't uploaded an image
            resolve(Object.assign({}, data, {
              id: id,
              imageURL: '/images/assets/team/avatar.png'
            }));
          } else {
            reject(err);
          }
        });
      }));
    })
    return Promise.all(promises);
  }).then(function (instructors) {
    instructors = instructors.map(function (data) {
      return Object.assign({}, data, {
        imageCSS: 'background-image: url(' + data.imageURL + ')'
      });
    });
    // $teamSliderIndicators.empty();
    // $teamSliderIndicators.append(new Array(instructors.length).fill(makeOwlDot()));
    $teamSlider.empty();
    var html;
    if (instructors.length > 0) {
      html = teamItemTemplate({
        instructors: instructors
      });
    } else {
      html = errorTemplate({
        error: 'Seems like you\'re offline. Please try again when online'
      });
    }
    $teamSlider.html(html);
    $teamSlider.children('.carousel-item').eq(0).addClass('active');
    var slider = new Hammer.Manager(document.getElementById('carouselExample'), { inputClass: Hammer.TouchInput });
    var Swipe = new Hammer.Swipe({ direction: Hammer.DIRECTION_HORIZONTAL });
    slider.add(Swipe);

    //implement swipe action on the carousel
    slider.on('swiperight swipeleft', function (e) {
      e.preventDefault();
      if (e.type == 'swiperight') {
        $(this).carousel('prev');
        checkitem();
      } else {
        $(this).carousel('next');
        checkitem();
      }
    });

    $('#carouselExample').carousel();
    $('#carouselExample').on('slide.bs.carousel', function (e) {
      var $e = $(e.relatedTarget);
      var idx = $e.index();
      var itemsPerSlide = 3;
      var totalItems = $('.carousel-item').length;

      if (idx >= totalItems - (itemsPerSlide - 1)) {
        var it = itemsPerSlide - (totalItems - idx);
        for (var i = 0; i < it; i++) {
          // append slides to end
          if (e.direction == "left") {
            $('.carousel-item').eq(i).appendTo('.carousel-inner');
          }
          else {
            $('.carousel-item').eq(0).appendTo('.carousel-inner');
          }
        }
      }
    });
    function imageIntersectionObserverCallback(imageEntries, observer) {
      imageEntries.forEach(imgEntry => {
        if (imgEntry.isIntersecting) {
          imgEntry.target.setAttribute('src', imgEntry.target.dataset.src);
          observer.unobserve(imgEntry.target);
        }
      })
    }
    const imageObserver = new IntersectionObserver(imageIntersectionObserverCallback, { rootMargin: '30px 0px' });
    imageObserver.POLL_INTERVAL = 200;
    imageObserver.USE_MUTATION_OBSERVER = false;
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    })
  }).catch(function (err) {
    console.warn(err);
    $teamSlider.empty();
    var html = errorTemplate({
      error: 'Failed to fetch instructors, please check your internet connection'
    });
    $teamSlider.html(html);
  });
});