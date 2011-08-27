var http = require('http'),
    nko = require('nko')('XeXQ4S+ArH4oslLH');

var app = http.createServer( function( request, response ) {
  response.writeHead(200, { 'Content-Type': 'text/html' }); 
  response.end( 'Hello World' ); 
});
app.listen( parseInt(process.env.PORT) || 7777 ); 

console.log( 'Listening on ' + app.address().port );
