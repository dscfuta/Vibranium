$(function () {
  var templateSources = {
    spinner: document.getElementById('spinner-template').innerHTML,
    error: document.getElementById('error-message-template').innerHTML,
    project: document.getElementById('project-template').innerHTML
  }
  var templates = {
    spinner: Handlebars.compile(templateSources.spinner),
    error: Handlebars.compile(templateSources.error),
    project: Handlebars.compile(templateSources.project)
  }
  // Initialize Cloud Firestore through Firebase
  var db = firebase.firestore();
  db.settings({
    timestampsInSnapshots: true
  });
  // Initialize Firebase Storage
  var storage = firebase.storage();
  var storageRef = storage.ref();
  var eventImagesRef = storageRef.child('images/events');
  var $projectList = $('#project-list');
  var uploadProgress = new window.mdc.linearProgress.MDCLinearProgress(document.getElementById('image-upload-progress'));
  var deleteDialog = new window.mdc.dialog.MDCDialog(document.getElementById('delete-dialog'));
  var updateDialog = new window.mdc.dialog.MDCDialog(document.getElementById('update-dialog'));
  deleteDialog.listen('MDCDialog:closing', function (event) {
    if (event.detail.action === "yes") {
      if (activeDocId) {
        eventImagesRef.child(activeDocId).delete().then(function () {
          return db.collection('projects').doc(activeDocId).delete()
        }, function (err) {
          if (err.code === 'storage/object-not-found') {
            return db.collection('projects').doc(activeDocId).delete()
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
      disableLoadingMode();
    }
  })
  var imageFileUpload = document.querySelector('#imagePreview .image-file-upload');
  var imagePreview = document.getElementById('imagePreview');
  var imagePreviewRipple = new window.mdc.ripple.MDCRipple(document.getElementById('imagePreview'));
  var dataMap = [
    ['#projectName', 'name'],
    ['#projectDescription', 'description'],
    ['#projectStack', 'stack'],
    ['#projectLink', 'link'],
    ['#projectRepo', 'repo'],
  ]
  var fetchedData = [];
  var activeDocId = null;
  var mode = "add";
  function validateForm() {
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
    var $activeStack = $('#projectStackSelect').find('.mdc-list-item.mdc-list-item--selected');
    $activeStack.removeClass('mdc-list-item--selected')
    var $selectedStack = $('#projectStackSelect').find('mdc-select__selected-text')
    $selectedStack.text('Project Stack*');
    $('#projectStackSelect').find('input').val(null);
  }
  function fillForm(docId) {
    var data = fetchedData.find(function (datum) { return datum.id === docId });
    if (!data) {
      console.warn('No data found for', docId);
      return;
    }
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
    eventImagesRef.child(docId).getDownloadURL().then(function (url) {
      imagePreview.style.backgroundImage = 'url(' + url + ')';
    }).catch(function (err) {
      if (err !== 'storage/object-not-found') {
        console.warn(err);
      }
    });
    if (data.stack) {
      var $activeStack = $('#projectStackSelect').find('.mdc-list-item[data-value=' + data.stack + ']')
      $activeStack.addClass('mdc-list-item--selected')
      console.log($activeStack);
      var $selectedStack = $('#projectStackSelect').find('mdc-select__selected-text')
      $selectedStack.text($activeStack.text());
      $('#projectStackSelect').find('input').val(data.stack);
    }
    initFloatingLabels();
    initLineRipples();
    initTextFields();
    initTextFieldIcons();
    // initSelects();
    // initSelectIcons();
  }
  function uploadImage(eventId, imageFile) {
    $('.image-upload-progress-wrapper').addClass('active');
    uploadProgress.determinate = true;
    var imageRef = eventImagesRef.child(eventId)
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
  function addProject() {
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
    db.collection('projects').add(data).then(function (docRef) {
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
  function updateProject() {
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
      db.collection('projects').doc(activeDocId).set(data).then(function () {
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
        alert('Failed to edit event because ' + message);
        disableLoadingMode();
      })
    }
  }
  function fetchData() {
    $projectList.empty();
    $projectList.html(templates.spinner());
    db.collection('projects').get().then((function (querySnapshot) {
      if (querySnapshot.size === 0) {
        if (querySnapshot.metadata.fromCache = true) {
          $projectList.html(templates.error({
            error: 'You\'re currently offline, please go online and retry.'
          }))
        } else {
          $projectList.html(templates.error({
            error: 'There are no existing projects. Create one with the button by the corner.'
          }))
        }
        return
      }
      var data = querySnapshot.docs.map(function (doc) {
        return Object.assign({}, { id: doc.id }, doc.data());
      })
      return Promise.all(data.map(function (datum) {
        return new Promise(function (resolve, reject) {
          eventImagesRef.child(datum.id).getDownloadURL()
            .then(function (url) {
              resolve(Object.assign({}, { imageURL: url }, datum));
            })
            .catch(function (err) {
              if (err.code === 'storage/object-not-found') {
                console.warn('No image found for project ' + datum.id);
                resolve(Object.assign({}, { imageURL: '' }, datum));
              } else {
                console.warn(err);
                reject(err);
              }
            });
        });
      })).then(function (data) {
        fetchedData = data;
        var html = templates.project({ projects: data });
        $projectList.html(html);
        initCards();
        initFloatingLabels();
        initLineRipples();
        initTextFields();
        initTextFieldIcons();
        initFABs();
        $projectList.find('.delete-button').on('click', function () {
          activeDocId = $(this).data('id');
          deleteDialog.open();
        })
        $projectList.find('.edit-button').on('click', function () {
          activeDocId = $(this).data('id');
          mode = "edit";
          $('.dialog-mode').text('Edit');
          fillForm(activeDocId);
          updateDialog.open();
        })
        // $projectList.find('.mdc-menu').each(function () {
        //   var menu = new window.mdc.menu.MDCMenu(this);
        //   var eventId = $(this).data('event-id');
        //   var $menuBtn = $projectList.find('.menu-button[data-event-id="' + eventId + '"]')
        //   $menuBtn.on('click', function () {
        //     menu.open = true;
        //   })
        // })
      });
    })).catch(function (err) {
      console.warn(err);
      $projectList.html(templates.error({
        error: 'Failed to fetch projects, please check your internet connection'
      }))
    })
  }
  $projectList.empty();
  $projectList.html(templates.spinner());
  window.__DSCAuthPromise.then(function () {
    fetchData();
    $('#updateButton').on('click', function (event) {
      if (this.disabled) return;
      event.preventDefault();
      if (!validateForm()) return;
      if (mode === "add") {
        addProject();
      } else {
        updateProject();
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