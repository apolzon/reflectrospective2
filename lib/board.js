var mongo = require('mongodb'),
    BSON = mongo.BSONPure,
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
    card.authors = [];
    cards.save( card, callback ? {safe:true} : {}, errorWrapper(callback) );
  });
}

exports.updateCard = function( card, callback /* (count) */ ) {
  withCollection( 'cards', function( cards ) {
    cards.find( {_id:new BSON.ObjectID(card._id) }, errorWrapper( function( cursor ) {
      cursor.each( errorWrapper( function( existingCard ) {
        if ( existingCard == null ) return;
        if ( card.x ) existingCard.x = card.x;
        if ( card.y ) existingCard.y = card.y;
        if ( card.text ) existingCard.text = card.text;
        if ( card.author && (! existingCard.authors || ! existingCard.authors.indexOf(card.author)>-1) )
          (existingCard.authors=existingCard.authors||[]).push( card.author );
        cards.save( existingCard, callback ? {safe:true} : {}, errorWrapper(callback) );
      }) );
    }) );
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

exports.findBoards = function( criteria, reducer ) {
  withCollection( 'boards', function( coll ) {
    coll.find( criteria, errorWrapper( function( cursor ) {
      cursor.each( errorWrapper( reducer ) );
    }) );
  });
}

exports.findBoard = function( boardName, callback ) {
  withCollection( 'boards', function( collection ) {
    collection.find( { name: boardName }, { limit: 1 } ).toArray( function(err, objs) {
      if (objs.length === 0) {
        var b = { name: boardName, title: boardName };
        collection.insert(b);
        callback(b);
      } else {
        callback(objs[0]);
      }
    });
  });
}

exports.updateBoard = function( boardName, attrs, callback ) {
  withCollection( 'boards', function( collection ) {
    collection.update( { name: boardName }, { $set: attrs }, callback ? {safe:true} : {}, errorWrapper(callback) );
  });
}
