var twq = require('./state');
var g = twq.initState(['a', 'b'], [0, 0], 6, 3);
console.log('test:');
var currPlayer = g.getCurrentPlayer();
console.log(currPlayer.tiles);
currPlayer.removeTile(currPlayer.tiles[0]);
console.log(currPlayer.tiles);
