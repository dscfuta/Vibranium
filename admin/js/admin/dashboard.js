(function($) {
  $(function() {
    // Initialize Cloud Firestore through Firebase
    var db = firebase.firestore();
    // Disable deprecated features
    db.settings({
      timestampsInSnapshots: true
    });
    function fetchStatistics() {
      var stats = ["events", "instructors", "projects", "materials", "signups"];
      stats.forEach(function(stat) {
        db.collection("/counts")
          .doc(stat)
          .get()
          .then(function(doc) {
            const { count } = doc.data();
            $("#" + stat + "CountDisplay").text(count);
          });
      });
    }
    window.__DSCAuthPromise.then(function() {
      fetchStatistics();
    });
  });
})(jQuery);
