function adjustTextarea(textarea) {
  $(textarea).css('height','auto');
  if ($(textarea).innerHeight() < textarea.scrollHeight)
    $(textarea).css('height',textarea.scrollHeight + 14);
}

var board = null, domLoaded = false, begun=false, focusNextCreate = false;
$.getJSON( document.location.pathname+'/info', function(data) { board = data; begin(); })
$(function() { domLoaded = true; begin(); });

function begin() {
  if ( ! board || ! domLoaded || begun ) return;
  begun = true;

  for (var i=0,card; card = board.cards[i]; i++)
    onCreateCard( card );

  var socketURL =  'http://' + document.location.host + '/boardNamespace/' + board.name
  var socket = io.connect(socketURL);
  socket.on( 'move', function( coords ) {
    $('#'+coords._id).css('left', coords.x );
    $('#'+coords._id).css('top', coords.y );
  });
  socket.on( 'add', onCreateCard );
  socket.on( 'text', function( data ) {
    $('#'+data._id+' textarea').val(data.text);
    adjustTextarea($('#'+data._id+' textarea')[0]);
  } );

  function createCard( data ) {
    focusNextCreate = true;
    socket.emit('add', {
      boardName:board.name,
      x: parseInt(Math.random() * 700),
      y: parseInt(Math.random() * 400)
    });
  }

  function onCreateCard( data )
  {
    var $card = $('<div class="card"><textarea style="height: auto; "></textarea></div>')
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

  $('.card').live('mousedown', function(e) {
    var deltaX = e.clientX-this.offsetLeft, deltaY = e.clientY-this.offsetTop;
    var dragged = this.id, hasMoved = false;

    function location() {
      var card = $('#'+dragged)[0];
      return {_id:dragged, x:card.offsetLeft, y:card.offsetTop};
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
    socket.emit('text', { _id:card.id, text:$(this).val() });
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
}
