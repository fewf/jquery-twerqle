var twq = require('./state');
var clc = require('cli-color');
var numTypes = 6;

var g = twq.initState(['a', 'b', 'c'], [0, 0, 0], numTypes, 3);
var twerqs = 0;
var playTurn = function(state) {
	// console.log(state.gameHistory.length +1);
	var plyr = state.getCurrentPlayer();
	plyr.selectedTiles = [];
	var move = state.computerPlay(10);
	if (move[0] === 'play') {
		var moves = move[1];
		for (var i = 0; i < moves.length; i += 3) {
			plyr.selectTile(state, Number(moves[i])).placeSelectedTile(state, Number(moves[i + 1]), Number(moves[i + 2]));
		};
		var gameOver = state.gameOver();

		var lines = state.moveLines();

		twerqs += lines.filter(function(x) { return x.length === numTypes; }).length;

		plyr.endTurn(g);
		return  !gameOver;
	} else {
		var tiles = move[1];
		for (var i = 0; i < tiles.length; i++) {
			plyr.selectTile(state, tiles[i]);
		};

		plyr.endTurn(g);
		return true;
	}

}
console.log(g.players.map(function(x) { return ' ' + x.score + ' ';}).join(','));
while (playTurn(g)) {
	g.board.printBoard();
	console.log(g.players.map(function(x) { return ' ' + x.score + ' ';}).join(','));
	console.log(g.players.map(function(x) { return ' ' + x.tiles.length + ' ';}).join(','));


}
	g.board.printBoard();

	console.log(g.players.map(function(x) { return ' ' + x.score + ' ';}).join(','));
	console.log(g.players.map(function(x) { return ' ' + x.tiles.length + ' ';}).join(','));

console.log(g.players);
var numExchanges = g.gameHistory.filter(function(x) { return x[0] === 'exchange'; }).length;
console.log('exchanges: ' + numExchanges);
console.log(twerqs);

var newgrid = new Array(g.board.grid.length);

for (var i = 0; i < newgrid.length; i++) {
	newgrid[i] = new Array(g.board.grid.length);

};

g.gameHistory.map(function(turnHistory) {
	if (typeof turnHistory[0] == 'string') return;
	turnHistory.map(function(move) {
		newgrid[move[0]][move[1]] = move[2]
	});
});

// console.log(newgrid[91]);
g.board.grid = newgrid;

g.board.printBoard;