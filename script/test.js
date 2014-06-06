var twq = require('./state');
var clc = require('cli-color');
var _ = require('underscore');
var numTypes = 6;
var copies = 3;

var playTurn = function(state) {
	// console.log(state.gameHistory.length +1);

	var plyr = state.getCurrentPlayer();
	plyr.selectedTiles = [];
	// var timetocheck = state.turn() === 10;

	var move = state.computerPlay(state.turn() % 2);
	// var move = state.computerPlay();
	if (move[0] === 'play') {
		
		g.turnHistory = move[1];
		// console.log(g.turnHistory);

		var gameOver = state.gameOver();

		var lines = state.moveLines();

		// twerqs += lines.filter(function(x) { return x.length === numTypes; }).length;

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
// REPEAT CODE
// var reps = 500;
// var i = 0;
// var skip = false;
// var player1score = 0;
// var player2score = 0;
// var player1wins = 0;
// var player2wins = 0;
// var start = +new Date();
// while (i < reps) {
// 	var g = twq.initState(['a', 'b'], [0, 0], numTypes, 3);	

// 	while (playTurn(g)) {
// 		if (g.turn() > 80) {
// 			skip = true;
// 			break;
// 		}
// 		// g.board.printBoard();
// 		// console.log(g.players.map(function(x) { return ' ' + x.score + ' ';}).join(','));
// 		// console.log(g.players.map(function(x) { return ' ' + x.tiles.length + ' ';}).join(','));
// 	}
// 	if (!skip) {
// 		i++;

// 		player1score += g.players[0].score;
// 		player2score += g.players[1].score;
// 		if (g.players[0].score >= g.players[1].score) {
// 			player1wins++;
// 		} 
// 		if (g.players[1].score >= g.players[0].score) {
// 			player2wins++;
// 		}
// 		console.log('finished game ' + i);
// 		console.log('optimize wins ' + player1wins + ' (' + (Math.round((player1wins/i) * 100)) + '%) avg-score: ' + player1score);
// 		console.log('avoider wins ' + player2wins + ' (' + (Math.round((player2wins/i) * 100)) + '%) avg-score: ' + player2score);

// 	} else {
// 		skip = false;
// 	}
// }
// var end = +new Date();
// console.log('exec time: ' + (end - start));
// console.log('player 1 score: ' + player1score);
// console.log('player 2 score: ' + player2score);

// END REPEAT CODE


var g = twq.initState(['a', 'b'], [0, 0], numTypes, copies);	
// var plyr = g.getCurrentPlayer();
// var first_move = g.computerPlay(10);
// console.log(plyr.tiles);
// console.log(first_move);
// var moves = first_move[1];
// var grid;


var start = +new Date();

playTurn(g);
g.board.printBoard();

playTurn(g);
g.board.printBoard();

// playTurn(g);

// g.board.printBoard();
// console.log(g.players.map(function(x) { return ' ' + x.score + ' ';}).join(','));
// console.log(g.players.map(function(x) { return ' ' + x.tiles.length + ' ';}).join(','));

while (playTurn(g)) {

	g.board.printBoard();
	console.log(g.players.map(function(x) { return ' ' + x.score + ' ';}).join(','));
	console.log(g.players.map(function(x) { return ' ' + x.tiles.length + ' ';}).join(','));
}
var end = +new Date();
// g.board.printBoard();
// console.log(g.players.map(function(x) { return ' ' + x.score + ' ';}).join(','));
// console.log(g.players.map(function(x) { return ' ' + x.tiles.length + ' ';}).join(','));
console.log('exec time: ' + (end - start));
// console.log('grid calls: ' + g.board.gridCache.timesCalled);
// console.log(g.players);

// console.log('turn 42');
// var turn42 = g.board.grid(g.tilePlacements(g.gameHistory.slice(0, 42)));
// g.board.printBoard(turn42);















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