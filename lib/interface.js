const systems = require('./systems.js');
const core = require('./core.js');
const twoDArray = require("2d-array");

function StandardJax(){
  this.entities = [];
  this.api = ['move', 'exchange', 'gather'];
  this.worldSize = [100,100];
}

StandardJax.prototype.tick = function(){
  this.entities = core.applySystems(this.entities, systems);
  return this.entities;
}

StandardJax.prototype.addEntity = function( uuid ){
  this.entities = core.createEntity( this.entities, uuid );
  const row = Math.floor((Math.random() * this.worldSize[0]) + 1);
  const col = Math.floor((Math.random() * this.worldSize[1]) + 1);
  var pos = core.createComponent('position', [row, col]);
  var apples = core.createComponent( 'apples', 5 );
  this.entities = core.applyComponents( this.entities, e => {return e.id === uuid}, [pos, apples] );
}

StandardJax.prototype.trigger = function( uuid, input ){
  console.log('uuid: '+uuid+', input: '+input);
  const action = _wellFormed( this.api, input.split(' ') );

  //Input has been received for one entity, but this action may require
  //another players action. events[0] is the current entities
  //component, while events[1] is the input the other player should receive.
  const events = _getComponentByAction( this.entities, action );
  this.entities = core.applyComponents( this.entities, e => {return e.id === uuid}, [events[0]] );

  return {entities: this.entities, moreInput: events[1]};
}

function _wellFormed( api, action ){
  if ( api.find( x => x === action[0] ) ){ return action }
  else{
    throw new Error('No api for the action: '+action);
  }
}

StandardJax.prototype.setComponent = function( uuid, cName, cValue ){
  //TODO: option to set component for specific entity (uuid), or class (type).
  this.entities = this.entities.map( e => {
    if ( e.id === uuid ){ e[cName] = cValue; }
    return e;
  });
}

StandardJax.prototype.getComponents = function( uuid ){
  var e = {};
  var uniqueEntity = _idToEntity( this.entities, uuid );
  for (var i = 0; i < Object.keys( uniqueEntity ).length; i++ ){
    e[ Object.keys(uniqueEntity)[i] ] = uniqueEntity[ Object.keys(uniqueEntity)[i] ];
  }
  return e;
}

function _getComponentByAction( entities, action ){
  var moreInput = null;
  var decision = null;

  if ( action[0] === 'move' ){ 
    decision = core.createComponent('direction', action[1]); 
  }

  else if ( action[0] === 'exchange' ){ //api: ['exchange', myAction, otherPlayersId] 
    decision = core.createComponent('exchange', [action[1], action[2]]); 

    var exchangeWithEnt = _idToEntity( entities, action[2] );;
    if ( !exchangeWithEnt.hasOwnProperty('exchange') ){ //TODO: validate that both players want to exchange with each other.
      moreInput = {action: 'exchange', target: exchangeWithEnt.id};
    }
  }

  else if ( action[0] === 'gather' ){
    decision = core.createComponent('gather', true); 
  }

  else{
    throw new Error( 'This action has not been implemented yet.' );
  }

  return [decision, moreInput];
}

function _idToEntity( entities, entId ){
  var ent = entities.find( e => {return e.id == entId} );
  
  if ( ent ){ return ent; } 
  else { throw new Error( "No entity with the id '"+entId+"'" ); };
}

StandardJax.prototype.getSurroundings = function( uuid ){
  var surroundings = new Array(9);
  var entity = this.entities.find( e => {return e.id === uuid} );
  surroundings[ 4 ] = entity; //player is always at the center of their surroundings.
  
  this.entities.forEach( e => {
    var dRow = entity.position[0] - e.position[0];
    var dCol = entity.position[1] - e.position[1];
    if ( Math.abs(dRow) <= 1 && Math.abs(dCol) <= 1){ 
      if (dRow === -1 && dCol === -1){ surroundings[0] = e; }
      else if (dRow === -1 && dCol === 0){ surroundings[1] = e; }
      else if (dRow === -1 && dCol === 1){ surroundings[2] = e; }
      else if (dRow === 0 && dCol === -1){ surroundings[3] = e; }
      else if (dRow === 0 && dCol === 1){ surroundings[5] = e; }
      else if (dRow === 1 && dCol === -1){ surroundings[6] = e; }
      else if (dRow === 1 && dCol === 0){ surroundings[7] = e; }
      else if (dRow === 1 && dCol === 1){ surroundings[8] = e; }
    }
  });

  return twoDArray( surroundings, 3 );
}

module.exports = new StandardJax();