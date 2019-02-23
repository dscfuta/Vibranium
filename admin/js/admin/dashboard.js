(function ($) {
  $(function () {
    // Initialize Cloud Firestore through Firebase
    var db = firebase.firestore();
    // Disable deprecated features
    db.settings({
      timestampsInSnapshots: true
    });
    function fetchStatistics() {
      var stats = ['events', 'instructors', 'projects', 'materials'];
      stats.forEach(function (stat) {
        db.collection(stat).get().then(function (querySnapshot) {
          $('#' + stat + 'CountDisplay').text(querySnapshot.size);
        });
      });
    }
    window.__DSCAuthPromise.then(function () {
      fetchStatistics();
    });
  });
})(jQuery);