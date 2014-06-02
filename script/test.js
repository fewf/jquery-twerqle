var twq = require('./state');
var clc = require('cli-color');
var _ = require('underscore');
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
		return !gameOver;
	} else {
		var tiles = move[1];
		for (var i = 0; i < tiles.length; i++) {
			plyr.selectTile(state, tiles[i]);
		};

		plyr.endTurn(g);
		return true;
	}
}

var plyr = g.getCurrentPlayer();
var first_move = g.computerPlay(10);
console.log(plyr.tiles);
console.log(first_move);
var moves = first_move[1];
var grid;


var start = +new Date();
for (var i = 0; i < moves.length; i += 3) {
	plyr.selectTile(g, Number(moves[i])).placeSelectedTile(g, Number(moves[i + 1]), Number(moves[i + 2]));

	g.board.printBoard();
	console.log(g.turnHistory);
	console.log(g.playable());
};
plyr.endTurn(g);
g.board.printBoard();

playTurn(g);

g.board.printBoard();
	console.log(g.players.map(function(x) { return ' ' + x.score + ' ';}).join(','));
	console.log(g.players.map(function(x) { return ' ' + x.tiles.length + ' ';}).join(','));
// var move = g.computerPlay(10);
// console.log(move);
// console.log(g.playable());
// console.log(g.playableCache);
// debugger;
while (playTurn(g)) {

	g.board.printBoard();
	console.log(g.players.map(function(x) { return ' ' + x.score + ' ';}).join(','));
	console.log(g.players.map(function(x) { return ' ' + x.tiles.length + ' ';}).join(','));
}
var end = +new Date();
debugger;
console.log('exec time: ' + (end - start));
console.log('grid time: ' + g.board.gridTime);

console.log('called - cached')
console.log(g.board.timesCalled);
console.log(g.board.timesCached);


















// console.log(g.players.map(function(x) { return ' ' + x.score + ' ';}).join(','));

// 	g.board.printBoard();

// 	console.log(g.players.map(function(x) { return ' ' + x.score + ' ';}).join(','));
// 	console.log(g.players.map(function(x) { return ' ' + x.tiles.length + ' ';}).join(','));

// console.log(g.players);
// var numExchanges = g.gameHistory.filter(function(x) { return x[0] === 'exchange'; }).length;
// console.log('exchanges: ' + numExchanges);
// console.log(twerqs);

// var newgrid = new Array(g.board.grid.length);

// for (var i = 0; i < newgrid.length; i++) {
// 	newgrid[i] = new Array(g.board.grid.length);

// };

// g.gameHistory.map(function(turnHistory) {
// 	if (typeof turnHistory[0] == 'string') return;
// 	turnHistory.map(function(move) {
// 		newgrid[move[0]][move[1]] = move[2]
// 	});
// });

// // console.log(newgrid[91]);
// g.board.grid = newgrid;

// for (var i = 0; i < g.gameHistory.length; i++) {
// 	if (g.gameHistory[i][0] != 'exchange') {
// 		for (var j = 0; j < g.gameHistory[i].length; j++) {
// 			g.gameHistory[i][j][0] = g.gameHistory[i][j][0] - g.board.center;
// 			g.gameHistory[i][j][1] = g.gameHistory[i][j][1] - g.board.center;
// 		};
// 	}
// };


// console.log(g.gameHistory);
// var rows = _.flatten(g.gameHistory.map(function(x) {
//             if ( x[0] != 'exchange') {
//                 return x.map(function(y) {
//                     return y[0]
//                 });
//             } else {
//             	return 0;
//             }
//         }));
// var cols = _.flatten(g.gameHistory.map(function(x) {
//             if ( x[0] != 'exchange') {
//                 return x.map(function(y) {
//                     return y[1]
//                 });
//             } else {
//             	return 0;
//             }
//         }));

// var highRow = Math.max.apply(null, rows) + 1;
// var lowRow = Math.min.apply(null, rows) - 1;
// var highCol = Math.max.apply(null, cols) + 1;
// var lowCol = Math.min.apply(null, cols) - 1;

// console.log(highRow);
// console.log(lowRow);
// console.log(highCol);
// console.log(lowCol);

// var rowCount = highRow - lowRow;
// var rowOffset = lowRow * -1;
// var colCount = highCol - lowCol;
// var colOffset = lowCol * -1;

// var newgrid = new Array(rowCount);

// for (var i = 0; i < newgrid.length; i++) {
// 	newgrid[i] = new Array(colCount);
// };

// g.gameHistory.map(function(turnHistory) {
// 	if (turnHistory[0] == 'exchange') return;
// 	turnHistory.map(function(move) {
// 		newgrid[move[0] + rowOffset][move[1] + colOffset] = move[2]
// 	});
// });

// var row;
// var grid = newgrid;



// // var playable = state.playable();


// console.log(g.board.printTile(g.gameHistory[0][0][2]))

// // for (var i = 0; i < newgrid.length; i++) {
// // 	console.log(g.board.printTiles(newgrid[i]));
// // };
// // console.log(newgrid);
// // g.board.printBoard;