var http = require( 'http' ),
    querystring = require( 'querystring' ),
    exec = require( 'child_process' ).exec;

process.on( "uncaughtException", function( error ) {
  console.error( "Uncaught exception: " + error.message );
  console.trace();
});

var last_payload = {};

http.createServer( function( request, response ) {
  if( request.method == 'GET' ) {
    response.writeHead( 200, {'Content-Type': 'text/html'} );
    response.write( "<html><body><pre>" );
    response.write( JSON.stringify(last_payload, null, '\t') ); 
    response.write( "</pre></body></html>" );
    response.end();
  } else {
    var body = '';
    request.on( 'data', function( chunk ) {
      body += chunk.toString();
    });

    request.on( 'end', function() {
      last_payload = JSON.parse( querystring.parse( body ).payload );
      console.log( new Date(), request.method, request.url, last_payload );

      exec( "./restart_node.sh", function( error, stdout, stderr ) {
        response.writeHead( 200, {'Content-Type': 'text/plain'} );
        response.end( error ? stderr : stdout );
      });
    });
  }
}).listen( 8080 );

console.log( 'Server running at http://*:8080/' );
