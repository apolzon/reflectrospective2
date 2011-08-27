var nko = require( 'nko' )( 'XeXQ4S+ArH4oslLH' ),
    express = require( 'express' ),
    sockets = require( 'socket.io' ),
    mongo = require( './lib/mongo.js' ),
    app = express.createServer(),
    io = sockets.listen( app );

io.set('log level', 3); 

process.on( "uncaughtException", function( error ) {
  console.error( "Uncaught exception: " + error.message );
  console.trace();
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

app.get( "/boards/:board", function( request, response ) {
  mongo.find( 'boards', { name : request.params.board }, function( error, board ) {
    if( error ) {
      response.render( "500", { status : 500, error : error } );
    } else if( board ) {
      response.render( "boards/view", { board : board } );
    } else {
      response.render( "404", { status : 404 } );
    }
  });
});

app.post( "/boards/:board", function( request, response ) {
  mongo.save( 'boards', { name : request.params.board }, function( error, board ) {
    if( error ) {
      response.render( "500", { status : 500, error : error } );
    } else {
      response.render( "boards/view", { board : board } );
    }
  });
});

function rebroadcast( socket, events ) {
  events.forEach( function( event ) {
    socket.on( event, function( data ) {
      socket.broadcast.emit( event, data );
    });
  });
}

io.sockets.on( 'connection', function( socket ) {

  rebroadcast( socket, [ 'move', 'type' ] );

  socket.on( 'enter', function( board ) {
    mongo.all( 'notes', { board : board }, function( error, note ) {
      if( error ) return socket.emit( 'error', error );
      if( note ) socket.emit( 'add', note );
    });
  });

  socket.on( 'add', function( note ) {
    mongo.save( 'notes', note, function( error, board ) {
      socket.broadcast.emit( 'add', note );
    });
  });

  socket.on( 'drop', function( note ) {
    mongo.find( 'notes', { id : note.id }, function( error, item ) {
      if( item ) {
        item.x = note.x;
        item.y = note.y;
        mongo.save( 'notes', item, function( error ) {
          if( error ) return socket.emit( 'error', error );
        });
      }
    });
  });

  socket.on( 'text', function( note ) {
    mongo.find( 'notes', { id : note.id }, function( error, item ) {
      if( item ) {
        item.text = note.text;
        mongo.save( 'notes', item, function( error ) {
          if( error ) return socket.emit( 'error', error );
        });
      }
    });
  });
});

app.listen( parseInt(process.env.PORT) || 7777 ); 
