var twq = require('./state');
var g = twq.initState(['a', 'b'], [0, 0], 6, 3);
console.log('test:');
var currPlayer = g.getCurrentPlayer();
console.log(currPlayer.tiles);
console.log(g.bag.length);
currPlayer.exchangeTiles(g, [currPlayer.tiles[0], currPlayer.tiles[1]]);
console.log(currPlayer.tiles);
