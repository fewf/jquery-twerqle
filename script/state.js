var _ = require('underscore');
var qunit = require('qunit');
var Player = require('./player');
var Board = require('./board');

exports.sum = function(nums) {
    var sum = 0;
    for (var i = nums.length - 1; i >= 0; i--) {
        sum += nums[i]
    };
    return sum;
}

exports.arrayIsSubset = function(array1, array2) {
    if (array1.length > array2.length) return false;
    for (var i = array1.length - 1; i >= 0; i--) {
        if (array2.indexOf(array1[i]) === -1) {
            return false;
        }
    };
    return true;
}

exports.equalCoords = function(coord1, coord2) {
    return coord1[0] === coord2[0] && coord1[1] === coord2[1];
}

exports.coordsIn = function(needle, haystack) {
    for (var i = haystack.length - 1; i >= 0; i--) {
        if (exports.equalCoords(needle, haystack[i])) return i;
    };
    return -1;
}

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

exports.maxTypes = 12;

exports.initState = function(playerNames, playerTypes, numTypes, numCopies) {
    var state = {};
    if (exports.maxTypes < numTypes) throw "Too Many Types";
    state.numTypes = Number(numTypes);       // 6 colors, 6 shapes
    state.copies = Number(numCopies);         // 3 copies of each color+shape combo
    state.tilesPerPlayer = Number(numTypes); // players hold 6 tiles at a time
    var boardSize = exports.maxDimension(state.numTypes, state.copies)*2 - 1;
    state.board = new Board.Board(boardSize, state);
    state.bag = _.shuffle(repeatElements(_.range(0,
                                            state.numTypes*state.numTypes),
                                         state.copies));

    var players = [];
    for (var i = 0; i < playerNames.length; i++) {
        var bag_count = state.bag.length;
        players.push(new Player.Player(playerNames[i], playerTypes[i], numTypes));
        players[i].drawTiles(state, state.tilesPerPlayer);
    }

    state.players = players;
    state.turnHistory = [];
    state.gameHistory = [];
//    state.playable = [ [state.center, state.center] ];
//    state.turnPlayable = [ [state.center, state.center] ];

    // playableCache remembers the playable state of the board at the
    // beginning of each turn
    state.playableCache = [ [state.board.center, state.board.center] ];

    state.isInitialState = function() {
        var firstTurn = Boolean(!this.gameHistory.length);
        var noHistory = Boolean(!this.turnHistory.length);
        var test = (firstTurn && noHistory);
        return test;        
    }
    state.turn = function() { return this.gameHistory.length; }

    state.playable = function() {

        if (!this.turnHistory.length) return this.playableCache;

        var row = th[0][0];
        var col = th[0][1];

        if (this.turnIsRow) {
            return this.getRowLine(row, col, true);
        } else if (this.turnIsColumn) {
            return this.getColLine(row, col, true);
        } else {
            return this.getLines(row, col, true);
        }
    }

    state.copyPlayable = function(playable) {
        var copy = new Array(playable.length);

        for (var i = playable.length - 1; i >= 0; i--) {
            copy[i] = playable[i].slice(0);
        };

        return copy;
    }

    state.getPlayableOnMove = function(row, col) {
        var ec = this.equalCoords;
        // remove just played coords from playable
        var newPlayable = this.playable.filter( function (x) {
                            return !ec(x, [row, col]);
                        });

        var playableNeighbors = this.getPlayableNeighbors(row, col);

        // loop through UNplayable neighbors
        for (var i = playableNeighbors[1].length - 1; i >= 0; i--) {
            // check if newly found UNplayable cell is currently in playable
            var index = this.coordsIn(playableNeighbors[1][i], newPlayable);
            if (index !== -1) {
                // remove newly found UNplayable cell from playable.
                newPlayable.splice(index, 1);
            }
        };

        for (var i = playableNeighbors[0].length - 1; i >= 0; i--) {
            if (this.coordsIn(playableNeighbors[0][i], newPlayable) = -1) {
                newPlayable.push(playableNeighbors[0][i]);
            }
        };

        return newPlayable;
    }

    state.getShape = function(num) {
        return num % this.numTypes;
    }

    state.getColor = function(num) {
        return Math.floor(num/this.numTypes);
    }

    state.getStartIndex = function() {
        var longestLineLengths = this.players.map(
                                    function (x) {
                                        return x.getLongestLine(state).length;
                                    });

        return longestLineLengths.indexOf(Math.max.apply(Math, longestLineLengths));        
    }

    state.getCurrentPlayer = function() {
        return this.players[(this.turn()+ this.startIndex) % this.players.length];
    }
    state.tilePlace = function(tile, row, col) {
        if ( !this.board.placeTileValidate(tile, row, col) ) throw 'tile not valid';
        this.getCurrentPlayer().removeTile(tile);
        this.board.grid[row][col] = tile;
        this.turnHistory.push([row, col, tile]);
        return true;
    }

    state.undoTilePlace = function() {
        if ( this.turnHistory.length < 1 ) return false;
        var lastPlacement = this.turnHistory.pop();
        var row = lastPlacement[0];
        var col = lastPlacement[1];
        var tile = lastPlacement[2];
        this.getCurrentPlayer().tiles.push(Number(tile));
        this.board[row][col] = undefined;
        this.turnHistory.pop();
        if (!this.turnHistory.length) this.playable = this.playableCache;
        return true;
    }

    state.scoreLine = function(line) {
        // below logic works on all but the very first play. handling in place in scoreturn for first play.
        if (line.length === 1) return 0;

        if (line.length === this.numTypes) return this.numTypes * 2;

        return line.length;
    }

    state.scoreTurn = function() {
        var outer = this;
        var th = this.turnHistory;
        var score = 0;

        if (!th.length) return score;

        // Special handling for case where first move is just one tile:
        if (this.turn()=== 0 && this.turnHistory.length === 1) return 1;

        if (th.length === 1) {
            var lines = this.getLines(th[0][0], th[0][1]);
            score += this.scoreLine(lines[0]);
            score += this.scoreLine(lines[1]);
        } else {
            if (this.board.turnIsRow()) {
                // mainline is row
                var mainLine = this.getRowLine(th[0][0], th[0][1])
                score += this.scoreLine(mainLine);
                var subscores = th.map(function (x) {
                        return outer.scoreLine(outer.getColLine(x[0], x[1]));
                    });
                score += exports.sum(subscores);
            } else {
                // mainline is col
                var mainLine = this.getColLine(th[0][0], th[0][1])
                score += this.scoreLine(mainLine);
                var subscores = th.map(function (x) {
                        return outer.scoreLine(outer.getRowLine(x[0], x[1]))
                    });
                score += exports.sum(subscores);
            }
        }

        // End of game bonus:
        if (!this.bag.length && !this.getCurrentPlayer().tiles.length) score += this.numTypes;

        return score;
    }

    state.resetTurn = function () {
        var th = this.turnHistory;
        var player = this.getCurrentPlayer();
        for (var i = th.length - 1; i >= 0; i--) {
            player.tiles.push(Number(this.board[th[i][0]][th[i][1]]));
            this.board.grid[th[i][0]][th[i][1]] = undefined;
        };
        this.turnHistory = [];
    }

    state.determineWinner = function() {
        var winningScore = -1;
        for (var i = this.players.length - 1; i >= 0; i--) {
            if (this.players[i].score > winningScore) {
                winners = [this.players[i]];
                winningScore = this.players[i].score;
            } else if (this.players[i].score === winningScore) {
                winners.push(this.players[i]);
            }
        };
        return winners;
    }

    state.endScoringTurn = function() {

        if (!this.turnHistory.length) return false;

        for (var i = 0; i < this.turnHistory.length; i++) {
            this.playableCache = this.getPlayableOnMove(this.turnHistory[i][0], this.turnHistory[i][1]);
        };

        var player = this.getCurrentPlayer();

        var turnScore = this.scoreTurn();

        player.score += turnScore;

        player.drawTiles(state, this.turnHistory.length);

        this.gameHistory.push(this.turnHistory);

        this.turnHistory = [];

        this.endTurn();
    }

    state.endExchangeTurn = function(selectedTiles) {
        this.gameHistory.push(selectedTiles);

        this.endTurn();
    }

    state.endTurn = function() {
        // pass
    }

    state.computerPlay = function(type) {
        var outer = this;
        var rack = this.getCurrentPlayer().tiles.slice(0);

        // Reduce possible lines in rack to only those which
        // are not subsets of others.
        var lines = this.getAllLinesInRack(rack);
        var linesCopy = lines.slice(0);
        var newLines = [];
        var len = lines.length;
        for (var i = len - 1; i >= 0; i--) {
            var tester = lines.pop();
            var notSubset = true;
            for (var j = lines.length - 1; j >= 0; j--) {
                if (exports.arrayIsSubset(tester, lines[j])) {
                    newLines.push(tester);
                    continue;
                }
            };
            if (notSubset) newLines.push(tester);
        };

        if (this.boardIsEmpty()) type = 10;
        var scores = {};

        function recurse_optimize_score(string, lastMove) {
            var playables = outer.turnPlayable;
            var playablesLength = outer.turnPlayable.length;
            for (var i = 0; i < outer.turnPlayable.length; i++) {
                var rack = outer.getCurrentPlayer().tiles;
                for (var j = rack.length - 1; j >= 0; j--) {
                    var tile = outer.getCurrentPlayer().tiles[j];
                    var row = Number(outer.turnPlayable[i][0]);
                    var col = Number(outer.turnPlayable[i][1]);
                    if (outer.placeTile(tile, row, col)) {
                        var newLastMove = 't' + tile + 'r' + row + 'c' + col;
                        recurse_optimize_score(string + newLastMove, newLastMove);
                    }
                };
            };
            if (string) {
                var lastMove = lastMove.split(/[trc]/);
                scores[string] = outer.scoreTurn();
                outer.rewindState(Number(lastMove[1]), Number(lastMove[2]), Number(lastMove[3]));
            }
        }

        function recurse_avoid_qwerlebait(string, lastMove) {
            var rack, tile, row, col, lines, newLastMove;
            for (var i = 0; i < outer.turnPlayable.length; i++) {
                // if (string || playableRange.indexOf(i) !== -1) {
                    var rack = outer.getCurrentPlayer().tiles;
                    for (var j = rack.length - 1; j >= 0; j--) {
                        var tile = outer.getCurrentPlayer().tiles[j];
                        var row = Number(outer.turnPlayable[i][0]);
                        var col = Number(outer.turnPlayable[i][1]);
                        if (Math.random() < type * ( 0.5 * ( 1 / outer.turnHistory.length + 1 ) )) {
                            if (outer.placeTile(tile, row, col)) {
                                var newLastMove = 't' + tile + 'r' + row + 'c' + col;
                                recurse_avoid_qwerlebait(string + newLastMove, newLastMove);
                            }
                        }
                    };
                // }
            };
            if (string) {
                var lines = [];
                var colLine, rowLine, skip;
                var lastMove = lastMove.split(/[trc]/);
                var row = Number(lastMove[2]);
                var col = Number(lastMove[3]);
                var skip = false;


                if (outer.turnOrientation === 0) {
                    rowLine = outer.getRowLine(row, col);
                    if (rowLine.length === outer.numTypes - 1)
                        lines = lines.concat(outer.getRowLine(row, col, true));
                    colLine = outer.getColLine(row, col);
                    if (colLine.length === outer.numTypes - 1)
                        lines = lines.concat(outer.getColLine(row, col, true));
                } else if (outer.turnOrientation === 1) {
                    rowLine = outer.getRowLine(row, col);
                    if (rowLine.length === outer.numTypes - 1) 
                        lines = lines.concat(outer.getRowLine(row, col, true));
                    for (var i = 0; i < outer.turnHistory.length; i++) {
                        colLine = outer.getColLine(     outer.turnHistory[i][0],
                                                        outer.turnHistory[i][1]
                                                    );
                        if (colLine.length === outer.numTypes - 1) 
                            lines = lines.concat(   outer.getColLine(outer.turnHistory[i][0],
                                                    outer.turnHistory[i][1], true)
                                                );
                    };
                } else if (outer.turnOrientation === 2) {
                    colLine = outer.getColLine(row, col);
                    if (colLine.length === outer.numTypes - 1) lines = lines.concat(outer.getColLine(row, col, true));
                    for (var i = 0; i < outer.turnHistory.length; i++) {
                        rowLine = outer.getRowLine(outer.turnHistory[i][0], outer.turnHistory[i][1]);
                        if (rowLine.length === outer.numTypes - 1) lines = lines.concat(outer.getRowLine(outer.turnHistory[i][0], outer.turnHistory[i][1], true));
                    };
                }
                for (var i = 0; i < lines.length; i++) {
                    if (outer.coordsPlayable(lines[i][0], lines[i][1])) skip = true;
                };
                // if (!skip) {
                    scores[string] = outer.scoreTurn() - (Math.floor(outer.numTypes/2) * Number(skip));
                // }
                outer.rewindState(Number(lastMove[1]), Number(lastMove[2]), Number(lastMove[3]));
                // ui.getCellByRowCol(lastMove[2], lastMove[3]).html("");
            }
            // string = string.slice(0, string.lastIndexOf('t'));
        }

        for (var i = newLines.length - 1; i >= 0; i--) {
            this.getCurrentPlayer().tiles = newLines[i];
            // if (type === 2) {
            //     recurse_optimize_score('','');
            // } else {
                recurse_avoid_qwerlebait('','');
            // }
            this.resetTurn();
        };
        this.getCurrentPlayer().tiles = rack;

        var highest = 0; 
        var options; 
        for (move in scores) {
            if (scores[move] > highest) {
                highest = scores[move];
                options = [move];
            } else if (scores[move] === highest) {
                options.push(move);
            }
        }

        if (highest) {
            var index = Math.floor(Math.random() * options.length);
            var moves = options[index].split(/[trc]/);
            moves.shift();
            return ["play", moves];
            // for (var i = 0; i < moves.length; i+=3) {
            //     var tile = Number(moves[i]);
            //     var row = Number(moves[i+1]);
            //     var col = Number(moves[i+2]);
            //     this.placeTile(tile, row, col)                
            // };
            // this.endTurn();
        } else {
            return ["exchange"]
        }
    }

    state.startIndex = state.getStartIndex();

    return state;



} 