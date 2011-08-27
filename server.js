var express = require( 'express' ),
    sockets = require( 'socket.io' ),
    nko = require('nko')('XeXQ4S+ArH4oslLH'),
    board = require('./lib/board.js');

var app = express.createServer();
var io = sockets.listen(app);
io.set('log level', 1);

process.on( "uncaughtException", function( error ) {
  console.error( "Uncaught exception: " + error.message );
});

app.configure( function() {
  app.set( "views", __dirname + "/views/" );
  app.set( "view engine", "jade" );
  app.use( express.compiler( { src : __dirname + '/public', enable : [ 'less' ] } ) );
  app.use( express.bodyParser() );
  app.use(express.static(__dirname + '/public'));
  app.error( function( error, request, response ) {
    console.error( error.message );
    if ( error.stack ) console.error( error.stack.join( "\n" ) );
    response.render( "500", { status : 500, error : error } );
  });
});

app.get( "/board/:board", function(request, response) { response.render("board"); } );

app.get( "/board/:board/info", function(request, response) {
  board.findCards( {}, board.arrayReducer(function(cards) {
    response.send({ name:request.params.board, cards:cards});
  }));
});

app.listen( parseInt(process.env.PORT) || 7777 ); 

function rebroadcast( socket, events ) {
  events.forEach(function(event) {
    socket.on(event, function(data) { socket.broadcast.emit( event, data ); });
  });
}
io.sockets.on('connection', function( socket ) {
  rebroadcast(socket, ['move', 'text']);
  socket.on('add', addCard );
  socket.on('move_commit', updateCard );
  socket.on('text_commit', updateCard );
});

function addCard( card ) {
  board.saveCard( card, function( saved ) {
    io.sockets.emit('add', saved);
  });
}

function updateCard( card ) { board.updateCard(card); }
