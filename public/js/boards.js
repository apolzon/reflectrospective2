$(function() {
  $('form#enter-board').submit(function(e) {
    var name = $('input#board-name').val();
    if ($.trim(name).length > 0) {
      document.location = '/boards/' + name
    }
    return false;
  });
});
