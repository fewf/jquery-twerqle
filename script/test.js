var twq = require('./state');
var g = twq.initState(['a', 'b'], [0, 0], 6, 3);
console.log('test:');
var currPlayer = g.getCurrentPlayer();
console.log(currPlayer.tiles);

console.log(g.playableCache);
var line = currPlayer.getLongestLine(g);
for (var i = 0; i < line.length; i++) {
	if (g.tilePlace(line[i], 91, 91 + i)) {
	    console.log(i + ' th: ' + g.turnHistory);
	} else {
		console.log(line[i] + ',' + 91 + ',' + (91 + i) + 'fail');
	}
};
console.log(g.board.grid[91][91]);
console.log(g.board.grid[91][92]);
console.log(g.board.grid[91][93]);