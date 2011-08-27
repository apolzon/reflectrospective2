var mongo = require('mongodb'),
    mongoUrl = 'mongodb://localhost/carbonite';

function errorWrapper( handler ) {
  return function( error ) {
    if( error )
      return console.log( "DB ERROR", (error.message ? error.message : error) );

    if ( handler )
      handler.apply(this, Array.prototype.slice.apply( arguments, [1] ) )
  }
}

function withCollection( name, callback /* (collection) */ ) {
  mongo.connect( mongoUrl, errorWrapper( function( database ) {
    database.collection( name, errorWrapper( callback ) );
  } ) );
}

exports.saveCard = function( card, callback /* (savedCard) */ ) {
  withCollection( 'cards', function( cards ) {
    cards.save( card, callback ? {safe:true} : {}, errorWrapper(callback) );
  });
}

exports.updateCard = function( card, callback /* (count) */ ) {
  withCollection( 'cards', function( cards ) {
    cards.update( cards, callback ? {safe:true} : {}, errorWrapper(callback) );
  });
}

exports.arrayReducer = function( complete /* (array) */, array /*?*/ ) {
  array = array || [];
  return function( item ) {
    if ( item != null ) return array.push( item );
    if ( complete ) return complete( array );
  }
}

exports.findCards = function( criteria, reducer /* (card | null) */ ) {
  withCollection( 'cards', function( cards ) {
    cards.find( criteria, errorWrapper( function( cursor ) {
      cursor.each( errorWrapper( reducer ) );
    }) );
  });
}
