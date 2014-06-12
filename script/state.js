var _ = require('underscore');
var qunit = require('qunit');
var Player = require('./player');
var Board = require('./board');
// var Combs = require('./combinatorics').Combinatorics;

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
    var _row = 0;
    var _column = 1;
    var _tile = [2];

    var state = {};
    if (exports.maxTypes < numTypes) throw "Too Many Types";
    state.numTypes = Number(numTypes);       // 6 colors, 6 shapes
    state.copies = Number(numCopies);         // 3 copies of each color+shape combo
    state.tilesPerPlayer = Number(numTypes); // players hold 6 tiles at a time
    state.board = new Board.Board(state);
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
    state.playableCache = [ new Board.Coordinates(0,0) ];

    state.tilePlacementsCache = {};
    state.tilePlacements = function(gh) {
        // by default, tile placements returns array of tile placements in form
        // [ row, column, tile ] for all tile placements found in all turns, including
        // the current one.

        if (typeof gh == 'undefined') gh = this.gameHistory.concat([this.turnHistory]);

        var serialize = JSON.stringify(gh);
        if (serialize in this.tilePlacementsCache) return this.tilePlacementsCache[serialize];

        var ret = _.flatten(gh.filter(function(turn) {
            return turn[0] != 'exchange';
        }), 1).sort(function(a, b) {
            // sorts by row. if rows are equal, sorts by column.
            return a.coords.row() != b.coords.row() ? a.coords.row() - b.coords.row() : a.coords.column() - b.coords.column();
        });
        this.tilePlacementsCache[serialize] = ret;
        return ret;
    }

    state.turnGrid = function(tps) {
        if (typeof tps == 'undefined') tps = state.tilePlacements();

        return this.board.grid();
    }

    state.isInitialState = function() {
        var firstTurn = Boolean(!this.gameHistory.length);
        var noHistory = Boolean(!this.turnHistory.length);
        var test = (firstTurn && noHistory);
        return test;        
    }
    state.turn = function() { return this.gameHistory.length; }

    state.lastTilePlacements = function() {

        var index = this.gameHistory.length - 1;

        while (index > -1) {
            if (this.gameHistory[index][0] !== 'exchange') return this.gameHistory[index];
        }
        
        return [];
    }

    state.turnIsColumn = function() {
        return  this.turnHistory.length > 1 && 
                this.turnHistory[0].column() === this.turnHistory[1].column();
    }

    state.turnIsRow = function() {
        return  this.turnHistory.length > 1 && 
                    this.turnHistory[0].coords.row() === this.turnHistory[1].coords.row();
    }

    state.playable = function() {
        if (!this.turnHistory.length) {
            return this.playableCache;
        }

        var lines = this.board.linesAt(this.turnHistory[0].coords);

        // note to self: filtering only those bounds which return
        // true from board.coordsPlayable makes it MUCH slower.
        if (this.turnHistory.length === 1) {
            return lines.rowBounds.concat(lines.colBounds);
        } else if (this.turnIsRow()) {
            return lines.rowBounds;
        } else {
            return lines.colBounds;
        }
    }

    state.moveLines = function() {
        var outer = this;
        var th = this.turnHistory;

        if (!th.length) return [];

        var lines = this.board.linesAt(th[0].coords);
        if (th.length === 1) return [ lines.rowLine, lines.colLine ];
        if (this.turnIsRow()) {
            // mainline is row
            return th.map(function (x) {
                                    return outer.board.linesAt(x.coords).colLine;
                            }).concat([lines.rowLine]);
        } else {
            // mainline is col
            return th.map(function (x) {
                                    return outer.board.linesAt(x.coords).rowLine;
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

    state.getPlayableOnMove = function(coords, remove) {

        var index;
        var playable = this.playableCache;

        if (!remove) {
            index = coords.in(this.playableCache);
            if (index !== -1) {
                playable.splice(index, 1);
            }
        } else {
            playable.push(coords);
        }

        var neighbors = this.board.getPlayableNeighbors(coords);

        // loop through UNplayable neighbors
        for (var i = neighbors.unplayable.length - 1; i >= 0; i--) {
            // check if newly found UNplayable cell is currently in playable
            index = neighbors.unplayable[i].in(playable);
            if (index !== -1) {
                // remove newly found UNplayable cell from playable.
                playable.splice(index, 1);
            }
        };

        for (var i = neighbors.playable.length - 1; i >= 0; i--) {
            if ( neighbors.playable[i].in(playable) === -1) {
                playable.push(neighbors.playable[i]);
            }
        };

        return playable;
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
    state.tilePlace = function(coords, tile) {
        if ( !this.board.placeTileValidate(coords, tile) ) {
            return false;
        }
        this.turnHistory.push(new Board.TilePlacement(coords, tile));
        return true;
    }

    state.undoTilePlace = function() {
        if ( this.turnHistory.length === 0 ) return false;
        var lastPlacement = this.turnHistory.pop();
        return true;
    }

    state.removeTile = function(coords) {
        for (var i = 0; i < this.turnHistory.length; i++) {
            if (coords.equal(this.turnHistory[i])) {
                this.turnHistory.splice(i, 1);
                return true;
            }
        };
        var tps = this.tilePlacements();

        for (var i = 0; i < tps.length; i++) {
            if (coords.equal(tps[i])) {
                tps.splice(i, 1);
                this.getPlayableOnMove(coords, true);
                return true;
            }
        };

        return false;
    }

    state.scoreLine = function(line) {
        // below logic works on all but the very first play. handling in place in scoreturn for first play.
        if (line.length === 1) return 0;

        if (line.length === this.numTypes) return this.numTypes * 2;

        return line.length;
    }
    state.gameOver = function() {
        var playerTileCount = this.turnHistory.length ? this.getCurrentPlayer().turnTiles().length : this.players[this.turn() - 1 % this.players.length].tiles.length;
        return this.bag.length + playerTileCount === 0;
    }
    state.scoreTurn = function(moveLines) {
        var outer = this;
        var score = 0;
        // var th = this.turnHistory;

        if (!this.turnHistory.length) return false;

        // Special handling for case where first move is just one tile:
        if (this.turn() === 0 && this.turnHistory.length === 1) return 1;

        // End of game bonus:
        if (this.gameOver()) score += this.numTypes;

        score += exports.sum(this.moveLines().map(function(x) {
                    return outer.scoreLine(x);
                }));

        return score;
    }

    state.resetTurn = function () {

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

        var row;
        var col;
        var tile;
        var turnScore = this.scoreTurn();
        player.score += turnScore;
        player.drawTiles(state, this.turnHistory.length);
        var turnPush = this.gameHistory[this.gameHistory.push([]) - 1];
        while (this.turnHistory.length) {
            var move = this.turnHistory.shift();
            turnPush.push(move);

            this.playableCache = this.getPlayableOnMove(move.coords);
            player.removeTile(move.tile);
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

    state.validateTurnHistory = function(th) {
        if (typeof th == 'undefined') th = this.turnHistory;

        var turnLines = this.moveLines();

        for (var i = 0; i < turnLines.length; i++) {
            if (this.board.lineIsValid(turnLines[i])) return false;
        };

        return true;
    }

    state.computerPlay = function(avoid_twerqle_bait) {

        var outer = this;
        var plyr = this.getCurrentPlayer();

        if (this.isInitialState()) {
            var coords, move = [];
            var line = plyr.getLongestLine(this);
            for (var i = 0; i < line.length; i++) {
                coords = new Board.Coordinates(0, i);
                move.push(new Board.TilePlacement(coords, line[i]));
            };
            return ['play', move];
        }

        var lines = plyr.getAllLinesInRack(this);

        var scores = {};
        var killswitch = false;
        function recurse_optimize_score(rack, avoid_twerqle_bait) {
            var row, col, tile;
            var playables = outer.playable();
            for (var i = 0; i < playables.length; i++) {
                // row = Number(playables[i][0]);
                // col = Number(playables[i][1]);

                for (var j = rack.length - 1; j >= 0; j--) {

                    tile = rack[j];
                    if (outer.tilePlace(playables[i], tile)) {
                        recurse_optimize_score(rack.slice(0,j).concat(rack.slice(j + 1)), avoid_twerqle_bait);
                        if (killswitch) return;
                    }
                };
            };
            if (outer.turnHistory.length) {
                var hash = JSON.stringify(outer.turnHistory);
                var score = outer.scoreTurn();
                var score_value = avoid_twerqle_bait && 
                                    outer.moveLines().filter(function(line) { return line.length === outer.numTypes - 1; }).length ? score - 2 : score;
                scores[hash] = score_value;
                outer.undoTilePlace();

                if (score > numTypes * 2 + 1) killswitch = true;
            }
        }

        // function recurse_avoid_qwerlebait(string, lastMove) {
        //     var rack, tile, row, col, lines, newLastMove;
        //     for (var i = 0; i < outer.turnPlayable.length; i++) {
        //         // if (string || playableRange.indexOf(i) !== -1) {
        //             var rack = outer.getCurrentPlayer().tiles;
        //             for (var j = rack.length - 1; j >= 0; j--) {
        //                 var tile = outer.getCurrentPlayer().tiles[j];
        //                 var row = Number(outer.turnPlayable[i][0]);
        //                 var col = Number(outer.turnPlayable[i][1]);
        //                 if (Math.random() < type * ( 0.5 * ( 1 / outer.turnHistory.length + 1 ) )) {
        //                     if (outer.placeTile(tile, row, col)) {
        //                         var newLastMove = 't' + tile + 'r' + row + 'c' + col;
        //                         recurse_avoid_qwerlebait(string + newLastMove, newLastMove);
        //                     }
        //                 }
        //             };
        //         // }
        //     };
        //     if (string) {
        //         var lines = [];
        //         var colLine, rowLine, skip;
        //         var lastMove = lastMove.split(/[trc]/);
        //         var row = Number(lastMove[2]);
        //         var col = Number(lastMove[3]);
        //         var skip = false;


        //         if (outer.turnOrientation === 0) {
        //             rowLine = outer.getRowLine(row, col);
        //             if (rowLine.length === outer.numTypes - 1)
        //                 lines = lines.concat(outer.getRowLine(row, col, true));
        //             colLine = outer.getColLine(row, col);
        //             if (colLine.length === outer.numTypes - 1)
        //                 lines = lines.concat(outer.getColLine(row, col, true));
        //         } else if (outer.turnOrientation === 1) {
        //             rowLine = outer.getRowLine(row, col);
        //             if (rowLine.length === outer.numTypes - 1) 
        //                 lines = lines.concat(outer.getRowLine(row, col, true));
        //             for (var i = 0; i < outer.turnHistory.length; i++) {
        //                 colLine = outer.getColLine(     outer.turnHistory[i][0],
        //                                                 outer.turnHistory[i][1]
        //                                             );
        //                 if (colLine.length === outer.numTypes - 1) 
        //                     lines = lines.concat(   outer.getColLine(outer.turnHistory[i][0],
        //                                             outer.turnHistory[i][1], true)
        //                                         );
        //             };
        //         } else if (outer.turnOrientation === 2) {
        //             colLine = outer.getColLine(row, col);
        //             if (colLine.length === outer.numTypes - 1) lines = lines.concat(outer.getColLine(row, col, true));
        //             for (var i = 0; i < outer.turnHistory.length; i++) {
        //                 rowLine = outer.getRowLine(outer.turnHistory[i][0], outer.turnHistory[i][1]);
        //                 if (rowLine.length === outer.numTypes - 1) lines = lines.concat(outer.getRowLine(outer.turnHistory[i][0], outer.turnHistory[i][1], true));
        //             };
        //         }
        //         for (var i = 0; i < lines.length; i++) {
        //             if (outer.coordsPlayable(lines[i][0], lines[i][1])) skip = true;
        //         };
        //         // if (!skip) {
        //             scores[string] = outer.scoreTurn() - (Math.floor(outer.numTypes/2) * Number(skip));
        //         // }
        //         outer.rewindState(Number(lastMove[1]), Number(lastMove[2]), Number(lastMove[3]));
        //         // ui.getCellByRowCol(lastMove[2], lastMove[3]).html("");
        //     }
        //     // string = string.slice(0, string.lastIndexOf('t'));
        // }



        for (var i = lines.length - 1; i >= 0; i--) {
            recurse_optimize_score(lines[i], avoid_twerqle_bait);
            this.resetTurn();
        };

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
            var movesJSON = JSON.parse(options[index]);
            var moves = [];
            for (var i = 0; i < movesJSON.length; i++) {
                moves.push(new Board.TilePlacement(
                                new Board.Coordinates(movesJSON[i].coords.x, movesJSON[i].coords.y), 
                                movesJSON[i].tile)
                            );
            };

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