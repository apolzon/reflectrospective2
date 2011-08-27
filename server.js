var express = require( 'express' ),
    sockets = require( 'socket.io' ),
    nko = require('nko')('XeXQ4S+ArH4oslLH');

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

app.listen( parseInt(process.env.PORT) || 7777 ); 

io.sockets.on('connection', function( socket ) {
  socket.emit('welcome', { text: 'hello, please log in' });
  socket.on('move', function( coords ) {
    console.log( "COORDS", coords );
  });
});
