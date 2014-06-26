var _ = require('underscore');


var Coordinates = function(x, y) {
    this.x = x;
    this.y = y;
}


Coordinates.prototype.row = function() { return this.y; }
Coordinates.prototype.column = function() { return this.x; }
Coordinates.prototype.neighbor = function(dir) {
    var newX = this.x, newY = this.y;
    if (dir === 'left') newX = newX - 1;
    if (dir === 'right') newX = newX + 1;
    if (dir === 'up') newY = newY -1;
    if (dir === 'down') newY = newY + 1;
    return new Coordinates(newX, newY); 
}
Coordinates.prototype.neighbors = function() {
    return [
            this.neighbor('up'),
            this.neighbor('right'),
            this.neighbor('down'),
            this.neighbor('left')
           ]
}

Coordinates.prototype.equals = function(coords) {
    return this.column() === coords.column() && this.row() === coords.row();
}

Coordinates.prototype.in = function(coordsArray) {
    for (var i = 0; i < coordsArray.length; i++) {
        if (this.equals(coordsArray[i])) {
            return i;
        }
    };
    return -1;
}

var TilePlacement = function(coords, tile) {
    this.coords = coords;
    this.tile = tile;
}

TilePlacement.prototype.row = function() {
    return this.coords.row();
}

TilePlacement.prototype.column = function() {
    return this.coords.column();
}
// var LineTilePlacements = function(tps, colElseRow, lineIndex) {
//     this.orientation: colElseRow ? 'column' : 'row';
//     this.index = lineIndex;
//     this.lineTilePlacements = tps.map(function(tp) { 
//         return [tp[Number(colElseRow)], tp[2]];
//     });
// }

// LineTilePlacements.prototype.toTilePlacements = function() {

//     return this.map(function(ltps) {

//     })
// }

