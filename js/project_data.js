(function ($) {
  // Initialize Cloud Firestore through Firebase
  var db = firebase.firestore();


  // Disable deprecated features
  db.settings({
    timestampsInSnapshots: true
  });
  var $projectLists = {
    web: $('#webProjectList'),
    mobile: $('#mobileProjectList')
  }
  var templateSources = {
    spinner: document.getElementById('spinner-template').innerHTML,
    error: document.getElementById('error-message-template').innerHTML,
    web: document.getElementById('web-projects-template').innerHTML,
    mobile: document.getElementById('mobile-projects-template').innerHTML
  }
  var templates = {
    spinner: Handlebars.compile(templateSources.spinner),
    error: Handlebars.compile(templateSources.error),
    web: Handlebars.compile(templateSources.web),
    mobile: Handlebars.compile(templateSources.mobile)
  }
  var filterStrategies = {
    web: function (projects) {
      return projects.filter(function (project) {
        return project.stack === 'web'
      });
    },
    mobile: function (projects) {
      return projects.filter(function (project) {
        return project.stack === 'mobile'
      });
    }
  }
  Object.values($projectLists).forEach(function ($projectList) {
    $projectList.empty();
    $projectList.html(templates.spinner());
  })
  db.collection('projects').get().then(function (querySnapshot) {
    if (querySnapshot.size === 0) {
      if (querySnapshot.metadata.fromCache) {
        Object.values($projectLists).forEach(function ($projectList) {
          $projectList.empty();
          $projectList.html(templates.error({
            error: 'Failed to fetch projects, please check your internet connection'
          }));
        })
      }
      return;
    }
    var projects = {
      web: [],
      mobile: []
    }
    querySnapshot.forEach(function (doc) {
      var data = doc.data();
      if (projects[data.stack]) {
        projects[data.stack].push(data);
      } else {
        console.warn('Unknown project stack', data.stack);
      }
    });
    var stacks = Object.keys(projects);
    stacks.forEach(function (stack) {
      if ($projectLists[stack] && templates[stack]) {
        if (projects[stack].length > 0) {
          $projectLists[stack].empty();
          var html = templates[stack]({ projects: projects[stack] });
          $projectLists[stack].html(html);
        } else {
          $projectLists[stack].empty();
          $projectLists[stack].html(templates.error({
            error: 'We don\'t have any projects for this category, yet...'
          }));
        }
      } else {
        console.warn('Found non-renderable project stack', data.stack);
      }
    })
  }).catch(function (err) {
    console.warn(err);
    Object.values($projectLists).forEach(function ($projectList) {
      $projectList.empty();
      $projectList.html(templates.error({ 
        error: 'Failed to fetch projects, please check your internet connection'
      }));
    })
  })
})(jQuery);