var express = require( 'express' ),
    sockets = require( 'socket.io' ),
    nko = require('nko')('XeXQ4S+ArH4oslLH'),
    board = require('./lib/board.js'),
    sessions = require('cookie-sessions');

var app = express.createServer();

var io = sockets.listen(app);
io.set('log level', 1);

process.on( "uncaughtException", function( error ) {
  console.error( "Uncaught exception: " + error.message );
  if (error.stack) {
    console.log('\nStacktrace:')
    console.log('====================')
    console.log(error.stack);
  }
});

app.configure( function() {
  app.set( "views", __dirname + "/views/" );
  app.set( "view engine", "jade" );
  app.use( express.compiler( { src : __dirname + '/public', enable : [ 'less' ] } ) );
  app.use( express.bodyParser() );
  app.use(express.static(__dirname + '/public'));
  app.use(sessions( {secret: 'a7c6dddb4fa9cf927fc3d9a2c052d889', session_key: 'carbonite'}) );
  app.error( function( error, request, response ) {
    console.error( error.message );
    if ( error.stack ) console.error( error.stack.join( "\n" ) );
    response.render( "500", { status : 500, error : error } );
  });
});

var boardNamespaces = {};

app.get( "/board/:board", requireAuth, function(request, response) { 
  if (!boardNamespaces[request.params.board])
    createBoardSession( request.params.board );
  response.render("board");
});

function avatarUrl(user_id) {
  var m;
  if ( m = /^@(.*)/.exec(user_id) ) {
    return "http://api.twitter.com/1/users/profile_image?size=normal&screen_name=" + encodeURIComponent(m[1]);
  }
  var md5 = require('crypto').createHash('md5');
  md5.update(user_id);
  return "http://www.gravatar.com/avatar/" + md5.digest('hex') + "?d=retro";
}

app.get( "/board/:board/info", function(request, response) {
  var boardName = request.params.board;
  board.findCards( { boardName:boardName }, board.arrayReducer(function(cards) {
    response.send({
      name:boardName,
      cards:cards,
      users:boardNamespaces[boardName] || {},
      user_id:request.session.user_id,
      avatar_url: avatarUrl(request.session.user_id),
      title: boardName,
    });
  }));
});

function requireAuth( request, response, next ) {
  if ( !request.session ) {
    request.session = {};
  }
  if ( request.session.user_id ) {
    return next();
  }
  request.session.post_auth_url = request.url;
  response.redirect("/login");
}

app.get( "/login", function(request, response) {
  response.render("login");
});

app.post( "/login", function(request, response) {
  if ( !request.session ) {
    request.session = {};
  }
  request.session.user_id = request.body.user_id;
  response.redirect(request.session.post_auth_url || '/');
  delete request.session.post_auth_url;
});

app.get( "/logout", function(request, response) {
  request.session = {};
  response.redirect("/login")
});

app.listen( parseInt(process.env.PORT) || 7777 ); 

function createBoardSession( boardName ) {
  var boardMembers = {};
  var boardNamespace = io.of("/boardNamespace/" + boardName)
      .on('connection', function( socket ) {
        rebroadcast(socket, ['move', 'text']);
        socket.on('join', function( user ) {
          user.avatar_url = avatarUrl( user.user_id );
          boardMembers[user.user_id] = user;
          boardNamespace.emit( 'joined', user );
          board.findBoard( boardName, function(b) { socket.emit('title_changed', b.title); });
        });
        socket.on('add', function(data) {
                          addCard(boardNamespace,data);
                        });
        socket.on('move_commit', updateCard );
        socket.on('text_commit', updateCard );

        socket.on('title_changed', function(data) {
          board.updateBoard(boardName, { title: data.title });
          socket.broadcast.emit('title_changed', data.title);
        });
    });
  boardNamespaces[boardName] = boardMembers;
}

function rebroadcast( socket, events ) {
  events.forEach(function(event) {
    socket.on(event, function(data) { socket.broadcast.emit( event, data ); });
  });
}

function addCard( boardNamespace, card ) {
  board.saveCard( card, function( saved ) {
    boardNamespace.emit('add', saved);
  });
}

function updateCard( card ) { board.updateCard(card); }
