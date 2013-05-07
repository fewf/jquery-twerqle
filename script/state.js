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

exports.getShape = function(num, numTypes) {
    return num % numTypes;
}

exports.getColor = function(num, numTypes) {
    return Math.floor(num/numTypes);
}

exports.growOne = function(x, y) {
    // Takes coords of board, returns array of coords
    // representing 3x3 grid around and including
    // original coords.
    var acc = [];
    for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
            if (((x + i) >= 0) && ((y + j) >= 0)) {
                acc.push([x + i, y + j]);
            }
        }
    }
    return acc;
}

exports.boardLookUp = function(x, y, board) {
    return board[x][y];
}

exports.getLines = function(x, y, board) {
    var nextSpace = -1;
    var xLine = [];
    var yLine = [];
    for (var i = 0; board[x-i][y] !== undefined; i++) {
        xLine.unshift(board[x-i][y]);
    };
    for (var i = 1; board[x+i][y] !== undefined; i++) {
        xLine.push(board[x+i][y]);
    };
    for (var i = 0; board[x][y-1] !== undefined; i++) {
        yLine.unshift(board[x][y-i]);
    };
    for (var i = 1; board[x][y+i] !== undefined; i++) {
        yLine.push(board[x][y+1]);
    };
    return [xLine, yLine];
}

exports.lineIsValid = function(line, game) {
    // not over numTypes
    if (line.length > game.numTypes) { return false; } 

    var allSameShape = true;
    var allSameColor = true;

    for (var i = line.length - 1,
         shape = state.getShape(line[i], game.numTypes),
         color = state.getColor(line[i], game.numTypes); i >= 0; i--) {
        // check unique; short-circuit false if not
        if (line.slice(0,i).indexOf(line[i]) !== -1) {
            return false;
        }
        // check same shape/color
        if (shape !== state.getShape(line[i], game.numTypes)) { allSameShape = false; }
        if (color !== state.getColor(line[i], game.numTypes)) { allSameColor = false; }
    };

    return (allSameShape || allSameColor);
}

exports.placeTile = function(tile, x, y, game) {
    game.board[x][y] = tile;
    newLines = state.getLines(x,y,game.board);
    xIsValid = state.lineIsValid(newLines[0], game);
    yIsValid = state.lineIsValid(newLines[1], game);
    if (xIsValid && yIsValid) { 
        return "cool"; 
    } else {
        game.board[x][y] = undefined;
        return "no good";
    }
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

    state.getYLine = function(x, y) {
        var yLine = [];
        for (var i = 0; this.board[x-i][y] !== undefined; i++) {
            yLine.unshift(this.board[x-i][y]);
        };
        for (var i = 1; this.board[x+i][y] !== undefined; i++) {
            yLine.push(this.board[x+i][y]);
        };
        return yLine;        
    }

    state.getXLine = function(x, y) {
        var xLine = [];
        for (var i = 0; this.board[x][y-i] !== undefined; i++) {
            xLine.unshift(this.board[x][y-i]);
        };
        for (var i = 1; this.board[x][y+i] !== undefined; i++) {
            xLine.push(this.board[x][y+i]);
        };
        return xLine;
    }

    state.getLines = function(x, y) {
        return [this.getXLine(x, y), this.getYLine(x, y)];
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

    state.hasNeighbors = function(x,y) {
        return  (this.board[x+1][y] !== undefined) ||
                (this.board[x-1][y] !== undefined) ||
                (this.board[x][y+1] !== undefined) ||
                (this.board[x][y-1] !== undefined)
    }

    state.placeTile = function(tile, x, y) {
        var currentPlayer = this.getCurrentPlayer();
        if (currentPlayer.tiles.indexOf(tile) === -1) {
            return false;
        }

        if (!this.firstMove) {
            if (!this.hasNeighbors(x,y)) {
                return false;
            }
        } else {
            x = this.center;
            y = this.center;
            this.firstMove = false;
        }
        this.board[x][y] = tile;

        if (this.lineIsValid(this.getXLine(x, y)) 
            && this.lineIsValid(this.getYLine(x, y))) {
            currentPlayer.tiles.splice(
                currentPlayer.tiles.indexOf(tile), 1);
            currentPlayer.turnHistory.push([x,y]);
            return true; 
        } else {
            this.board[x][y] = undefined;
            return false;
        }
    }

    state.getYSlice = function(y,xMin,xMax) {
        var ySlice = [];
        for (var i = xMin; i <= xMax; i++) {
            ySlice.push(this.board[i][y])
        };
        return ySlice;
    }
    state.scoreTurn = function(turnHistory) {
        var score = 0;
        if (!turnHistory.length) return score;
        if (turnHistory.length === 1) {
            var lines = this.getLines(turnHistory[0], turnHistory[1]);
            scores += lines[0].length > 1 ? lines[0].length : 0;
            scores += lines[1].length > 1 ? lines[1].length : 0;
            return score;
        }
        var xMin, xMax, yMin, yMax;

        for (var i = turnHistory.length - 1; i >= 0; i--) {
            xMin = (turnHistory[i][0] < (xMin || Infinity))  ? turnHistory[i][0] : xMin;
            xMax = (turnHistory[i][0] > (xMax || -Infinity)) ? turnHistory[i][0] : xMax;
            yMin = (turnHistory[i][1] < (yMin || Infinity))  ? turnHistory[i][1] : yMin;
            yMax = (turnHistory[i][1] > (yMax || -Infinity)) ? turnHistory[i][1] : yMax;
        };

        if (xMin === xMax) {
            var xSlice = this.board[xMin].slice(yMin,yMax + 1);
            if (xSlice.indexOf(undefined) === -1) {
                score += this.getXLine(xMin, yMin).length;
                for (var i = 0; i < turnHistory.length; i++) {
                    score += this.getYLine(turnHistory[i][0], turnHistory[i][1]).length > 1 ?
                             this.getYLine(turnHistory[i][0], turnHistory[i][1]).length : 0;
                };
            }
            return score;
        } else if (yMin === yMax) {
            var ySlice = this.getYSlice(yMin, xMin, xMax);
            if (ySlice.indexOf(undefined) === -1) {
                score += this.getYLine(xMin, yMin).length;
                for (var i = 0; i < turnHistory.length; i++) {
                    score += this.getXLine(turnHistory[i][0], turnHistory[i][1]).length > 1 ?
                             this.getXLine(turnHistory[i][0], turnHistory[i][1]).length : 0;
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
        var view = [];
        for (var i = -exCenter; i <= exCenter; i++) {
            view.push(this.board[this.center + i].slice(this.center - exCenter,this.center + exCenter + 1));
        };
        return view;
    }
    return state;
}