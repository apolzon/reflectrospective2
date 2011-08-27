function adjustTextarea( $textarea ) {
  var scrollHeight = $textarea[0].scrollHeight;
  $textarea.css( 'height', 'auto' );
  if( $textarea.innerHeight() < scrollHeight ) {
    $textarea.css( 'height', scrollHeight );
  }
}

$(function() {
  var $board = $( '.board' );

  var socket = io.connect();

  socket.on( 'connect', function() {
    socket.emit( 'enter', $board.attr( 'id' ) );
  });

  socket.on( 'add', createCard );

  socket.on( 'move', function( note ) {
    $( '#' + note.id ).css( 'left', note.x ).css( 'top', note.y );
  });

  socket.on( 'type', function( note ) {
    var $textarea = $( '#' + note.id + ' textarea' );
    $textarea.val( note.text );
    adjustTextarea( $textarea );
  } );

  function createCard( data ) {
    if ( !data ) {
      data = {
        board : $board.attr( 'id' ),
        id : Math.floor( Math.random() * 1000000000 ).toString(),
        x : parseInt( Math.random() * ($board.innerWidth() - 296)),
        y : parseInt( Math.random() * ($board.innerHeight() - 300)),
        text : ''
      }
      socket.emit( 'add', data );
    }

    var $card = $('<div id="' + data.id + '" class="card"><textarea style="height: auto;">' + data.text + '</textarea></div>')
      .css( 'left', data.x ).css( 'top', data.y );
    $board.append( $card );
    $( 'textarea', $card ).focus();
  }

  var dragged;
  $( '.card' ).live( 'mousedown', function( event ) {
    var deltaX = event.clientX - this.offsetLeft, deltaY = event.clientY - this.offsetTop;
    dragged = this.id;
    if( !dragged ) return;

    function move( event ) {
      $( '#' + dragged ).css( 'top', event.clientY - deltaY ).css( 'left', event.clientX - deltaX );
      socket.emit( 'move', { board: $board.attr( 'id' ), id : dragged, x : event.clientX - deltaX, y : event.clientY - deltaY } );
    }

    $( 'body' ).mousemove( move );

    $( 'body' ).mouseup( function( event ) {
      $( 'body' ).unbind( 'mousemove', move );
      socket.emit( 'drop', { board : $board.attr( 'id' ), id : dragged, x : event.clientX - deltaX, y : event.clientY - deltaY } );
      dragged = null;
    });
  });

  var updater;
  $( '.card textarea' ).live( 'focus', function() {
    var $this = $( this );
    $this.last = $this.val();
    try { clearInterval( updater ) } catch ( e ) {};
    updater = setInterval( function() {
      var val = $this.val();
      if( val !== $this.last ) {
        socket.emit( 'type', { board : $board.attr( 'id' ), id : $this.parent().attr( 'id' ), text : val } );
        adjustTextarea( $this );
        $this.last = val;
      }
    }, 100 );
  });

  $( '.card textarea' ).live( 'blur', function() {
    var $this = $( this );
    socket.emit( 'text', { board : $board.attr( 'id' ), id : $this.parent().attr( 'id' ), text : $this.val() } );
    if( updater ) clearInterval( updater );
  });

  $( 'button.create' ).click( function() {
    createCard();
  });

  // DEBUG
  window.createCard = createCard;
});
