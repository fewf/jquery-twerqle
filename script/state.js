var _ = require('underscore');
var qunit = require('qunit');

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
            turnHistory: []
        });

        // remove the tiles the player took from the "bag"
        state.bag = _.drop(state.bag, state.tilesPerPlayer);
    }



    state.players = players;
    state.turn = 0;
    state.firstMove = true;

    state.getShape = function(num) {
        return num % this.numTypes;
    }

    state.getColor = function(num) {
        return Math.floor(num/this.numTypes);
    }

    state.getLongestLine = function(tiles) {
        var outer = this;
        var shapeLines = [];
        var colorLines = [];
        tiles = _.uniq(tiles)  
        for (i=0; i < this.numTypes; i++) {
            shapeLines.push(tiles.filter(function (x) {return outer.getShape(x) === i; }));
            colorLines.push(tiles.filter(function (x) {return outer.getColor(x) === i; }));
        }
        var shapeLinesLength = shapeLines.map(function (x) {return x.length;});
        var colorLinesLength = colorLines.map(function (x) {return x.length;});

        var maxShapes = Math.max.apply(Math, shapeLinesLength);
        var maxColors = Math.max.apply(Math, colorLinesLength);

        if (maxColors > maxShapes) {
            return colorLines[colorLinesLength.indexOf(maxColors)];
        } else {
            return shapeLines[shapeLinesLength.indexOf(maxShapes)];
        }
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
        // not over numTypes
        if (line.length > this.numTypes) { return false; }

        // all 1-length lines valid
        if (line.length === 1) { return true; }

        var allSameShape = true;
        var allSameColor = true;

        for (var i = line.length - 1,
             shape = this.getShape(line[i]),
             color = this.getColor(line[i]); i >= 0; i--) {
            // check unique; short-circuit false if not
            if (line.slice(0,i).indexOf(line[i]) !== -1) {
                return false;
            }
            // check same shape/color
            if (shape !== this.getShape(line[i])) { allSameShape = false; }
            if (color !== this.getColor(line[i])) { allSameColor = false; }
        };

        return allSameShape || allSameColor;
    }

    state.hasNeighbors = function(row, col) {
        return  (this.board[row+1][col] !== undefined) ||
                (this.board[row-1][col] !== undefined) ||
                (this.board[row][col+1] !== undefined) ||
                (this.board[row][col-1] !== undefined)
    }

    state.placeTile = function(tile, row, col) {
        var currentPlayer = this.getCurrentPlayer();
        if (currentPlayer.tiles.indexOf(tile) === -1) {
            return false;
        }

        if (!this.firstMove) {
            if (!this.hasNeighbors(row, col)) {
                return false;
            }
        } else {
            row = this.center;
            col = this.center;
            this.firstMove = false;
        }
        this.board[row][col] = tile;

        if (this.lineIsValid(this.getRowLine(row, col)) 
            && this.lineIsValid(this.getColLine(row, col))) {
            currentPlayer.tiles.splice(
                currentPlayer.tiles.indexOf(tile), 1);
            currentPlayer.turnHistory.push([row, col]);
            return true; 
        } else {
            this.board[row][col] = undefined;
            return false;
        }
    }

    state.getColSlice = function(col,rowMin,rowMax) {
        var colSlice = [];
        for (var i = rowMin; i <= rowMax; i++) {
            colSlice.push(this.board[i][col])
        };
        return colSlice;
    }
    
    state.scoreTurn = function(turnHistory) {
        var score = 0;
        if (!turnHistory.length) return score;
        if (turnHistory.length === 1) {
            var lines = this.getLines(turnHistory[0], turnHistory[1]);
            scores += lines[0].length > 1 ? lines[0].length : 0;
            scores += lines[1].length > 1 ? lines[1].length : 0;
            scores += lines[0].length === this.numTypes ? this.numTypes : 0;
            scores += lines[1].length === this.numTypes ? this.numTypes : 0;
            return score;
        }
        var rowMin, rowMax, colMin, colMax;

        for (var i = turnHistory.length - 1; i >= 0; i--) {
            rowMin = (turnHistory[i][0] < (rowMin || Infinity))  ? turnHistory[i][0] : rowMin;
            rowMax = (turnHistory[i][0] > (rowMax || -Infinity)) ? turnHistory[i][0] : rowMax;
            colMin = (turnHistory[i][1] < (colMin || Infinity))  ? turnHistory[i][1] : colMin;
            colMax = (turnHistory[i][1] > (colMax || -Infinity)) ? turnHistory[i][1] : colMax;
        };

        if (rowMin === rowMax) {
            var xSlice = this.board[rowMin].slice(colMin,colMax + 1);
            if (xSlice.indexOf(undefined) === -1) {
                score += this.getRowLine(rowMin, colMin).length;
                for (var i = 0; i < turnHistory.length; i++) {
                    score += this.getColLine(turnHistory[i][0], turnHistory[i][1]).length > 1 ?
                             this.getColLine(turnHistory[i][0], turnHistory[i][1]).length : 0;
                    score += this.getColLine(turnHistory[i][0], turnHistory[i][1]).length === this.numTypes ?
                             this.numTypes : 0;
                };
            }
            return score;
        } else if (colMin === colMax) {
            var colSlice = this.getColSlice(colMin, rowMin, rowMax);
            if (colSlice.indexOf(undefined) === -1) {
                score += this.getColLine(rowMin, colMin).length;
                for (var i = 0; i < turnHistory.length; i++) {
                    var row = turnHistory[i][0];
                    var col = turnHistory[i][1];
                    score += this.getRowLine(row, col).length > 1 ?
                             this.getRowLine(row, col).length : 0;
                    score += this.getRowLine(row, col).length === this.numTypes ?
                             this.numTypes : 0;
                };
            }
            return score;
        } else {
            return score;
        }
    }



    state.endTurn = function() {
        var player = this.getCurrentPlayer();
        var score = this.scoreTurn(player.turnHistory)

        if (!score) {
            for (var i = player.turnHistory.length - 1; i >= 0; i--) {
                player.tiles.push(this.board[player.turnHistory[i][0]][player.turnHistory[i][1]]);
                this.board[player.turnHistory[i][0]][player.turnHistory[i][1]] = undefined;
            };
            player.turnHistory = [];
            return false; 
        } 
        
        player.score += score;
        player.tiles = player.tiles.concat(_.take(this.bag, player.turnHistory.length));
        this.bag = _.drop(this.bag, player.turnHistory.length);
        player.turnHistory = [];
        this.turn++;
    }

    state.getView = function(exCenter) {
        if (typeof exCenter === "undefined") exCenter = viewSize;
        var view = [];
        for (var i = -exCenter; i <= exCenter; i++) {
            view.push(this.board[this.center + i].slice(this.center - exCenter,this.center + exCenter + 1));
        };
        return view;
    }
    return state;
}