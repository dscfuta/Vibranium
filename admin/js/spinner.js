(function ($) {
  var spinner = $('<span></span>').addClass('small-spinner');
  function enableLoadingMode() {
    $('#updateButton').siblings('.mdc-button').attr('disabled', '');
    $('#updateButton').attr('disabled', '');
    $('#updateButton .mdc-button__label .dialog-mode').hide();
    $('#updateButton .mdc-button__label').append(spinner);
  }
  function disableLoadingMode() {
    $('#updateButton .mdc-button__label').remove(spinner);
    $('#updateButton .mdc-button__label .dialog-mode').show();
    $('#updateButton').removeAttr('disabled');
    $('#updateButton').siblings('.mdc-button').removeAttr('disabled');
  }
  window.enableLoadingMode = enableLoadingMode;
  window.disableLoadingMode = disableLoadingMode;
})(jQuery);