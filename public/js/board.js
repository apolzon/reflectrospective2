function adjustTextarea(textarea) {
  $(textarea).css('height','auto');
  if ($(textarea).innerHeight() < textarea.scrollHeight)
    $(textarea).css('height',textarea.scrollHeight + 14);
  analyzeCardContent(textarea);
}

function analyzeCardContent(textarea) {
  var content = $(textarea).val();
  var $card = $(textarea).parents('.card');
  $card.removeClass('i-wish i-like');
  var matches = $(textarea).val().match(/^i (like|wish)/i);
  if (matches) {
    $card.addClass('i-' + matches[1]);
  }
}

var board = null, domLoaded = false, begun=false, focusNextCreate = false, cardLocks = {};
$.getJSON( document.location.pathname+'/info', function(data) { board = data; begin(); })
$(function() { domLoaded = true; begin(); });

function begin() {
  if ( ! board || ! domLoaded || begun ) return;
  begun = true;

  function cleanHTML( str ) {
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g,'&amp;');
  }

  $('#header').append('<div id="user-info"><img src="' + board.avatar_url + '"/><span>' + cleanHTML( board.user_id ) + '</span></div>');

  for (var i=0,card; card = board.cards[i]; i++)
    onCreateCard( card );

  var socketURL =  'http://' + document.location.host + '/boardNamespace/' + board.name
  var socket = io.connect(socketURL);
  socket.on( 'move', onMoveCard )
  socket.on( 'add', onCreateCard );
  socket.on( 'text', onText );
  socket.on( 'joined', function( user ) { board.users[user.user_id] = user; } );
  socket.on('connect', function() { socket.emit('join', { user_id:board.user_id }); } );
  socket.on('title_changed', function(title) { $('#title').val(title); });

  // clear outdated locks
  setInterval(function() {
    var currentTime = new Date().getTime();
    for ( var cardId in cardLocks ) {
      var timeout = cardLocks[cardId].move ? 500 : 5000;
      if ( currentTime - cardLocks[cardId].updated > timeout ) {
        $('#'+cardId+' .notice').hide();
        $('#'+cardId+' textarea').removeAttr('disabled');
        delete cardLocks[cardId];
      }
    }
  }, 100 );

  function onMoveCard( coords ) {
    $('#'+coords._id).css('left', coords.x );
    $('#'+coords._id).css('top', coords.y );
    if ( ! $('#'+coords._id+' notice').is(':visible') ) {
      notice( coords._id, coords.moved_by, coords.moved_by );
      cardLocks[coords._id] = { user_id:coords.moved_by, updated:new Date().getTime(), move:true };
    }
  }

  function notice( cardId, userId, message ) {
    $('#'+cardId+' .notice').html('<img src="' + board.users[userId].avatar_url + '"/><span>' + cleanHTML( message ) + '</span>')
                            .show();
  }

  function createCard( data ) {
    focusNextCreate = true;
    socket.emit('add', {
      boardName:board.name,
      x: parseInt(Math.random() * 700),
      y: parseInt(Math.random() * 400)
    });
  }

  function onCreateCard( data ) {
    var $card = $('<div class="card"><div class="notice"></div><textarea style="height: auto; "></textarea></div>')
      .attr('id', data._id)
      .css('left', data.x)
      .css('top', data.y)
    $('textarea',$card).val(data.text);
    $('.board').append($card);
    adjustTextarea( $('textarea',$card)[0] );
    if ( focusNextCreate ) {
      $('textarea', $card).focus();
      focusNextCreate = false;
    }
  }

  function onText( data ) {
    var $ta = $('#'+data._id+' textarea');
    $ta.val(data.text).attr('disabled','disabled');;
    if ( ! cardLocks[data._id] || cardLocks[data._id].user_id != data.author )
      notice( data._id, data.author, data.author + ' is typing...' );
    $('#'+data._id+' .notice').show();
    cardLocks[data._id] = { user_id:data.author, updated:new Date().getTime() };
    adjustTextarea($ta[0]);
  };

  $('.card').live('mousedown', function(e) {
    var deltaX = e.clientX-this.offsetLeft, deltaY = e.clientY-this.offsetTop;
    var dragged = this.id, hasMoved = false;

    function location() {
      var card = $('#'+dragged)[0];
      return {_id:dragged, x:card.offsetLeft, y:card.offsetTop, moved_by:board.user_id};
    }

    function mousemove(e) {
      hasMoved = true;
      $('#'+dragged).css('top', e.clientY - deltaY);
      $('#'+dragged).css('left', e.clientX - deltaX);
      socket.emit('move', location() );
    }

    function mouseup(e) {
      $(window).unbind('mousemove', mousemove);
      $(window).unbind('mouseup', mouseup);
      socket.emit('move_commit', location() );
    }

    $(window).mousemove(mousemove);
    $(window).mouseup(mouseup);
  });

  $('.card textarea').live('keyup', function() {
    var card = $(this).closest('.card')[0];
    socket.emit('text', { _id:card.id, text:$(this).val(), author:board.user_id });
    adjustTextarea(this);
    return false;
  });

  $('.card textarea').live('change', function() {
    var card = $(this).closest('.card')[0];
    socket.emit('text_commit', { _id:card.id, text:$(this).val() });
  });

  $('button.create').click(function() {
    createCard();
  });


  function titleChanged() {
    socket.emit('title_changed', { title: $('#title').val() });
  }

  $('#title').keyup(function(e) {
    if (e.keyCode == 13) {
      $(this).blur();
    } else {
      titleChanged();
    }
  });

  $('#title').blur(titleChanged);
}
