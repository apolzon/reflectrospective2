function adjustTextarea(textarea) {
  $(textarea).css('height','auto');
  if ($(textarea).innerHeight() < textarea.scrollHeight) 
    $(textarea).css('height',textarea.scrollHeight);
}

$(function() {
  var socket = io.connect('http://' + document.location.host);
  socket.on( 'move', function( coords ) {
    $('#'+coords.id).css('left', coords.x );
    $('#'+coords.id).css('top', coords.y );
  });
  socket.on( 'text', function( data ) {
    $('#'+data.id+' textarea').val(data.text);
    adjustTextarea($('#'+data.id+' textarea')[0]);
  } );

  var dragged;
  $('.card').mousedown(function(e) {
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

  $('.card textarea').keyup(function() {
    var card = $(this).closest('.card')[0];
    socket.emit('text', { id:card.id, text:$(this).val() });
    adjustTextarea(this);
  });


});
