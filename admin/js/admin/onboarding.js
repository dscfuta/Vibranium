$(function() {
  // Initialize Cloud Firestore through Firebase
  var db = firebase.firestore();
  db.settings({
    timestampsInSnapshots: true
  });
  const categories = ["beginner", "intermediate"];
  const stacks = [
    {
      title: "Frontend Web",
      description: "Members of the frontend web stack",
      key: "web-frontend"
    },
    {
      title: "Backend PHP Web",
      description: "Members of the backend PHP stack",
      key: "web-backend-php"
    },
    {
      title: "Backend NodeJS Web",
      description: "Members of the backend NodeJS stack",
      key: "web-backend-node"
    },
    {
      title: "IOT",
      description: "Members of the IOT stack",
      key: "iotat"
    },
    {
      title: "ML & AI",
      description: "Members of the ML/AI stack",
      key: "mlai"
    },
    {
      title: "Android",
      description: "Members of the Android stack",
      key: "mobile"
    },
    {
      title: "User Interface/Experience",
      description: "Members of the the UI/UX stack",
      key: "uiux"
    }
  ];
  const stackMembers = {};
  stacks.forEach(stack => {
    stackMembers[stack.key] = {
      key: stack.key,
      novice: null,
      beginner: null,
      intermediate: null
    };
  });
  var templateSources = {
    spinner: document.getElementById("spinner-template").innerHTML,
    error: document.getElementById("error-message-template").innerHTML,
    stacks: document.getElementById("stacks-template").innerHTML,
    memberList: document.getElementById("member-list-template").innerHTML,
    memberDetails: document.getElementById("member-details-template").innerHTML
  };
  var template = {
    spinner: Handlebars.compile(templateSources.spinner),
    error: Handlebars.compile(templateSources.error),
    stacks: Handlebars.compile(templateSources.stacks),
    memberList: Handlebars.compile(templateSources.memberList),
    memberDetails: Handlebars.compile(templateSources.memberDetails)
  };
  var activeItem = {
    stack: null,
    category: null
  };
  var allMembers = null;
  let subscriptions = {
    allMembers: {
      unsubscribe: null
    }
  };
  stacks.forEach(stack => {
    subscriptions[stack.key] = {
      novice: { unsubscribe: null },
      beginner: { unsubscribe: null },
      intermediate: { unsubscribe: null }
    };
  });
  const deleteConfirmDialog = new window.mdc.dialog.MDCDialog(
    document.getElementById("delete-confirm-dialog")
  );
  const infoDialog = new window.mdc.dialog.MDCDialog(
    document.getElementById("info-dialog")
  );
  const loadingDialog = new window.mdc.dialog.MDCDialog(
    document.getElementById("loading-dialog")
  );
  // The loading dialog shouldn't be user dismissable
  // NOTE: always ensure to dismiss this programmatically
  loadingDialog.scrimClickAction = "";
  loadingDialog.escapeKeyAction = "";
  const deleteConfirmCallbacks = {
    closing: null
  };
  deleteConfirmDialog.listen("MDCDialog:closing", function(event) {
    if (deleteConfirmCallbacks.closing) {
      deleteConfirmCallbacks.closing(event);
    }
  });

  function showSuccessDialog(message) {
    $("#info-dialog-title").text("Success!");
    $("#info-dialog-content").text(message);
    infoDialog.open();
  }

  function showErrorDialog(message) {
    $("#info-dialog-title").text("An error occured!");
    $("#info-dialog-content").text(message);
    infoDialog.open();
  }

  function showLoadingDialog() {
    loadingDialog.open();
  }
  function hideLoadingDialog() {
    loadingDialog.close();
  }

  function showDeleteConfimDialog(callback) {
    deleteConfirmCallbacks.closing = event => {
      deleteConfirmCallbacks.closing = null;
      callback(event.detail.action);
    };
    deleteConfirmDialog.open();
  }

  window.dialogs = {
    showSuccessDialog: showSuccessDialog,
    showErrorDialog: showErrorDialog,
    showLoadingDialog,
    hideLoadingDialog
  };

  function fetchStackCounts() {
    var isCategory = category => member => member.category === category;
    const sum = (acc, val) => acc + val;
    return Promise.all(
      stacks.map(
        stack =>
          new Promise((resolve, reject) => {
            db.collection(`/counts/signups/${stack.key}`)
              .doc("counts")
              .get()
              .then(doc => {
                if (!doc.exists) {
                  resolve({
                    key: stack.key,
                    noviceCount: 0,
                    beginnerCount: 0,
                    intermediateCount: 0,
                    totalCount: 0
                  });
                } else {
                  const data = doc.data();
                  const totalCount = Object.values(data).reduce(sum, 0);
                  resolve({
                    key: stack.key,
                    totalCount: totalCount,
                    ...data
                  });
                }
              }, reject);
          })
      )
    );
    // return fetchMembers().then(members => {
    //   var counts = stacks.map(stack => {
    //     var stackMembers = members.filter(member => member.stack === stack.key);
    //     return {
    //       key: stack.key,
    //       intermediateCount: stackMembers.filter(isCategory("intermediate"))
    //         .length,
    //       beginnerCount: stackMembers.filter(isCategory("beginner")).length,
    //       noviceCount: stackMembers.filter(isCategory("novice")).length,
    //       totalCount: stackMembers.length
    //     };
    //   });
    //   return counts;
    // });
    // var promises = [];
    // stacks.forEach(function(stack) {
    //   categories.forEach(function(category) {
    //     promises.push(
    //       db
    //         .collection("emails/" + stack.key + "/" + category)
    //         .get()
    //         .then(function(querySnapshot) {
    //           return {
    //             stack: stack,
    //             category: category,
    //             count: querySnapshot.size
    //           };
    //         })
    //     );
    //   });
    // });
    // return Promise.all(promises).then(function(results) {
    //   var counts = stacks.map(stack => ({
    //     key: stack.key,
    //     intermediateCount: 0,
    //     beginnerCount: 0,
    //     totalCount: 0
    //   }));
    //   var stacks = [];
    //   results.forEach(function(result) {
    //     count = counts.find(count => count.key === result.stack.key);
    //     if (!count) {
    //       // should never happen
    //       throw new Error("Unknown stack " + result.stack.key);
    //     }
    //     count[result.category + "Count"] = result.count;
    //   });
    //   counts = counts.map(function(count) {
    //     return Object.assign({}, count, {
    //       totalCount: count.beginnerCount + count.intermediateCount
    //     });
    //   });
    //   return counts;
    // });
  }
  function fetchMembers() {
    return new Promise((resolve, reject) => {
      if (!!allMembers) resolve(allMembers);
      else
        subscriptions.allMembers.unsubscribe = db
          .collection("signups")
          .onSnapshot(function(querySnapshot) {
            allMembers = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            resolve(allMembers);
          }, reject);
    });
  }
  function fetchMembersForStack(stack, category) {
    return new Promise((resolve, reject) => {
      if (!!stackMembers[stack][category])
        resolve(stackMembers[stack][category]);
      else
        subscriptions[stack][category] = {
          unsubscribe: db
            .collection("signups")
            .where("stack", "==", stack)
            .where("category", "==", category)
            .onSnapshot(function(querySnapshot) {
              stackMembers[stack][category] = querySnapshot.docs.map(doc => ({
                _doc: doc,
                id: doc.id,
                ...doc.data()
              }));
              resolve(stackMembers[stack][category]);
            }, reject)
        };
    });
  }
  function renderStackCards(stackCounts) {
    var stacksWithCounts = stacks.map(stack => {
      const stackCount = stackCounts.find(count => count.key === stack.key);
      if (stackCount) {
        return {
          ...stack,
          ...stackCount
        };
      } else {
        return {
          ...stack,
          noviceCount: 0,
          intermediateCount: 0,
          beginnerCount: 0,
          totalCount: 0
        };
      }
    });
    $("#stackList").html(template.stacks({ stacks: stacksWithCounts }));
    $("#stackList")
      .find('[data-action="view-category"]')
      .on("click", function() {
        const stack = $(this).data("stack");
        const category = $(this).data("category");
        viewCategory(stack, category);
      });
    mdcInitAll();
  }
  function switchPage(pageId) {
    $(".onboarding-page--active").removeClass("onboarding-page--active");
    $("#" + pageId).addClass("onboarding-page--active");
  }
  const capitalize = word => word.charAt(0).toUpperCase() + word.substr(1);
  function viewCategory(stackKey, category) {
    activeItem = {
      stack: stacks.find(stack => stack.key === stackKey),
      category: category
    };
    const $categoryName = $("#category-name");
    $categoryName.text(capitalize(category) + " " + activeItem.stack.title);
    const $composeBtn = $("#compose-button");
    $composeBtn.off("click");
    $composeBtn.on("click", function() {
      switchToComposeMode("all");
    });
    const $memberList = $("#categoryMemberList");
    $memberList.empty();
    $memberList.html(template.spinner());
    switchPage("category-info");
    fetchMembersForStack(stackKey, category).then(members => {
      $memberList.html(template.memberList({ members: members }));
      $memberList.find('[data-action="select-member"]').on("click", function() {
        const $activatedItem = $memberList.find(".mdc-list-item--activated");
        $activatedItem.removeClass("mdc-list-item--activated");
        // Clicking on the same element while activated deactivates it
        if ($activatedItem.is($(this))) {
          viewMemberDetails(null);
        } else {
          $(this).addClass("mdc-list-item--activated");
          const memberId = $(this).data("member-id");
          viewMemberDetails(members.find(member => member.id === memberId));
        }
      });
    });
  }
  function backToStackList() {
    viewMemberDetails(null);
    switchPage("stackList");
  }
  function viewMemberDetails(memberDetails) {
    const $memberDetails = $(".category-member-details");
    $memberDetails.empty();
    if (!!memberDetails) {
      $memberDetails.html(template.memberDetails(memberDetails));
      mdcInitAll();
      $memberDetails
        .find('[data-action="delete-member"]')
        .on("click", function() {
          const memberId = $(this).data("member-id");
          promptDeleteMember(memberId);
        });
      $memberDetails
        .find('[data-action="mark-member-as-on-whatsapp"]')
        .on("click", function() {
          const memberId = $(this).data("member-id");
          markMemberAsAddedToWhatsapp(memberId).then(function() {
            memberDetails.onWhatsappGroup = true;
            setTimeout(() => {
              viewMemberDetails(memberDetails);
            });
          });
        });
      $memberDetails.find('[data-action="email"]').on("click", function() {
        switchToComposeMode(memberDetails);
      });
    }
  }
  function markMemberAsAddedToWhatsapp(memberId) {
    showLoadingDialog();
    return db
      .collection("signups")
      .doc(memberId)
      .update({
        onWhatsappGroup: true
      })
      .then(() => {
        hideLoadingDialog();
      })
      .catch(err => {
        hideLoadingDialog();
        console.warn(err);
        showErrorDialog(err.message);
      });
  }
  function deleteMember(memberId) {
    if (!activeItem.stack || !activeItem.category)
      throw new Error(
        "Cannot delete a member if no stack/category is selected"
      );
    const batch = db.batch();
    const memberSignupRef = db.collection("signups").doc(memberId);
    batch.delete(memberSignupRef);
    if (activeItem.category !== "novice") {
      const memberEmailRef = db
        .collection("emails/" + activeItem.stack + "/" + activeItem.category)
        .doc(memberId);
      batch.delete(memberEmailRef);
    }
    return batch.commit();
  }
  function promptDeleteMember(memberId) {
    showDeleteConfimDialog(function(reason) {
      console.log(reason);
      if (reason === "yes") {
        showLoadingDialog();
        deleteMember(memberId)
          .then(() => {
            viewMemberDetails(null);
            const $memberList = $("#categoryMemberList");
            $memberList
              .find('.mdc-list-item[data-member-id="' + memberId + '"]')
              .remove();
            hideLoadingDialog();
            showSuccessDialog("Member deleted successfully");
          })
          .catch(err => {
            hideLoadingDialog();
            console.warn(err);
            showErrorDialog(err.message);
          });
      }
    });
  }
  function disableComposeMode() {
    const $emailCompose = $(".email-compose");
    if (!$emailCompose.hasClass("email-compose--active")) return;
    $emailCompose.removeClass("email-compose--active");
  }
  function switchToComposeMode(target) {
    const $emailCompose = $(".email-compose");
    if ($emailCompose.hasClass("email-compose--active")) return;
    const $mailToName = $("#mail-to-name");
    const $mailToDescription = $("#mail-to-description");
    const $mailContents = $("#email-contents");
    const $sendButton = $('[data-action="send-email"]');
    const $cancelButton = $('[data-action="cancel-email"]');
    const fullTitle =
      capitalize(activeItem.category) + " " + activeItem.stack.title;
    if (target === "all") {
      $mailToName.text(fullTitle);
      $mailToDescription.text('To all members of "' + fullTitle + '"');
    } else {
      $mailToName.text(target.name);
      $mailToDescription.text('To "' + target.email + '"');
    }
    $mailContents.val("");
    $cancelButton.off("click");
    $sendButton.off("click");
    $cancelButton.on("click", function() {
      $emailCompose.removeClass("email-compose--active");
    });
    $sendButton.on("click", function() {
      // TODO: hookup mail to api
      console.log(
        "[DSC:Email]",
        "Sending mail to " + target === "all" ? fullTitle : target.name
      );
      console.log("[DSC:Email]", $mailContents.val());
      showLoadingDialog();
      setTimeout(() => {
        hideLoadingDialog();
        showSuccessDialog("Email sent successfully!");
        $emailCompose.removeClass("email-compose--active");
      }, 3000);
    });
    $emailCompose.addClass("email-compose--active");
  }
  window.__DSCAuthPromise.then(function() {
    // TODO: Fix aggregation and update count logic
    $("#stackList")
      .empty()
      .html(template.spinner());
    fetchStackCounts().then(counts => {
      renderStackCards(counts);
    });
    $("#backButton").on("click", backToStackList);
  });
});