var Board = function(state) {
    var _row = 0;
    var _col = _column = 1;
    var _tile = 2;

    this.gridCache = { timesCalled: 0 };
    this.grid = function(tps, padding) {
        this.gridCache.timesCalled++;
        // default tile placements include turn tile placements
        if (typeof tps == 'undefined') tps = state.tilePlacements();

        // padding describes how many empty rows and columns to pad grid with, if any
        if (typeof padding != 'number') padding = 2;

        // get from cache if cached
        var serial = JSON.stringify(tps);
        if (this.gridCache[serial]) {
            return this.gridCache[serial];
        }

        // debugger;
        // takes advantage of the fact that tps are sorted by row
        var highRow = tps.length ? tps[tps.length - 1].row() : 0;
        var lowRow = tps.length ? tps[0].row() : 0;

        // get sorted list of cols in play
        var cols = tps.map(function(tp) { return tp.column(); }).sort(function(a, b) { return a - b; });

        var highCol = cols.length ? cols[cols.length - 1] : 0;
        var lowCol = cols.length ? cols[0] : 0;


        var rowCount = (highRow - lowRow + 1) + padding * 2;
        var rowOffset = (lowRow - padding) * -1;

        var colCount = (highCol - lowCol + 1) + padding * 2;
        var colOffset = (lowCol - padding) * -1;

        var newgrid = new Array(rowCount);

        for (var i = 0; i < newgrid.length; i++) {
            newgrid[i] = new Array(colCount);
        };

        // project tile placements onto our new grid
        tps.map(function(tp) {
            newgrid[tp.row() + rowOffset][tp.column() + colOffset] = tp.tile;
        });

        // cache it

        var ret = { grid: newgrid, 'rowOffset': rowOffset, 'colOffset': colOffset };

                // debugger;
        this.gridCache[serial] = ret;


        return ret;
    }

    this.row = function(rowNum, tps) {
        if (typeof tps == 'undefined') tps = state.tilePlacements();


        return tps.filter(function(tp) {
            return tp.row() === rowNum;
        });
    }

    this.column = function(colNum, tps) {
        if (typeof tps == 'undefined') tps = state.tilePlacements();
        
        return tps.filter(function(tp) {
            return tp.column() === colNum;
        });
    }


    // this.equalCoords = function(coord1, coord2) {
    //     return coord1.x === coord2.x && coord1[_col] === coord2[_col];
    // }

    // this.coordsIn = function(needle, haystack) {

    //     for (var i = haystack.length - 1; i >= 0; i--) {
    //         if (this.equalCoords(needle, haystack[i])) return i;
    //     };
    //     return -1;
    // }

    // this.lineAt = function(startIndex, colElseRow, tps) {
    //     var lookup = Number(colElseRow);
    //     var min, max, tile, line = [];
    //     var i = 1;

    //     while (typeof min == 'undefined') {
    //         tile = this.tileAt(colElseRow ? row - i : row, colElseRow ? col : col - 1, tps);
    //         if (typeof tile != 'undefined') {
    //             rowLine.unshift(tile);
    //             i++;
    //         } else {
    //             minCol = col - i;
    //         }
    //     }

    //     i = 1;

    //     while (typeof max == 'undefined') {
    //         tile = this.tileAt(row, col + i, rowTps);
    //         if (typeof tile != 'undefined') {
    //             rowLine.push(tile);
    //         } else {
    //             maxCol = col + i;
    //         }            
    //     }

    //     for (var i = 1; typeof min == 'undefined' || typeof max == 'undefined'; i++) {
    //         if (typeof maxCol == 'undefined') {
    //             tile = this.tileAt(row, col + i, rowTps);
    //             if (typeof tile != 'undefined') {
    //                 rowLine.push(tile);
    //             } else {
    //                 maxCol = col + i;
    //             }
    //         }
    //         if (typeof minCol == 'undefined') {
    //             tile = this.tileAt(row, col - i, rowTps);
    //             if (typeof tile != 'undefined') {
    //                 rowLine.unshift(tile);
    //             } else {
    //                 minCol = col - i;
    //             }
    //         }
    //         if (typeof maxRow == 'undefined') {
    //             tile = this.tileAt(row + i, col, colTps);
    //             if (typeof tile != 'undefined') {
    //                 colLine.push(tile);
    //             } else {
    //                 maxRow = row + i;
    //             }
    //         }
    //         if (typeof minRow == 'undefined') {
    //             tile = this.tileAt(row - i, col, colTps);
    //             if (typeof tile != 'undefined') {
    //                 colLine.unshift(tile);
    //             } else {
    //                 minRow = row - i;
    //             }
    //         }
    //     };
    // }

    this.linesAtCache = {};
    this.linesAt = function(coords, tps) {
        if (typeof tps == 'undefined') tps = state.tilePlacements();

        var serialize = JSON.stringify(tps) + JSON.stringify(coords);

        if (serialize in this.linesAtCache) {
            return this.linesAtCache[serialize];
        }

        var orig = this.tileAt(coords, tps);

        if (typeof orig == 'undefined') return { rowLine: [], colLine: [] };

        var rowTps = this.row(coords.row(), tps);
        var colTps = this.column(coords.column(), tps);
        var rowLine = [];
        var colLine = [];
        var tile;

        var nextCoords = coords.neighbor('left');

        tile = this.tileAt(nextCoords, rowTps);
        while (typeof tile !== 'undefined') {
            rowLine.push(tile);
            nextCoords = nextCoords.neighbor('left');
            tile = this.tileAt(nextCoords, rowTps);
        }

        var leftBound = _.clone(nextCoords);

        rowLine.push(orig);

        var nextCoords = coords.neighbor('right');
        tile = this.tileAt(nextCoords, rowTps);
        while (typeof tile !== 'undefined') {
            rowLine.push(tile);
            nextCoords = nextCoords.neighbor('right');
            tile = this.tileAt(nextCoords, rowTps);
        }

        var rightBound = _.clone(nextCoords);

        var nextCoords = coords.neighbor('up');
        tile = this.tileAt(nextCoords, colTps);
        while (typeof tile !== 'undefined') {
            colLine.push(tile);
            nextCoords = nextCoords.neighbor('up');
            tile = this.tileAt(nextCoords, colTps);
        }

        var upBound = _.clone(nextCoords);

        colLine.push(orig);

        var nextCoords = coords.neighbor('down');
        tile = this.tileAt(nextCoords, colTps);
        while (typeof tile !== 'undefined') {
            colLine.push(tile);
            nextCoords = nextCoords.neighbor('down');
            tile = this.tileAt(nextCoords, colTps);
        }

        var downBound = _.clone(nextCoords);

        var ret = {
                rowLine: rowLine,
                colLine: colLine,
                colBounds: [upBound, downBound], 
                rowBounds: [leftBound, rightBound], 
               };
        this.linesAtCache[serialize] = ret;
        return ret;
    }


    // this.getLines = function(row, col, coords) {
    //     if (coords) {
    //         return this.getRowLine(row, col, true).concat(this.getColLine(row, col, true));
    //     }
    //     return [this.getRowLine(row, col), this.getColLine(row, col)];
    // }

    this.lineIsValid = function(line) {

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
    this.getPlayableNeighbors = function(coords, tps) {
        if (typeof tps == 'undefined') tps = state.tilePlacements();
        var playableNeighbors = [];
        var unplayableNeighbors = [];


        var lines = this.linesAt(coords, tps);

        var neighbors = coords.neighbors();

        for (var i = neighbors.length - 1; i >= 0; i--) {
            if (this.coordsPlayable(neighbors[i])) {
                playableNeighbors.push(neighbors[i]);
            } else {
                unplayableNeighbors.push(neighbors[i]);
            }
        };

        return { playable: playableNeighbors, unplayable: unplayableNeighbors };
    }

    this.tileAt = function(coords, tps) {

        if (typeof tps == 'undefined') tps = state.tilePlacements();

        var tp = _.find(tps, function(tp) { return coords.equals(tp.coords); });

        return tp ? tp.tile : tp;

    }


    this.placeTileValidate = function(coords, tile) {


        if ( coords.in(state.playable()) === -1) {
            console.log('coords not in playable; ' + row + ', '  + col);
            console.log(state.playable());
            return false;
        }
        
        var tps = state.tilePlacements(state.gameHistory.concat([
            state.turnHistory.concat([
                new TilePlacement(coords, tile)
            ])
        ]));

        var newLines = this.linesAt(coords, tps);

        if ( !this.lineIsValid(newLines.rowLine) ||
             !this.lineIsValid(newLines.colLine) ) {
            return false;
        }
        
        return true;
    }

    this.coordsPlayable = function(coords) {

        if (typeof this.tileAt(coords) != 'undefined') return false;

        var upLine = this.linesAt(coords.neighbor('up')).colLine;
        var rightLine = this.linesAt(coords.neighbor('right')).rowLine;
        var downLine = this.linesAt(coords.neighbor('down')).colLine;
        var leftLine = this.linesAt(coords.neighbor('left')).rowLine;


        //length test
        if (upLine.length + downLine.length >= this.numTypes ||
            leftLine.length + rightLine.length >= this.numTypes) return false;

        // test opposite lines can connect
        if (!this.linesCanConnect(upLine, downLine) ||
            !this.linesCanConnect(leftLine, rightLine)) return false;

        // test perpendicular lines can hinge
        return (this.linesCanHinge(upLine, rightLine) &&
                this.linesCanHinge(upLine, leftLine) &&
                this.linesCanHinge(downLine, rightLine) &&
                this.linesCanHinge(downLine, leftLine));
    }


    this.lineHasShape = function(line, shape) {
        if (state.getShape(line[0]) === shape) return true;
        return false;
    }

    this.lineHasColor = function(line, color) {
        if (state.getColor(line[0]) === color) return true;
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
            if (longerLineType < state.numTypes &&
                state.getColor(testTile) !== longerLineType &&
                this.lineHasShape(longerLine, testTypes[1] - state.numTypes)) {
                return false;
            } else if (longerLineType >= state.numTypes &&
                state.getShape(testTile) !== longerLineType &&
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
            return (_.union(line1, line2).length <= state.numTypes)
        }

        var line1IsColor = line1Type < state.numTypes
        var line2IsColor = line2Type < state.numTypes
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
                    return state.getShape(x) === line2Type - state.numTypes }
                ).length) return false;
            if (line2.filter(function(x) {
                    return state.getColor(x) === line1Type }
                ).length) return false;
        } else {
            if (line2.filter(function(x) {
                    return state.getShape(x) === line1Type - state.numTypes }
                ).length) return false;
            if (line1.filter(function(x) {
                    return state.getColor(x) === line2Type }
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
        if (!line.length) return _.range(state.numTypes * 2);

        var testTile = line[0];
        var testColor = state.getColor(testTile);
        var testShape = state.getShape(testTile) + state.numTypes;

        if (line.length === 1) 
            return [ testColor, testShape ];

        if (state.getColor(line[1]) === testColor) return [ testColor ];
        else return [ testShape ];

    }   

}

exports.Board = Board;
exports.Coordinates = Coordinates;
exports.TilePlacement = TilePlacement;
