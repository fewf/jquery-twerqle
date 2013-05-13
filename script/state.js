var _ = require('underscore');
var qunit = require('qunit');

exports.sum = function(nums) {
    var sum = 0;
    for (var i = nums.length - 1; i >= 0; i--) {
        sum += nums[i]
    };
    return sum;
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
            tiles: _.take(state.bag, state.tilesPerPlayer),
        });

        // remove the tiles the player took from the "bag"
        state.bag = _.drop(state.bag, state.tilesPerPlayer);
    }



    state.players = players;
    state.turn = 0;
    state.turnHistory = [];

    state.getShape = function(num) {
        return num % this.numTypes;
    }

    state.getColor = function(num) {
        return Math.floor(num/this.numTypes);
    }

    state.getLongestLine = function(tiles) {
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

    state.hasNeighbor = function(row, col) {
        return  this.tileAt(row + 1, col) ||
                this.tileAt(row - 1, col) ||
                this.tileAt(row, col + 1) ||
                this.tileAt(row, col - 1);
    }

    state.tileAt = function(row,col) {
        return this.board[row, col] !== undefined;
    }

    state.confirmTurnIsLine = function() {
        if (this.turnHistory.length < 2) return true;

        var rows = this.turnHistory.map(function(x) {return x[0]; })
        var cols = this.turnHistory.map(function(x) {return x[1]; })

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

        return slice.indexOf(undefined) === -1;
    }

    state.playerHasTile = function(tile) {
        return this.getCurrentPlayer().tiles.indexOf(tile) !== -1;
    }

    state.updateState = function(tile, row, col) {
        this.removeTileFromRack(tile);
        this.board[row][col] = tile;
        this.turnHistory.push([row, col]);
    }

    state.rewindState = function(tile, row, col) {
        this.getCurrentPlayer().tiles.push(tile);
        this.board[row][col] = undefined;
        this.turnHistory.pop();
    }

    state.removeTileFromRack = function(tile) {
        var player = this.getCurrentPlayer()
        player.tiles.splice(player.tiles.indexOf(tile), 1);
    }

    state.columnSlice = function(col, minRow, maxRow) {
        var colSlice = [];
        for (var i = minRow; i < maxRow; i++) {
            colSlice.push(this.board[i][col])
        };
        return colSlice;
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
        };
        this.turnHistory = [];
    }

    state.replenishTiles = function(player, howMany) {
        howMany = (this.bag.length < howMany) ? this.bag.length : howMany;
        player.tiles = player.tiles.concat(_.take(this.bag, howMany));
        this.bag = _.drop(this.bag, howMany);
    } 

    state.placeTile = function(tile, row, col) {

        if (!this.turnHistory.length && !this.turn) {
            // Special handling for first tile placed in game
            row = this.center;
            col = this.center;
        } else if (!this.hasNeighbor(row, col)) {
            // Normal handling.
            return false;
        }

        // Tile placement validation
        if (!this.tileAt(row, col) ||
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
                this.rewindState(tile, row, col);
                return false;
            }
        } else {
            // Reverse tile placement
            this.rewindState(tile, row, col);
            return false;
        }
    }

    state.endTurn = function() {
        if (!this.turnHistory || !this.turnHistory.length) return false;

        var player = this.getCurrentPlayer();
        player.score += this.scoreTurn();
        this.replenishTiles(player, this.turnHistory.length);
        if (!player.tiles.length) {
            player.score += this.numTypes;
            console.log("GAME OVER!");
        }
        this.turnHistory = [];
        this.turn++;
    }

    return state;
} 