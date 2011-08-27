
$(function() {
  var socket = io.connect('http://' + document.location.host);
  socket.on( 'welcome', function( data ) {
    socket.emit('move', {x:234, y:94392});
  });

  $('.card').mousedown(function(e) {
    var deltaX = e.clientX-$(this).offsetLeft(), deltaY = e.clientY-$(this).offsetTop();
    function move(e) {
      $(this).css('top', e.clientY - deltaY);
      $(this).css('left', e.clientX - deltaX);
    }

    $(this).mousemove(move);

    $(this).mousemove(function() {
      $(this).unbind('mousemove', move);
    });
  });


});
