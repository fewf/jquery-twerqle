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
        players.push(new Player.Player(playerNames[i], playerTypes[i], state));
        players[i].drawTiles(state, state.tilesPerPlayer);
    }

    state.players = players;
    state.turnHistory = [];
    state.gameHistory = [];

    // playableCache remembers the playable state of the board at the
    // beginning of each turn
    // state.playableCache = [ [state.board.center, state.board.center] ];
    state.playableCache = [ [0, 0] ];

    state.tilePlacementsCache = {};
    state.tilePlacements = function(gh) {
        if (typeof gh == 'undefined') gh = this.gameHistory.concat([this.turnHistory]);
        var serialize = JSON.stringify(gh);
        if (serialize in this.tilePlacementsCache) return this.tilePlacementsCache[serialize];

        var ret = _.flatten(gh.filter(function(turn) {
            return turn[0] != 'exchange';
        }), 1).sort(function(a, b) {
            return a[0] != b[0] ? a[0] - b[0] : a[1] != b[1] ? a[1] - b[1] : a[2] - b[2];
        });
        this.tilePlacementsCache[serialize] = ret;
        return ret;
    }

    state.turnGrid = function() {
        if (!this.turnHistory.length) return this.board.grid(this.gameHistory);

        return this.board.grid(this.gameHistory.concat([this.turnHistory]));


        // var newGrid = this.copy2dArray(this.board.grid);
        // this.turnHistory.map(function(x) {
        //     newGrid[x[0]][x[1]] = x[2];
        // });
        // return newGrid;
    }

    state.isInitialState = function() {
        var firstTurn = Boolean(!this.gameHistory.length);
        var noHistory = Boolean(!this.turnHistory.length);
        var test = (firstTurn && noHistory);
        return test;        
    }
    state.turn = function() { return this.gameHistory.length; }

    state.turnIsColumn = function() {
        return  this.turnHistory.length > 1 && 
                this.turnHistory[0][1] === this.turnHistory[1][1];
    }

    state.turnIsRow = function() {
        return  this.turnHistory.length > 1 && 
                this.turnHistory[0][0] === this.turnHistory[1][0];
    }

    state.playable = function() {

        if (!this.turnHistory.length) {
            return this.playableCache;
        }

        var row = this.turnHistory[0][0];
        var col = this.turnHistory[0][1];

        var lines = this.board.linesAt(row, col);

        // debugger;
        if (this.turnIsRow()) {
            return lines.rowBounds;
        } else if (this.turnIsColumn()) {
            return lines.colBounds;
        } else {
            return lines.rowBounds.concat(lines.colBounds);
        }
    }

    state.moveLines = function() {
        var outer = this;
        var th = this.turnHistory;

        if (!th.length) return [];

        var lines = this.board.linesAt(th[0][0], th[0][1]);
        if (th.length === 1) return [ lines.rowLine, lines.colLine ];

        if (this.turnIsRow()) {
            // mainline is row
            return th.map(function (x) {
                                    return outer.board.linesAt(x[0], x[1]).colLine;
                            }).concat([lines.rowLine]);
        } else {
            // mainline is col
            return th.map(function (x) {
                                    return outer.board.linesAt(x[0], x[1]).rowLine;
                            }).concat([lines.colLine]);
        }

    }

    state.copy2dArray = function(twodArray) {
        var copy = new Array(twodArray.length);

        for (var i = twodArray.length - 1; i >= 0; i--) {
            copy[i] = twodArray[i].slice(0);
        };

        return copy;
    }

    state.getPlayableOnMove = function(row, col) {
        var ec = this.board.equalCoords;
        // remove just played coords from playable

        var newPlayable = this.playableCache.filter( function (x) {
                            return !ec(x, [row, col]);
                        });

        // debugger;
        var playableNeighbors = this.board.getPlayableNeighbors(row, col);

        // loop through UNplayable neighbors
        for (var i = playableNeighbors[1].length - 1; i >= 0; i--) {
            // check if newly found UNplayable cell is currently in playable
            var index = this.board.coordsIn(playableNeighbors[1][i], newPlayable);
            if (index !== -1) {
                // remove newly found UNplayable cell from playable.
                newPlayable.splice(index, 1);
            }
        };

        for (var i = playableNeighbors[0].length - 1; i >= 0; i--) {
            if (this.board.coordsIn(playableNeighbors[0][i], newPlayable) === -1) {
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

        var firstPlayer = longestLineLengths.indexOf(Math.max.apply(Math, longestLineLengths));
        this.players = this.players.slice(firstPlayer).concat(this.players.slice(0,firstPlayer));
    }

    state.getCurrentPlayer = function() {
        return this.players[this.turn() % this.players.length];
    }
    state.tilePlace = function(row, col, tile) {
        if ( !this.board.placeTileValidate(row, col, tile) ) {
            return false;
        }
        this.turnHistory.push([row, col, tile]);
        return true;
    }

    state.undoTilePlace = function() {
        if ( this.turnHistory.length === 0 ) return false;
        var lastPlacement = this.turnHistory.pop();
        return true;
    } 

    state.scoreLine = function(line) {
        // below logic works on all but the very first play. handling in place in scoreturn for first play.
        if (line.length === 1) return 0;

        if (line.length === this.numTypes) return this.numTypes * 2;

        return line.length;
    }
    state.gameOver = function() {
        return this.bag.length + this.getCurrentPlayer().turnTiles().length === 0;
    }
    state.scoreTurn = function() {
        var outer = this;
        var score = 0;
        // var th = this.turnHistory;

        if (!this.turnHistory.length) return 0;

        // Special handling for case where first move is just one tile:
        if (this.turn() === 0 && this.turnHistory.length === 1) return 1;

        // End of game bonus:
        if (this.gameOver()) score += this.numTypes;

        score += exports.sum(this.moveLines().map(function(x) {
                    return outer.scoreLine(x);
                }));
        if ( typeof score != 'number' ) {
            console.log('score: ' + score);
            console.log(this.turnHistory);
            console.log(this.gameHistory);
            throw 'woops';
        }
        return score;

        // if (th.length === 1) {
        //     var lines = this.board.getLines(th[0][0], th[0][1]);
        //     score += this.scoreLine(lines[0]);
        //     score += this.scoreLine(lines[1]);
        // } else {
        //     if (this.turnIsRow()) {
        //         // mainline is row
        //         var mainLine = this.board.getRowLine(th[0][0], th[0][1])
        //         score += this.scoreLine(mainLine);
        //         var subscores = th.map(function (x) {
        //                 return outer.scoreLine(outer.board.getColLine(x[0], x[1]));
        //             });
        //         score += exports.sum(subscores);
        //     } else {
        //         // mainline is col
        //         var mainLine = this.board.getColLine(th[0][0], th[0][1])
        //         score += this.scoreLine(mainLine);
        //         var subscores = th.map(function (x) {
        //                 return outer.scoreLine(outer.board.getRowLine(x[0], x[1]))
        //             });
        //         score += ;
        //     }
        // }



        // return score;
    }

    state.resetTurn = function () {
        // var th = this.turnHistory;
        // var player = this.getCurrentPlayer();
        // for (var i = th.length - 1; i >= 0; i--) {
        //     player.tiles.push(Number(th[i][2]));
        //     this.board.grid[th[i][0]][th[i][1]] = undefined;
        // };
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


        var player = this.getCurrentPlayer();

        var row
        var col
        var tile
        var turnScore = this.scoreTurn();
        player.score += turnScore;
        player.drawTiles(state, this.turnHistory.length);
        var turnPush = this.gameHistory[this.gameHistory.push([]) - 1];
        while (this.turnHistory.length) {
            var move = this.turnHistory.shift();
            turnPush.push(move);
            var row = move[0];
            var col = move[1];
            var tile = move[2];

            this.playableCache = this.getPlayableOnMove(row, col);
            player.removeTile(tile);
        }


        this.endTurn();


    }

    state.endExchangeTurn = function(selectedTiles) {
        this.gameHistory.push(['exchange', selectedTiles]);

        this.endTurn();
    }

    state.endTurn = function() {
        // pass
    }

    state.computerPlay = function(type) {
        // debugger;
        var outer = this;
        var plyr = this.getCurrentPlayer();

        if (this.isInitialState()) {
            var move = [];
            var line = plyr.getLongestLine(this);
            for (var i = 0; i < line.length; i++) {
                move.push(line[i]);
                move.push(0);
                move.push(0 + i);
            };
            return ['play', move];
        }

        var lines = plyr.getAllLinesInRack(this);

        var scores = {};


        function recurse_optimize_score(rack, string, lastMove) {

            // console.log('enter with rack: ' + outer.board.printTiles(rack));
            // console.log(outer.board.printTiles(rack));
            var playables = outer.playable();
            for (var i = 0; i < playables.length; i++) {
                var row = Number(playables[i][0]);
                var col = Number(playables[i][1]);

                for (var j = rack.length - 1; j >= 0; j--) {

                    var tile = rack[j];
                    // console.log('attempt tile place. ' + outer.board.printTile(tile) + ', ' + row + ', ' +col);
                    if (outer.tilePlace(row, col, tile)) {
                        // console.log('tile placed.')

                        // outer.board.printBoard(5);
                        var newLastMove = 't' + tile + 'r' + row + 'c' + col;

                        // console.log('rack: ' + rack);
                        // console.log(rack.slice(0,j).concat(rack.slice(j + 1)));

                        recurse_optimize_score(rack.slice(0,j).concat(rack.slice(j + 1)), string + newLastMove, newLastMove);
                    }
                };
            };
            if (string) {
                // console.log(string + ': ' + outer.scoreTurn());
                scores[string] = outer.scoreTurn();
                outer.undoTilePlace();
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
        var printTiles = this.board.printTiles;
        // console.log('lines:');
        // lines.map(function(x) { console.log(printTiles(x)); });
        // console.log('end lines:');
        for (var i = lines.length - 1; i >= 0; i--) {
            // console.log(newLines[i]);
            // this.getCurrentPlayer().tiles = newLines[i];
            // if (type === 2) {
            //     recurse_optimize_score('','');
            // } else {
                // console.log('about to call with:' + this.board.printTiles(lines[i]));
            recurse_optimize_score(lines[i], '','');
            // }
            this.resetTurn();
        };
        // this.getCurrentPlayer().tiles = rack;

        var highest = 0; 
        var options = []; 
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
            var moves = options[index].split(/[trc]/).map(function(x) { return Number(x); });
            moves.shift();
            return ["play", moves];

        } else {
            var longestLine = plyr.getLongestLine(this);
            var rack = plyr.tiles.slice(0);
            for (var i = 0; i < longestLine.length; i++) {
                rack.splice(rack.indexOf(longestLine[i]), 1);
            };

            return ["exchange", rack];
        }
    }

    state.startIndex = state.getStartIndex();

    return state;


} 