$(function () {
  var templateSources = {
    spinner: document.getElementById('spinner-template').innerHTML,
    error: document.getElementById('error-message-template').innerHTML,
    event: document.getElementById('event-template').innerHTML
  }
  var template = {
    spinner: Handlebars.compile(templateSources.spinner),
    error: Handlebars.compile(templateSources.error),
    event: Handlebars.compile(templateSources.event)
  }
  // Initialize Cloud Firestore through Firebase
  var db = firebase.firestore();
  db.settings({
    timestampsInSnapshots: true
  });
  // Initialize Firebase Storage
  var storage = firebase.storage();
  var storageRef = storage.ref();
  var eventsImagesRef = storageRef.child('images/events');
  var $eventList = $('#event-list');
  var uploadProgress = new window.mdc.linearProgress.MDCLinearProgress(document.getElementById('image-upload-progress'));
  var deleteDialog = new window.mdc.dialog.MDCDialog(document.getElementById('delete-dialog'));
  var updateDialog = new window.mdc.dialog.MDCDialog(document.getElementById('update-dialog'));
  deleteDialog.listen('MDCDialog:closing', function (event) {
    if (event.detail.action === "yes") {
      if (activeDocId) {
        eventsImagesRef.child(activeDocId).delete().then(function () {
          return db.collection('events').doc(activeDocId).delete()
        }, function (err) {
          if (err.code === 'storage/object-not-found') {
            return db.collection('events').doc(activeDocId).delete()
          } else {
            throw err;
          }
        })
          .then(function () {
            fetchData();
          })
          .catch(function (err) {
            console.warn(err);
            alert('Faile to delete event because ' + err.message);
          })
      }
    }
  })
  updateDialog.listen('MDCDialog:closing', function (event) {
    if (event.detail.action === "close") {
      resetForm();
    }
  })
  var imageFileUpload = document.querySelector('#eventImagePreview .image-file-upload');
  var imagePreview = document.getElementById('eventImagePreview');
  var imagePreviewRipple = new window.mdc.ripple.MDCRipple(document.getElementById('eventImagePreview'));
  var dataMap = [
    ['#eventName', 'name'],
    ['#eventDescription', 'description'],
    ['#eventVenue', 'venue'],
    ['#eventPhotosURL', 'photosURL', null, true],
    ['#eventVideoURL', 'youtubeURL', null, true],
    ['#eventMeetupURL', 'meetupURL', null, true],
    ['#eventDate', 'date', 'valueAsDate'],
    ['#eventTime', 'time', 'valueAsDate']
  ]
  var fetchedData = [];
  var activeDocId = null;
  var mode = "add";
  function validateForm() {
    var optionalFields = dataMap.map(function (datumMap) { return datumMap[3]; });
    var inputFields = dataMap
      .filter(function (datumMap) { return !datumMap[3]; })
      .map(function (datumMap) { return datumMap[0]; });
    var valueAttributes = dataMap.map(function (datumMap) { return datumMap[2]; });
    var valid = true;
    inputFields.forEach(function (inputField, index) {
      if (!valueAttributes[index]) {
        if (!$(inputField).val() || !$(inputField).val().trim()) valid = false;
      } else {
        if (!$(inputField)[0][valueAttributes[index]]) valid = false;
      }
    })
    // if (!(imageFileUpload.files && imageFileUpload.files[0])) valid = false;
    return valid;
  }
  function resetForm() {
    var inputFields = dataMap.map(function (datumMap) { return datumMap[0]; });
    var valueAttributes = dataMap.map(function (datumMap) { return datumMap[2]; });
    var valid = true;
    inputFields.forEach(function (inputField, index) {
      if (!valueAttributes[index]) {
        $(inputField).val(null);
      } else {
        $(inputField)[0][valueAttributes[index]] = null;
      }
    })
    imageFileUpload.files = null;
    imagePreview.style.backgroundImage = 'url()';
  }
  function fillForm(docId) {
    var data = fetchedData.find(function (datum) { return datum.id === docId });
    if (!data) return
    dataMap.forEach(function (datumMap) {
      var selector = datumMap[0];
      var key = datumMap[1];
      var valueAttribue = datumMap[2];
      if (data[key]) {
        if (valueAttribue) {
          $(selector)[0][valueAttribue] = data[key] && data[key].seconds ? new Date(data[key].seconds * 1000) : data[key];
        } else {
          $(selector).val(data[key]);
        }
      }
    })
    eventsImagesRef.child(docId).getDownloadURL().then(function (url) {
      imagePreview.style.backgroundImage = 'url(' + url + ')';
    }).catch(function (err) {
      if (err !== 'storage/object-not-found') {
        console.warn(err);
      }
    });
    initFloatingLabels();
    initLineRipples();
    initTextFields();
    initTextFieldIcons();
  }
  function uploadImage(eventId, imageFile) {
    $('.image-upload-progress-wrapper').addClass('active');
    uploadProgress.determinate = true;
    var imageRef = eventsImagesRef.child(eventId)
    var uploadTask = imageRef.put(imageFile, { eventId: eventId })
    uploadTask.on('state_changed', function (snapshot) {
      var progress = (snapshot.bytesTransferred / snapshot.totalBytes).toFixed(1);
      uploadProgress.progress = progress;
      $('.image-upload-progress-wrapper').find('.image-upload-progress-text').text(
        (progress * 100) + '%'
      )
    })
    return uploadTask
  }
  function finish() {
    $('.image-upload-progress-wrapper').removeClass('active');
    updateDialog.close();
    fetchData();
    disableLoadingMode();
  }
  function addEvent() {
    var data = {};
    dataMap.forEach(function (datumMap) {
      var selector = datumMap[0];
      var key = datumMap[1];
      var valueAttribue = datumMap[2];
      if (valueAttribue) {
        data[key] = $(selector)[0][valueAttribue];
      } else {
        data[key] = $(selector).val();
      }
    })
    enableLoadingMode();
    db.collection('events').add(data).then(function (docRef) {
      var eventId = docRef.id;
      if (imageFileUpload.files && imageFileUpload.files[0]) {
        return uploadImage(eventId, imageFileUpload.files[0]).then(function () {
          finish();
        });
      } else {
        finish();
      }
    }).catch(function (err) {
      console.warn(err);
      alert('Failed to add event because ' + err.message);
      disableLoadingMode();
    })
  }
  function updateEvent() {
    if (activeDocId) {
      var data = {};
      dataMap.forEach(function (datumMap) {
        var selector = datumMap[0];
        var key = datumMap[1];
        var valueAttribue = datumMap[2];
        if (valueAttribue) {
          data[key] = $(selector)[0][valueAttribue];
        } else {
          data[key] = $(selector).val();
        }
      })
      enableLoadingMode();
      db.collection('events').doc(activeDocId).set(data).then(function () {
        var eventId = activeDocId
        if (imageFileUpload.files && imageFileUpload.files[0]) {
          return uploadImage(eventId, imageFileUpload.files[0]).then(function () {
            finish();
          });
        } else {
          finish();
        }
      }).catch(function (err) {
        console.warn(err);
        alert('Failed to edit event because ' + err.message);
        disableLoadingMode();
      })
    }
  }
  function fetchData() {
    $eventList.empty();
    $eventList.html(template.spinner());
    db.collection('events').get().then((function (querySnapshot) {
      if (querySnapshot.size === 0) {
        if (querySnapshot.metadata.fromCache = true) {
          $eventList.html(template.error({
            error: 'You\'re currently offline, please go online and retry.'
          }))
        } else {
          $eventList.html(template.error({
            error: 'There are no existing events. Create one with the button by the corner.'
          }))
        }
        return
      }
      var data = querySnapshot.docs.map(function (doc) {
        return Object.assign({}, { id: doc.id }, doc.data());
      })
      return Promise.all(data.map(function (datum) {
        return new Promise(function (resolve, reject) {
          eventsImagesRef.child(datum.id).getDownloadURL()
            .then(function (url) {
              resolve(Object.assign({}, { imageURL: url }, datum));
            })
            .catch(function (err) {
              if (err.code === 'storage/object-not-found') {
                console.warn('No image found for event ' + datum.id);
                resolve(Object.assign({}, { imageURL: '' }, datum));
              } else {
                console.warn(err);
                reject(err);
              }
            });
        });
      })).then(function (data) {
        fetchedData = data;
        data = data.map(function (datum) {
          return Object.assign({}, datum, {
            date: datum.date ? new Date(datum.date.seconds * 1000).toLocaleDateString() : '',
            time: datum.time ? new Date(datum.time.seconds * 1000).toLocaleTimeString() : ''
          })
        })
        data = data.map(function (datum) {
          if (datum.description.length > 60) {
            return Object.assign({}, datum, {
              description: datum.description.substr(0, 60) + '...'
            })
          } else {
            return datum
          }
        })
        var html = template.event({ events: data });
        $eventList.html(html);
        initCards();
        initFloatingLabels();
        initLineRipples();
        initTextFields();
        initTextFieldIcons();
        initFABs();
        $eventList.find('.delete-button').on('click', function () {
          activeDocId = $(this).data('event-id');
          deleteDialog.open();
        })
        $eventList.find('.edit-button').on('click', function () {
          activeDocId = $(this).data('event-id');
          mode = "edit";
          $('.dialog-mode').text('Edit');
          fillForm(activeDocId);
          updateDialog.open();
        })
        $eventList.find('.mdc-menu').each(function () {
          var menu = new window.mdc.menu.MDCMenu(this);
          var eventId = $(this).data('event-id');
          var $menuBtn = $eventList.find('.menu-button[data-event-id="' + eventId + '"]')
          $menuBtn.on('click', function () {
            menu.open = true;
          })
        })
      });
    })).catch(function (err) {
      console.warn(err);
      $eventList.html(template.error({
        error: 'Failed to fetch events, please check your internet connection'
      }))
    })
  }
  $eventList.empty();
  $eventList.html(template.spinner());
  window.__DSCAuthPromise.then(function () {
    fetchData();
    $('#updateButton').on('click', function (event) {
      if (this.disabled) return;
      if (!validateForm()) return;
      event.preventDefault();
      if (mode === "add") {
        addEvent();
      } else {
        updateEvent();
      }
    })
    $('#addButton').on('click', function () {
      mode = "add";
      activeDocId = null;
      $('.dialog-mode').text('Add');
      updateDialog.open();
    })
    $(imageFileUpload).on('click', function (event) {
      event.stopPropagation();
    })
    $(imageFileUpload).on('change', function () {
      if (imageFileUpload.files && imageFileUpload.files[0]) {
        var reader = new FileReader();
        reader.onload = function (event) {
          var dataURI = event.target.result;
          imagePreview.style.backgroundImage = 'url(' + dataURI + ')';
        }
        reader.readAsDataURL(imageFileUpload.files[0]);
      }
    })
    $(imagePreview).on('click', function (event) {
      $(imageFileUpload).click();
    })
  })
})