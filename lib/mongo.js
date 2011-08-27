var mongodb = require( 'mongodb' ),
    url = 'mongodb://localhost/development';

// error guard for properly propagating to the callback
function error_guard( handler, next ) {
  return function( error, arg ) {
    if( error ) handler( error );
    else next( arg );
  };
}

// apply the callback to the first document that matches the criteria
exports.find = function( collection, criteria, callback ) {
  mongodb.connect( url, error_guard( callback, function( db ) {
    db.collection( collection, error_guard( callback, function( collection ) {
      collection.findOne( criteria, error_guard( callback, function( document ) {
        callback( null, document );
      }));
    }));
  }));
};

// apply the callback across all documents that match the criteria
exports.all = function( collection, criteria, callback ) {
  mongodb.connect( url, error_guard( callback, function( db ) {
    db.collection( collection, error_guard( callback, function( collection ) {
      collection.find( criteria, error_guard( callback, function( cursor ) {
        cursor.each( error_guard( callback, function( document ) {
          if( document ) callback( null, document );
        }));
      }));
    }));
  }));
};

// upsert the document into the collection
exports.save = function( collection, document, callback ) {
  mongodb.connect( url, error_guard( callback, function( db ) {
    db.collection( collection, error_guard( callback, function( collection ) {
      collection.save( document, error_guard( callback, function( document ) {
        callback( null, document );
      }));
    }));
  }));
};

// update the first document that matches the criteria with the new document
exports.update = function( collection, criteria, document, callback ) {
  mongodb.connect( url, error_guard( callback, function( db ) {
    db.collection( collection, error_guard( callback, function( collection ) {
      collection.update( criteria, document, error_guard( callback, function() {
        callback( null, document );
      }));
    }));
  }));
};
