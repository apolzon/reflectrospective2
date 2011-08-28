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
  socket.on( 'user_activity', userActivity );

  function onBoardChanged( b ) {
    $('li#' + b._id + ' .title').html(b.title);
  }

  function onCardDeleted( board, user_id ) {
    var $count = $('li#' + board._id + ' span.count');
    $count.html( Math.max(0,parseInt($count.html())-1) );
    userActivity( board, user_id, "Deleted a card" );
  }

  function onCardAdded( board, user_id ) {
    var $count = $('li#' + board._id + ' span.count');
    $count.html( parseInt($count.html())+1 );
    userActivity( board, user_id, "Added a card" );
  }

  function userActivity( board, user_id, activity ) {
    var $activity = $('<img title="' + activity + '" src="/user/avatar/' + encodeURIComponent(user_id) + '"/>');
    $('li#' + board._id + ' .activity').prepend($activity);
    setTimeout(function() {
      $activity.fadeOut(1000, function() { $(this).remove(); });
    }, 10000);
  }

});
