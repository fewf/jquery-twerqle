var _ = require('underscore');

exports.maxDimension = function(numTypes, copies) {
    // Returns the maximum width or height of the grid
    // given that tiles come in `num_types` colors,
    // `num_types` shapes, and there are `copies` copies
    // of each combination.
    return (numTypes - 1)*numTypes*copies + 1;
}

function repeatElements(array, times) {
    // Return an array with each element in the input `array` repeated
    // `times` times.
    var out = [];
    for (var i = 0; i < array.length; i++) {
        for (var j = 0; j < times; j++) {
            out.push(array[i]);
        }
    }
    return out;
}

exports.initState = function(playerNames) {
    var state = {};
    state.numTypes = 6;       // 6 colors, 6 shapes
    state.copies = 3;         // 3 copies of each color+shape combo
    state.tilesPerPlayer = 6; // players hold 6 tiles at a time
    var boardSize = exports.maxDimension(state.numTypes, state.copies)*2 - 1;
    state.board = new Array(boardSize);
    for (var i = 0; i < boardSize; i++)
        state.board[i] = new Array(boardSize);
    state.center = (boardSize + 1) / 2;  // internal x, y of first placed tile

    state.bag = _.shuffle(repeatElements(_.range(0,
                                            state.numTypes*state.numTypes),
                                         3));

    var players = [];
    for (var i = 0; i < playerNames.length; i++) {
        players.push({
            name: playerNames[i],
            score: 0,
            tiles: _.take(state.bag, state.tilesPerPlayer)
        });

        // remove the tiles the player took from the "bag"
        state.bag = _.drop(state.bag, state.tilesPerPlayer);
    }
    state.players = players;
    state.turn = 0;
    return state;
}
