function adjustTextarea(textarea) {
  $(textarea).css('height','auto');
  if ($(textarea).innerHeight() < textarea.scrollHeight) 
    $(textarea).css('height',textarea.scrollHeight);
}

var board = null, domLoaded = false, begun=false;
$.getJSON( document.location.pathname+'/info', function(data) { board = data; begin(); })
$(function() { domLoaded = true; begin(); });

function begin() {
  if ( ! board || ! domLoaded || begun ) return;
  begun = true;

  for (var i=0,card; card = board.cards[i]; i++)
    onCreateCard( card );

  var socket = io.connect('http://' + document.location.host);
  socket.on( 'move', function( coords ) {
    $('#'+coords.id).css('left', coords.x );
    $('#'+coords.id).css('top', coords.y );
  });
  socket.on( 'add', onCreateCard );
  socket.on( 'text', function( data ) {
    $('#'+data.id+' textarea').val(data.text);
    adjustTextarea($('#'+data.id+' textarea')[0]);
  } );

  function createCard( data ) {
    socket.emit('add', {
      x: parseInt(Math.random() * ($('.board').innerWidth() - 296)),
      y: parseInt(Math.random() * ($('.board').innerHeight() - 300))
    });
  }

  function onCreateCard( data )
  {
    var $card = $('<div class="card"><textarea style="height: auto; "></textarea></div>')
      .attr('id', data._id)
      .css('left', data.x)
      .css('top', data.y)
    $('.board').append($card);
    $('textarea', $card).focus();
  }

  var dragged;
  $('.card').live('mousedown', function(e) {
    var deltaX = e.clientX-this.offsetLeft, deltaY = e.clientY-this.offsetTop;
    dragged = this.id;

    function move(e) {
      $('#'+dragged).css('top', e.clientY - deltaY);
      $('#'+dragged).css('left', e.clientX - deltaX);
      socket.emit('move', {id:dragged, x:e.clientX - deltaX, y:e.clientY - deltaY});
    }

    $('body').mousemove(move);

    $('body').mouseup(function() {
      $('body').unbind('mousemove', move);
      dragged = null;
    });
  });

  $('.card textarea').live('keyup', function() {
    var card = $(this).closest('.card')[0];
    socket.emit('text', { id:card.id, text:$(this).val() });
    adjustTextarea(this);
    return false;
  });

  $('button.create').click(function() {
    createCard();
  });

  // DEBUG
  window.createCard = createCard;

}
