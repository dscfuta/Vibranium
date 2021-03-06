window.mdc.autoInit();
function initCards() {
  var selector = ".mdc-button, .mdc-card__primary-action";
  var ripples = [].map.call(document.querySelectorAll(selector), function(el) {
    return new window.mdc.ripple.MDCRipple(el);
  });
  var unboundedSelector = ".mdc-icon-button";
  var unboundedRipples = [].map.call(
    document.querySelectorAll(unboundedSelector),
    function(el) {
      const ripple = new window.mdc.ripple.MDCRipple(el);
      ripple.unbounded = true;
      return ripple;
    }
  );
  return ripples.concat(unboundedRipples);
}
function initFloatingLabels() {
  var selector = ".mdc-floating-label";
  var labels = [].map.call(document.querySelectorAll(selector), function(el) {
    return new window.mdc.floatingLabel.MDCFloatingLabel(el);
  });
  return labels;
}
function initLineRipples() {
  var selector = ".mdc-line-ripple";
  var lineRipples = [].map.call(document.querySelectorAll(selector), function(
    el
  ) {
    return new window.mdc.ripple.MDCRipple(el);
  });
  return lineRipples;
}
function initTextFields() {
  var selector = ".mdc-text-field";
  var textFields = [].map.call(document.querySelectorAll(selector), function(
    el
  ) {
    return new window.mdc.textField.MDCTextField(el);
  });
  return textFields;
}
function initFABs() {
  var selector = ".mdc-fab";
  var fabs = [].map.call(document.querySelectorAll(selector), function(el) {
    return new window.mdc.ripple.MDCRipple(el);
  });
  return fabs;
}
function initTextFieldIcons() {
  var selector = ".mdc-text-field-icon";
  var icons = [].map.call(document.querySelectorAll(selector), function(el) {
    return new window.mdc.textFieldIcon.MDCTextFieldIcon(el);
  });
  return icons;
}
function initSelects() {
  var selector = ".mdc-select";
  var selects = [].map.call(document.querySelectorAll(selector), function(el) {
    var select = new window.mdc.select.MDCSelect(el);
    if (el.classList.contains("mdc-select--required")) {
      select.required = true;
    }
    return select;
  });
  return selects;
}
function initSelectIcons() {
  var selector = ".mdc-select__icon";
  var icons = [].map.call(document.querySelectorAll(selector), function(el) {
    return new window.mdc.select.MDCSelectIcon(el);
  });
  return icons;
}
function initLists() {
  var selector = ".mdc-list:not([data-mdc-auto-init])";
  var lists = [].map.call(document.querySelectorAll(selector), function(el) {
    return new window.mdc.list.MDCList(el);
  });
  const listsItemRipples = lists
    .filter(function(list) {
      return !list.root_.dataset.noRipple;
    })
    .map(function(list) {
      return list.listElements.map(function(listItemEl) {
        return new window.mdc.ripple.MDCRipple(listItemEl);
      });
    });
  return {
    lists: lists,
    ripples: listsItemRipples
  };
}

function mdcInitAll() {
  initCards();
  initFloatingLabels();
  initLineRipples();
  initTextFields();
  initTextFieldIcons();
  initFABs();
  initSelects();
  initSelectIcons();
  initLists();
}

mdcInitAll();
