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
  socket.on( 'card_added', onCardAdded );
  socket.on( 'card_deleted', onCardDeleted );

  function onBoardChanged( b ) {
    $('li#' + b._id + ' .title').html(b.title);
  }

  function onCardDeleted( b ) {
    var $count = $('li#' + b._id + ' span.count');
    $count.html( Math.max(0,parseInt($count.html())-1) );
  }

  function onCardAdded( b ) {
    var $count = $('li#' + b._id + ' span.count');
    $count.html( parseInt($count.html())+1 );
  }

});
