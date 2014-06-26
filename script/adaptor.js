var State = require('./state');
var Board = require('./board');
var _ = require('underscore');

var colors = ['green', 'blue', 'red', 'yellow', 'orange', 'purple'];
var shapes = [ '@', '#', '$', '%', '&', "8", "+", "=", "?", "\\", '*', "Z" ];
var numTypes = 6;
var copies = 3;

var printTile = function(state, tile, bgColor) {
    if (typeof tile != 'number') return ' ';
    if ( tile < 0 || tile > state.numTypes*state.numTypes) return ' '
    var color = state.getColor(tile);
    var shape = state.getShape(tile);
    return '<span style="color: ' + colors[color] + ';">' + shapes[shape] + '</span>';

}

var printTiles = function(state, tiles) {
    if (typeof tiles === 'undefined') var tiles = state.getCurrentPlay().turnTiles();
    // var printTile = this.printTile;
    return tiles.map(function(x) { return state.board.printTile(x); }).join(' ');
}

var printBoard = function(state, grid_pkg) {
	var ret = [];
    if (typeof grid_pkg == 'undefined') grid_pkg = state.turnGrid();
    var grid = grid_pkg.grid;
    row = '   ';
    var colNum;
    var rowNum;
    var cell;
    var coords;

    for (var i = 0; i < grid.length; i++) {
        row = '';
        rowNum = i - grid_pkg.rowOffset;
        for (var j = 0; j < grid[0].length; j++) {
            coords = new Board.Coordinates(rowNum, j - grid_pkg.colOffset);

            if ( grid[i][j] === undefined ) {
                cell = '&nbsp';
            } else if (coords.in(state.turnHistory) != -1) {
                cell = printTile(state, grid[i][j]);
            } else if (coords.in(state.lastTilePlacements()) != -1) {
                cell = printTile(state, grid[i][j]);
            } else {
                cell = printTile(state, grid[i][j]);
            }
            row += cell;
        };
        ret.push(row);
    };

    return ret;
}

var playTurn = function(state) {

    var player = state.getCurrentPlayer();
    var move = state.computerPlay();
    if (move[0] === 'play') {

        for (var i = 0; i < move[1].length; i++) {
            if(!player.selectTile(state, move[1][i].tile).placeSelectedTile(state, move[1][i].coords)) {
                throw 'Bot failed.';
            }
        };

        player.endTurn(state);
    } else {
        player.selectedTiles = move[1];
        player.endTurn(state);
    }
}

exports.startGame = function(playerNames, playerTypes, numTypes, numCopies) {
    // game defaults:
    if (typeof playerNames === 'undefined') playerNames = ['a', 'b'];
    if (typeof playerTypes === 'undefined') playerTypes = [0, 0];
    if (typeof numTypes === 'undefined') numTypes = 6;
    if (typeof numCopies === 'undefined') numCopies = 3;

    return State.initState(playerNames, playerTypes, numTypes, numCopies);
}

exports.read = function() {
    if (!this.gameDataSource) throw Error('where your models gamedatasource at?');

    return this.gameDataSource();
}

exports.playTurn = playTurn;
exports.printBoard = printBoard;
exports.printTile = printTile;