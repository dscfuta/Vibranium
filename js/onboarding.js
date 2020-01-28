;(function($) {
  // Initialize firestore
  var db = firebase.firestore()
  // Disable deprecated features
  db.settings({
    timestampsInSnapshots: true,
  })
  var dataMap = [
    {
      selector: '#email',
      field: 'email',
    },
    {
      selector: '#name',
      field: 'name',
    },
    {
      selector: '#gender',
      field: 'gender',
    },
    {
      selector: '#phone',
      field: 'phone',
    },
    {
      selector: '#school',
      field: 'school',
    },
    {
      selector: '#dept',
      field: 'department',
    },
    {
      selector: '#stack',
      field: 'stack',
    },
    {
      selector: '#category',
      field: 'category',
    },
  ]

  /*
   * Check if someone with the same email has previously been onboarded
   */
  function userExists(data) {
    function signupRecordExists(email) {
      return db
        .collection('signups')
        .doc(email)
        .get()
        .then(function(snapshot) {
          return snapshot.exists
        })
    }
    function emailRecordExists(data) {
      if (!data) {
        throw new Error('data is a required argument')
      }
      if (!data.email || !data.stack || !data.category) {
        throw new Error('A required attribute is missing')
      }
      var email = data.email
      var stack = data.stack
      var category = data.category
      return db
        .collection('emails/' + stack + '/' + category)
        .doc(email)
        .get()
        .then(function(snapshot) {
          return snapshot.exists
        })
    }
    if (!email) {
      throw new Error('email is a required argument')
    }
    // return Promise.all([
    //   signupRecordExists(data.email),
    //   emailRecordExists(data),
    // ])
    return signupRecordExists(data.email)
  }

  /*
   * Add a user's email to the list of onboard emails
   * Data format:
   * email {string} - required, the user's email
   * stack {string} - required, the user's stack (web-frontend, mlai, etc)
   * category {string} - required, the user's category (intermediate | beginner)
   */
  function addUserEmail(data) {
    if (!data) {
      throw new Error('data is a required argument')
    }
    if (!data.email || !data.stack || !data.category) {
      throw new Error('A required attribute is missing')
    }
    var email = data.email
    var stack = data.stack
    var category = data.category
    return db
      .collection('emails/' + stack + '/' + category)
      .doc(email)
      .set({
        email: email,
      })
  }

  /*
   * Add a user's data to the onboarding dataset
   * data format:
   * see the dataMap variable
   */
  function addUserData(data) {
    if (!data) {
      throw new Error('data is a required argument')
    }

    return db
      .collection('signups')
      .doc(data.email)
      .set(data)
  }

  /*
   * Gathers data from form using a given data map
   */
  function mapToData(dataMap) {
    // Panic if we're not given an array of mappings to work with
    if (!dataMap || !Array.isArray(dataMap)) {
      throw new Error('mapToData expects an array to be given')
    }
    var data = {}
    // For each item in the array
    dataMap.forEach(function(mapping, index) {
      // Panic if either the selector or field is missing
      if (!mapping.selector) {
        throw new Error('Selector not given for mapping ' + index)
      }
      if (!mapping.field) {
        throw new Error('Field not given for mapping ' + index)
      }
      var selector = mapping.selector
      var field = mapping.field
      // Set the value of the attribute "field" on data to be equal
      // to the value of the form element specified by "selector"
      data[field] = $(selector).val()
    })
    // Voila! Return the finished product.
    return data
  }

  $(function() {
    var $spinner = $('#spinner')
    var $errorMessage = $('#errorMessage')
    var $successMessage = $('#successMessage')
    function finish() {
      $spinner.hide()
      $successMessage.show()
    }
    $('#regForm').on('submit', function(event) {
      event.preventDefault()
      var data = mapToData(dataMap)
      $spinner.show()
      userExists(data)
        .then(function (exists) {
          // If the user exists, notify them that they've already registered
          if (exists) {
            $successMessage
              .find('.message-text')
              .text(
                'You have already been onboarded. Await our response in your email.'
              )
            finish()
          } else {
            addUserData(data)
              .then(() => {
                finish()
              })
              .catch(err => {
                console.warn(err)
                $errorMessage.show()
                $spinner.hide()
              })
          }
        })
      // userExists(data)
      //   .then(function(exists) {
      //     var signupRecordExists = exists[0]
      //     var emailRecordExists = exists[1]
      //     var promises = []
      //     if (!signupRecordExists) {
      //       promises.push(addUserData(data))
      //     }
      //     if (
      //       !emailRecordExists &&
      //       (data.category === 'intermediate' || data.category === 'beginner')
      //     ) {
      //       promises.push(addUserEmail(data))
      //     }
      //     return Promise.all(promises).then(function(results) {
      //       // The user has already been onboarded
      //       // Inform them about that
      //       if (results.length === 0) {
      //         $successMessage
      //           .find('.message-text')
      //           .text(
      //             'You have already been onboarded. Await our response in your email.'
      //           )
      //       }
      //       // If not, notify them that they've been successfully
      //       // onboarded
      //       finish()
      //     })
      //   })
      //   .catch(function(error) {
      //     // Something went wrong, let the user know.
      //     console.warn(error)
      //     $spinner.hide()
      //     $errorMessage.show()
      //   })
    })
  })
})(jQuery)
