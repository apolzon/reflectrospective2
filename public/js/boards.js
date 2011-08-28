$(function() {

  $('form#enter-board').submit(function(e) {
    var name = $('input#board-name').val();
    if ($.trim(name).length > 0) {
      document.location = '/boards/' + name
    }
    return false;
  });

  var socketURL =  'http://' + document.location.host + '/channel/boards'
  var socket = io.connect(socketURL);
  socket.on( 'board_changed', onBoardChanged );

  function onBoardChanged( b ) {
    $('li#' + b._id + ' .title').html(b.title);
  }

});
