var _ = require('underscore');

var Board = function(boardSize, state) {
    this.grid = new Array(boardSize);
    for (var i = 0; i < boardSize; i++) {
        this.grid[i] = new Array(boardSize);
    }
    this.center = (boardSize + 1) / 2;

    this.equalCoords = function(coord1, coord2) {
        return coord1[0] === coord2[0] && coord1[1] === coord2[1];
    }

    this.coordsIn = function(needle, haystack) {
        for (var i = haystack.length - 1; i >= 0; i--) {
            if (this.equalCoords(needle, haystack[i])) return i;
        };
        return -1;
    }

    this.getColLine = function(row, col, coords) {
        // if optional coords set to true, will return
        // array of surrounding empty coords

        if (this.grid[row][col] === undefined) return [];

        var minRow = row;
        var maxRow = row;

        var colLine = [];
        for (var i = 0; this.grid[row - i][col] !== undefined; i++) {
            colLine.unshift(this.grid[row-i][col]);
            minRow = row - i;
        };
        for (var i = 1; this.grid[row + i][col] !== undefined; i++) {
            colLine.push(this.grid[row + i][col]);
            maxRow = row + i;
        };
        if (coords) {
            return [ [minRow - 1, col], [maxRow + 1, col] ];
        }
        return colLine;
    }

    this.getRowLine = function(row, col, coords) {
        // if optional coords set to true, will return
        // array of surrounding empty coords


        if (this.grid[row][col] === undefined) return [];

        var minCol = col;
        var maxCol = col;
        var rowLine = [];
        for (var i = 0; this.grid[row][col - i] !== undefined; i++) {
            rowLine.unshift(this.grid[row][col-i]);
            minCol = col - i;
        };
        for (var i = 1; this.grid[row][col + i] !== undefined; i++) {
            rowLine.push(this.grid[row][col + i]);
            maxCol = col + i;
        };
        if (coords) {
            return [ [row, minCol - 1], [row, maxCol + 1] ];
        }
        return rowLine;
    }

    this.getLines = function(row, col, coords) {
        if (coords) {
            var ret = this.getRowLine(row, col, coords);
            ret = ret.concat(this.getColLine(row, col, coords));
            return ret;
        }
        return [this.getRowLine(row, col, coords), this.getColLine(row, col, coords)];
    }

    this.lineIsValid = function(state, line) {

        // not over numTypes
        if (line.length > state.numTypes) return false;

        // no duplicates
        if (_.uniq(line).length !== line.length) return false;

        // all 1-length lines valid
        if (line.length === 1) return true;

        var shapes = line.map(function(x) {return state.getShape(x); });
        var colors = line.map(function(x) {return state.getColor(x); });

        return _.uniq(colors).length === 1 || _.uniq(shapes).length === 1;
    }


 
    // called only be updatePlayable
    this.getPlayableNeighbors = function(row, col) {
        var playableNeighbors = [];
        var unplayableNeighbors = [];

        // var neighbors = this.getCoordNeighbors(row, col);
        var neighbors = this.getLines(row, col, true);
        for (var i = neighbors.length - 1; i >= 0; i--) {
            if (this.coordsPlayable(neighbors[i][0], neighbors[i][1])) {
                playableNeighbors.push(neighbors[i]);
            } else {
                unplayableNeighbors.push(neighbors[i]);
            }
        };

        return [ playableNeighbors, unplayableNeighbors ];
    }

    this.getCoordNeighbors = function(row, col) {
        var neighbors =     [
                                [row + 1, col], [row - 1, col], 
                                [row, col + 1], [row, col - 1]
                            ];
        return neighbors.filter( function(x) { 
                return x[0] > 0 && x[0] < this.grid.length &&
                            x[1] > 0 && x[1] < this.grid.length;
            ;});
    }



    // this.hasNeighbor = function(row, col) {
    //     var neighbors = this.getCoordNeighbors(row, col);
    //     for (var i = neighbors.length - 1; i >= 0; i--) {
    //         if (this.tileAt(neighbors[i][0], neighbors[i][1])) return true;
    //     };
    // }

    this.tileAt = function(row,col) {
        return this.grid[row][col] !== undefined;
    }

    this.turnIsColumn = function() {
        return  this.turnHistory.length > 1 && 
                this.turnHistory[0][1] === this.turnHistory[1][1];
    }

    this.turnIsRow = function() {
        return  this.turnHistory.length > 1 && 
                this.turnHistory[0][0] === this.turnHistory[1][0];
    }
    this.placeTileValidate = function(tile, row, col) {

        if (state.isInitialState()) return true;

        var newLines = this.getLines(row, col);

        return !this.coordsPlayable(row, col) &&
               !this.lineIsValid(newLines[0]) &&
               !this.lineIsValid(newLines[1]);

    }

    this.lineHasShape = function(line, shape) {
        for (var i = line.length - 1; i >= 0; i--) {
            if (this.getShape(line[i]) === shape) return true;
        };
        return false;
    }

    this.lineHasColor = function(line, color) {
        for (var i = line.length - 1; i >= 0; i--) {
            if (this.getColor(line[i]) === color) return true;
        };
        return false;
    }
 
    this.linesCanHinge = function(line1, line2) {

        // one or more is blank or both lines are one-length (ambiguous line type)
        if ((!line1.length || !line2.length) ||
            (line1.length === 1 && line2.length === 1)) return true;

        var line1Type = this.getLineType(line1);
        var line2Type = this.getLineType(line2);


        // If one line is just one tile, lines fail
        // if that tile is not of the color|shape of the longer line
        // AND the longer line has the color|shape 

        var testTypes;
        var testTile;
        var longerLineType;
        var longerLine;
        if (line1.length === 1 || line2.length === 1) {
            // determine which is longer/one-tile
            if (line1.length === 1) {
                testTypes = line1Type;
                testTile = line1[0];
                longerLineType = line2Type[0];
                longerLine = line2;
            } else if (line2.length === 1) {
                testTile = line2[0];
                longerLineType = line1Type[0];
                longerLine = line1;
                testTypes = line2Type;
            }

            if (testTypes.indexOf(longerLineType) !== -1) return true;
            if (longerLineType < this.numTypes &&
                this.getColor(testTile) !== longerLineType &&
                this.lineHasShape(longerLine, testTypes[1] - this.numTypes)) {
                return false;
            } else if (longerLineType >= this.numTypes &&
                this.getShape(testTile) !== longerLineType &&
                this.lineHasColor(longerLine, testTypes[0])) {
                return false;            
            }
            return true;
        }

        // two >1-length lines

        line1Type = line1Type[0];
        line2Type = line2Type[0];

        // If same type of lines, its not hinge-able if
        // among the two are already all the kinds of that
        // line
        if (line1Type === line2Type) {
            return (_.union(line1, line2).length <= this.numTypes)
        }

        var line1IsColor = line1Type < this.numTypes
        var line2IsColor = line2Type < this.numTypes
        // var line1IsShape = line1Type >= this.numTypes
        // var line2IsShape = line2Type >= this.numTypes

        // Nothing doing if they are different color lines, or different
        // shape lines. btw, Number(true) === 1.
        if (Number(line1IsColor) + Number(line2IsColor) !== 1)
            return false;

        // Finally, if one is shape, and the other is color, it's only
        // going to work if the color|shape is already represented.
        var getShape = this.getShape;
        var getColor = this.getColor;
        if (line1IsColor) {
            if (line1.filter(function(x) {
                    return getShape(x) === line2Type - this.numTypes }
                ).length) return false;
            if (line2.filter(function(x) {
                    return getColor(x) === line1Type }
                ).length) return false;
        } else {
            if (line2.filter(function(x) {
                    return getShape(x) === line1Type - this.numTypes }
                ).length) return false;
            if (line1.filter(function(x) {
                    return getColor(x) === line2Type }
                ).length) return false;
        }

        return true;
    }

    this.linesCanConnect = function(line1, line2) {
        // test duplicates first
        if (_.intersection(line1, line2).length) return false;

        var line1Type = this.getLineType(line1);
        var line2Type = this.getLineType(line2);
        var intersection = _.intersection(line1Type, line2Type);

        return Boolean(intersection.length);
    }

    this.getLineType = function(line) {
        if (!line.length) return _.range(this.numTypes * 2);

        var testTile = line[0];
        var testColor = this.getColor(testTile);
        var testShape = this.getShape(testTile) + this.numTypes;

        if (line.length === 1) 
            return [ testColor, testShape ];

        if (this.getColor(line[1]) === testColor) return [ testColor ];
        else return [ testShape ];

    }   

}

exports.Board = Board;