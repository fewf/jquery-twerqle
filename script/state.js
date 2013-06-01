window._ = require('underscore');
window.qunit = require('qunit');

exports.sum = function(nums) {
    var sum = 0;
    for (var i = nums.length - 1; i >= 0; i--) {
        sum += nums[i]
    };
    return sum;
}

exports.equalCoords = function(coord1, coord2) {
    return coord1[0] === coord2[0] && coord1[1] === coord2[1];
}

exports.coordsIn = function(needle, haystack) {
    for (var i = haystack.length - 1; i >= 0; i--) {
        if (exports.equalCoords(needle, haystack[i])) return true;
    };
    return false;
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

exports.initState = function(playerNames, numTypes, numCopies) {
    var state = {};
    if (exports.maxTypes < numTypes) throw "Too Many Types";
    state.numTypes = numTypes;       // 6 colors, 6 shapes
    state.copies = numCopies;         // 3 copies of each color+shape combo
    state.tilesPerPlayer = numTypes; // players hold 6 tiles at a time
    var boardSize = exports.maxDimension(state.numTypes, state.copies)*2 - 1;
    state.board = new Array(boardSize);
    for (var i = 0; i < boardSize; i++)
        state.board[i] = new Array(boardSize);
    state.center = (boardSize + 1) / 2;  // internal x, y of first placed tile

    state.bag = _.shuffle(repeatElements(_.range(0,
                                            state.numTypes*state.numTypes),
                                         state.copies));

    var players = [];
    for (var i = 0; i < playerNames.length; i++) {


        players.push({
            name: playerNames[i],
            score: 0,
            tiles: _.take(state.bag, state.tilesPerPlayer),
        });

        // remove the tiles the player took from the "bag"
        state.bag = _.drop(state.bag, state.tilesPerPlayer);
    }

    state.players = players;
    state.turn = 0;
    state.turnHistory = [];
    state.turnOrientation = -1;
    // state.occupiedCoords = [];
    state.playable = [ [state.center, state.center] ];
    state.turnPlayable = [ [state.center, state.center] ];

    state.getShape = function(num) {
        return num % this.numTypes;
    }

    state.getColor = function(num) {
        return Math.floor(num/this.numTypes);
    }

    state.getAllLinesInRack = function(tiles) {
        // takes list of tile values, returns longest line 
        var outer = this;
        var lines = [];
        tiles = _.uniq(tiles);
 
        for (i=0; i < this.numTypes; i++) {
            lines.push(tiles.filter(
                function (x) { return outer.getShape(x) === i; }));
            lines.push(tiles.filter(
                function (x) { return outer.getColor(x) === i; }));
        }
        lines = lines.filter(function (x) { return x.length } );

        return lines;
    }
    state.getLongestLine = function(tiles) {
        var lines = this.getAllLinesInRack(tiles);

        var linesLengths = lines.map(function (x) { return x.length; });

        var maxLine = Math.max.apply(Math, linesLengths);

        return lines[linesLengths.indexOf(maxLine)];
    }

    state.getStartIndex = function() {
        var outer = this;
        var longestLineLengths = this.players.map(
                                    function (x) {
                                        return outer.getLongestLine(x.tiles).length;
                                    });

        this.startIndex = longestLineLengths.indexOf(Math.max.apply(Math, longestLineLengths));        
    }

    state.getStartIndex();

    state.getCurrentPlayer = function() {
        return this.players[(this.turn + this.startIndex) % this.players.length]
    }

    state.getColLine = function(row, col) {
        if (this.board[row][col] === undefined) return [];
        var colLine = [];
        for (var i = 0; this.board[row - i][col] !== undefined; i++) {
            colLine.unshift(this.board[row-i][col]);
        };
        for (var i = 1; this.board[row + i][col] !== undefined; i++) {
            colLine.push(this.board[row + i][col]);
        };
        return colLine;        
    }

    state.getRowLine = function(row, col) {
        if (this.board[row][col] === undefined) return [];
        var rowLine = [];
        for (var i = 0; this.board[row][col - i] !== undefined; i++) {
            rowLine.unshift(this.board[row][col-i]);
        };
        for (var i = 1; this.board[row][col + i] !== undefined; i++) {
            rowLine.push(this.board[row][col + i]);
        };
        return rowLine;
    }

    state.getLines = function(row, col) {
        return [this.getRowLine(row, col), this.getColLine(row, col)];
    }

    state.lineIsValid = function(line) {
        var outer = this;
        // not over numTypes
        if (line.length > this.numTypes) return false;

        // no duplicates
        if (_.uniq(line).length !== line.length) return false;

        // all 1-length lines valid
        if (line.length === 1) return true;

        var shapes = line.map(function(x) {return outer.getShape(x); });
        var colors = line.map(function(x) {return outer.getColor(x); });

        return _.uniq(colors).length === 1 || _.uniq(shapes).length === 1;
    }

    state.getTurnPlayable = function() {
        var th = this.turnHistory;
        if (!th.length) return this.playable;
        var turnPlayable = [];
        var row = th[0][0];
        var col = th[0][1];
        if (th.length === 1) {
            var row = th[0][0];
            var col = th[0][1];

            var lines = this.getLines(row, col);
            var startRow, endRow, startCol, endCol;
            if (lines[0].length < this.numTypes) {
                for (var i = 0; this.tileAt(row, col - i); i++) {
                    startCol = col - i;
                };
                for (var i = 0; this.tileAt(row, col + i); i++) {
                    endCol = col + i;
                };
            }

            if (lines[1].length < this.numTypes) {
                for (var i = 0; this.tileAt(row - i, col); i++) {
                    startRow = row - i;
                };
                for (var i = 0; this.tileAt(row + i, col); i++) {
                    endRow = row + i;
                };
            }

            turnPlayable.push([row, startCol - 1]);
            turnPlayable.push([row, endCol + 1]);
            turnPlayable.push([startRow -1, col]);
            turnPlayable.push([endRow + 1, col]);

            return turnPlayable;
        } else if (this.turnOrientation === 1) {
            var start, end;
            var line = this.getRowLine(row, col);
            if (line.length < this.numTypes) {
                for (var i = 0; this.tileAt(row, col - i); i++) {
                    start = col - i;
                };
                for (var i = 0; this.tileAt(row, col + i); i++) {
                    end = col + i;
                };
            }
            turnPlayable.push([row, start - 1]);
            turnPlayable.push([row, end + 1]);
        } else if (this.turnOrientation === 2) {
            var start, end;
            var line = this.getColLine(row, col);
            if (line.length < this.numTypes) {
                for (var i = 0; this.tileAt(row - i, col); i++) {
                    start = row - i;
                };
                for (var i = 0; this.tileAt(row + i, col); i++) {
                    end = row + i;
                };
            }
            turnPlayable.push([start - 1, col]);
            turnPlayable.push([end + 1, col]);
        }

        return turnPlayable;
    }

    state.updateTurnPlayable = function() {
        this.turnPlayable = this.getTurnPlayable();
    }

    state.updatePlayable = function(row, col) {
        if (this.boardIsEmpty()) {
            this.playable = [ [g.center, g.center] ];
        } else {
            var outer = this;
            // remove just played coords from playable
            this.playable = this.playable.filter( function (x) { 
                    return !exports.equalCoords(x, [row, col]);
                })
            // var coordIndex = this.playable.indexOf([row, col]);
            // this.playable.splice(coordIndex, 1);
            var playableNeighbors = this.getPlayableNeighbors(row, col).filter(
                                        function (x) {
                                            return !exports.coordsIn(x, outer.playable);
                                        });
            this.playable = this.playable.concat(playableNeighbors);
        }
        this.updateTurnPlayable();
    }

    state.coordsArePlayable = function(row, col) {
        for (var i = this.playable.length - 1; i >= 0; i--) {
            if (exports.equalCoords(this.playable[i], [row, col])) {
                return true;
            }
        };
        return false;
    }

    state.getCoordNeighbors = function(row, col) {
        var boardSize = exports.maxDimension(this.numTypes, this.copies)*2 - 1;
        var neighbors =     [
                                [row + 1, col], [row - 1, col], 
                                [row, col + 1], [row, col - 1]
                            ];
        return neighbors.filter( function(x) { 
                return x[0] > 0 && x[0] < boardSize &&
                            x[1] > 0 && x[1] < boardSize;
            ;})
    }

    state.getPlayableNeighbors = function(row, col) {
        var playableNeighbors = [];
        var outer = this;
        var neighbors = this.getCoordNeighbors(row, col);
        for (var i = neighbors.length - 1; i >= 0; i--) {
            if (!this.tileAt(neighbors[i][0], neighbors[i][1])) {
                playableNeighbors.push(neighbors[i]);
            }
        };
        return playableNeighbors;
    }

    state.getAllPlayable = function() {
        if (this.boardIsEmpty) return [ [this.center, this.center] ];
        var checkCoords = []; // coords we've already checked
        var playableNeighbors = [];
        var outer = this;

        function recurse(coords) {
            if (exports.coordsIn(coords, checkCoords)) {
                return [];
            }
            
            checkCoords.push(coords);
            var neighbors = outer.getCoordNeighbors(coords[0], coords[1]);
            for (var i = neighbors.length - 1; i >= 0; i--) {
                if (!outer.tileAt(neighbors[i][0], neighbors[i][1])) {
                    if (!exports.coordsIn(neighbors[i], playableNeighbors)) {
                        playableNeighbors.push(neighbors[i]);
                    }
                } else {
                    // XXX may overflow stack if enough tiles down.
                    playableNeighbors.concat(recurse(neighbors[i]));
                }
            };
        }
        
        recurse([this.center, this.center]);

        return playableNeighbors;
    }

    state.hasNeighbor = function(row, col) {
        var neighbors = this.getCoordNeighbors(row, col);
        for (var i = neighbors.length - 1; i >= 0; i--) {
            if (this.tileAt(neighbors[i][0], neighbors[i][1])) return true;
        };
    }

    state.tileAt = function(row,col) {
        return this.board[row][col] !== undefined;
    }

    state.confirmTurnIsLine = function() {
        // SIDE-EFFECT: sets state.turnOrientation
        // 0: ambiguous
        // 1: row
        // 2: col
        if (this.turnHistory.length < 2) {
            this.turnOrientation = 0;
            return true;
        }

        var rows = this.turnHistory.map(function(x) { return x[0]; });
        var cols = this.turnHistory.map(function(x) { return x[1]; });

        if (_.uniq(rows).length === 1) {
            // is row line - check no gaps
            var row = rows[0];
            var minCol = Math.min.apply(Math, cols);
            var maxCol = Math.max.apply(Math, cols);
            var slice = this.board[row].slice(minCol, maxCol + 1);
        } else if (_.uniq(cols).length === 1) {
            // is col line - check no gaps
            var col = cols[0];
            var minRow = Math.min.apply(Math, rows);
            var maxRow = Math.max.apply(Math, rows);
            var slice = this.columnSlice(col, minRow, maxRow + 1);
        } else {    
            return false;
        }

        if (slice.indexOf(undefined) === -1) {
            this.turnOrientation = (typeof row !== "undefined") ? 1 : 2;
            return true;
        } else {
            return false;
        }
    }
    
    state.columnSlice = function(col, minRow, maxRow) {
        var colSlice = [];
        for (var i = minRow; i < maxRow; i++) {
            colSlice.push(this.board[i][col])
        };
        return colSlice;
    }
    

    state.playerHasTile = function(tile, rack) {
        rack = (typeof rack === "undefined") ? 
                this.getCurrentPlayer().tiles : rack;
        return rack.indexOf(tile) !== -1;
    }

    state.playerHasTiles = function(tiles) {
        var rack = this.getCurrentPlayer().tiles.slice(0);
        for (var i = tiles.length - 1; i >= 0; i--) {
            if (!this.playerHasTile(tiles[i], rack)) return false;
            rack = this.removeTileFromRack(tiles[i], rack);
        };
        return true;
    }

    state.updateState = function(tile, row, col) {
        this.removeTileFromRack(tile);
        this.board[row][col] = tile;
        this.turnHistory.push([row, col]);
        // this.occupiedCoords.push([row, col]);
    }

    state.rewindState = function(tile, row, col) {
        this.getCurrentPlayer().tiles.push(tile);
        this.board[row][col] = undefined;
        this.turnHistory.pop();
        // this.occupiedCoords.pop();
        this.playable = this.getAllPlayable();
        this.updateTurnPlayable();
    }

    state.removeTileFromRack = function(tile, rack) {
        rack = (typeof rack === "undefined") ? 
                this.getCurrentPlayer().tiles : rack;
        var player = this.getCurrentPlayer()
        rack.splice(rack.indexOf(tile), 1);
        return rack;
    }


    state.scoreLine = function(line) {
        // Special handling for case where first move is just one tile:
        if (!this.turn && this.turnHistory.length === 1) return 1;
        // Normal handling:
        if (line.length === 1) return 0;
        if (line.length === this.numTypes) return this.numTypes * 2;
        return line.length;
    }

    state.scoreTurn = function() {
        var outer = this;
        var th = this.turnHistory;
        var score = 0;

        if (!th.length) return score;

        if (th.length === 1) {
            var lines = this.getLines(th[0][0], th[0][1]);
            score += this.scoreLine(lines[0]);
            score += this.scoreLine(lines[1]);
        } else {
            if (th[0][0] === th[1][0]) {
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

        return score;
    }

    state.resetTurn = function () {
        var th = this.turnHistory;
        var player = this.getCurrentPlayer();
        for (var i = th.length - 1; i >= 0; i--) {
            player.tiles.push(this.board[th[i][0]][th[i][1]]);
            this.board[th[i][0]][th[i][1]] = undefined;
            // this.occupiedCoords.pop();
        };
        this.turnHistory = [];
        this.turnOrientation = -1;
        this.playable = this.getAllPlayable();
        this.updateTurnPlayable();
    }

    state.replenishTiles = function(howMany) {
        var player = this.getCurrentPlayer();
        howMany = (this.bag.length < howMany) ? this.bag.length : howMany;
        player.tiles = player.tiles.concat(_.take(this.bag, howMany));
        this.bag = _.drop(this.bag, howMany);
    } 

    state.placeTile = function(tile, row, col) {
        // var ret = this.placeTileValidate(tile, row, col);
        if (!this.placeTileValidate(tile, row, col)) {
            this.rewindState(tile, row, col);
            return false;
        } else {
            this.updatePlayable(row, col);
            return true;
        }
    }

    state.testTilePlacement = function(tile, row, col) {
        var ret = this.placeTileValidate(tile, row, col);
        this.rewindState(tile, row, col);
        return ret;
    }

    state.placeTileValidate = function(tile, row, col) {

        if (this.boardIsEmpty()) {
            // Special handling for first tile placed in game
            row = this.center;
            col = this.center;
        } else if (!this.hasNeighbor(row, col)) {
            // Normal handling.
            return false;
        }

        // Tile placement validation
        if (this.tileAt(row, col) ||
            !this.playerHasTile(tile)) return false;
        
        // Update state
        this.updateState(tile, row, col);

        // Line validation
        if (this.confirmTurnIsLine()) {
            // Newly made ines are either all same shape or color
            var newLines = this.getLines(row, col);
            if (this.lineIsValid(newLines[0]) && this.lineIsValid(newLines[1])) {
                // Success!
                return true; 
            } else {
                // Reverse tile placement
                // this.rewindState(tile, row, col);
                return false;
            }
        } else {
            // Reverse tile placement
            // this.rewindState(tile, row, col);
            return false;
        }
    }

    state.endTurn = function() {
        if (!this.turnHistory.length) return false;

        var player = this.getCurrentPlayer();
        player.score += this.scoreTurn();
        this.replenishTiles(this.turnHistory.length);
        if (!player.tiles.length) {
            player.score += this.numTypes;
            console.log("GAME OVER!");
        }
        // this.occupiedCoords = this.occupiedCoords.concat(this.turnHistory);
        this.turnHistory = [];
        this.turn++;
        this.updateTurnPlayable();
    }

    state.boardIsEmpty = function() {
        return !this.turn && !this.turnHistory.length
    }



    state.exchangeTiles = function(tiles) {
        if (this.turnHistory.length) return false;
        if (!this.playerHasTiles(tiles)) return false;
        this.replenishTiles(tiles.length);
        this.returnTiles(tiles);
        this.turn++;
    }

    state.returnTiles = function(tiles) {
        if (!tiles.length || tiles.length > this.bag.length) return false;
        for (var i = tiles.length - 1; i >= 0; i--) {
            this.removeTileFromRack(tiles[i]);
            g.bag.push(tiles[i]);
        };
        g.bag = _.shuffle(g.bag);
    }

    state.coordsTwerqlable = function(row, col) {
        // FINISH ME!
        var opp, oppTile, thisTile, check;
        var neighbors = this.getCoordNeighbors(row, col);
        var lines = [];
        lines.push(this.getColLine(neighbors[0][0], neighbors[0][1]));
        lines.push(this.getColLine(neighbors[1][0], neighbors[1][1]));
        lines.push(this.getRowLine(neighbors[2][0], neighbors[2][1]));
        lines.push(this.getRowLine(neighbors[3][0], neighbors[3][1]));
        function findOpp (index) {
            if (index % 2) return index - 1
            else return index + 1
        }
        for (var i = lines.length - 1; i >= 0; i--) {
            if (lines[i].length === this.numTypes) return false;
            opp = findOpp(i);
            if (this.tileAt(neighbors[opp][0], neighbors[opp][1])) {
                oppTile = this.board[neighbors[opp][0]][neighbors[opp][1]];
                check = lines[i].indexOf(oppTile);
                if (check !== -1) return false;
                thisTile = this.board[neighbors[i][0]][neighbors[i][1]];
                if (this.getShape(thisTile) !== this.getShape(oppTile) &&
                    this.getColor(thisTile) !== this.getColor(oppTile)) {
                    return false;
                }
            }
        };

        return true;
    }



    state.computerPlay = function() {
        var rack = this.getCurrentPlayer().tiles;
        var lines = this.getAllLinesInRack(rack);
        var scores = {};

        function recurse(string) {

        }

        for (var i = this.playable.length - 1; i >= 0; i--) {
            for (var i = lines.length - 1; i >= 0; i--) {
                this.determine
            };
        };
    }

    return state;
} 