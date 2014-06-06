var _ = require('underscore');
var clc = require('cli-color');

var colors = [clc.red, clc.blue, clc.green, clc.yellow, clc.magenta, clc.cyan, clc.white, clc.black, clc.bgRed, clc.bgCyan, clc.bgGreen, clc.bgYellow ];
var shapes = [ '@', '#', '$', '%', '&', '*', "+", "=", "?", "\\", "8", "Z" ];


// var TilePlacement = function(row, column, tile) {
//     this.row = row;
//     this.column = column;
//     this.tile = tile;
// }

var Board = function(state) {


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
        var highRow = tps.length ? tps[tps.length - 1][_row] : 0;
        var lowRow = tps.length ? tps[0][_row] : 0;

        // get sorted list of cols in play
        var cols = tps.map(function(tp) { return tp[_col]; }).sort(function(a, b) { return a - b; });

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
            newgrid[tp[_row] + rowOffset][tp[_col] + colOffset] = tp[2];
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
            return tp[_row] === rowNum;
        });
    }

    this.column = function(colNum, tps) {
        if (typeof tps == 'undefined') tps = state.tilePlacements();
        
        return tps.filter(function(tp) {
            return tp[_col] === colNum;
        });
    }

    this.printTile = function(tile, bgColor) {
        if (typeof tile != 'number') return ' ';
        if ( tile < 0 || tile > state.numTypes*state.numTypes) return ' '
        var color = state.getColor(tile);
        var shape = state.getShape(tile);

        if (typeof bgColor == 'function') return bgColor(colors[color](shapes[shape]));
        return colors[color](shapes[shape]);
    }

     this.printTiles = function(tiles) {
        if (typeof tiles === 'undefined') var tiles = state.getCurrentPlay().turnTiles();
        // var printTile = this.printTile;
        return tiles.map(function(x) { return state.board.printTile(x); }).join(' ');
    }

    this.printBoard = function(grid_pkg) {
        if (typeof grid_pkg == 'undefined') grid_pkg = state.turnGrid();
        var grid = grid_pkg.grid;
        row = '   ';
        var colNum;
        var rowNum;

        // add columns index
        // for (var i = 0; i < grid[0].length; i++) {
        //     colNum = i - grid_pkg.colOffset;
        //     row += new Array(4 - String(colNum).length).join(' ');
        //     row += colNum;
        // };

        console.log(row);

        for (var i = 0; i < grid.length; i++) {
            row = '';
            rowNum = i - grid_pkg.rowOffset;
            // row += rowNum;
            // row += new Array(4 - String(rowNum).length).join(' ');
            for (var j = 0; j < grid[0].length; j++) {
                var cell;
                if ( grid[i][j] === undefined ) {
                    cell = ' ';
                } else if (this.coordsIn([rowNum, j - grid_pkg.colOffset], state.turnHistory) != -1) {
                    cell = state.board.printTile(grid[i][j], clc.bgGreen);
                } else if (this.coordsIn([rowNum, j - grid_pkg.colOffset], state.gameHistory[state.gameHistory.length - 1]) != -1) {
                    cell = state.board.printTile(grid[i][j], clc.bgWhite);
                } else {
                    cell = state.board.printTile(grid[i][j]);
                }
                // row += '  '; 
                row += cell;
            };
            console.log(row);
        };
        console.log('');
  
    }
    this.equalCoords = function(coord1, coord2) {
        return coord1[_row] === coord2[_row] && coord1[_col] === coord2[_col];
    }

    this.coordsIn = function(needle, haystack) {

        for (var i = haystack.length - 1; i >= 0; i--) {
            if (this.equalCoords(needle, haystack[i])) return i;
        };
        return -1;
    }

    this.getColLine = function(row, col, coords) {

        var grid_pkg = state.turnGrid();
        var grid = grid_pkg.grid;

        row = row + grid_pkg.rowOffset;
        col = col + grid_pkg.colOffset;

        if (grid[row][col] === undefined) {
            return [];
        }

        var minRow = row;
        var maxRow = row;

        var colLine = [];
        for (var i = 0; grid[row - i][col] !== undefined; i++) {
            colLine.unshift(grid[row-i][col]);
            minRow = row - i;
        };
        for (var i = 1; grid[row + i][col] !== undefined; i++) {
            colLine.push(grid[row + i][col]);
            maxRow = row + i;
        };
        if (coords) {
            return [ [minRow - grid_pkg.rowOffset - 1, col - grid_pkg.colOffset], [maxRow - grid_pkg.rowOffset + 1, col - grid_pkg.colOffset] ];
        }
        return colLine;
    }

    this.getRowLine = function(row, col, coords) {
        // if optional coords set to true, will return
        // array of surrounding empty coords

        var grid_pkg = state.turnGrid();
        var grid = grid_pkg.grid;
        row = row + grid_pkg.rowOffset;
        col = col + grid_pkg.colOffset;

        if (grid[row][col] === undefined) return [];

        var minCol = col;
        var maxCol = col;
        var rowLine = [];
        for (var i = 0; grid[row][col - i] !== undefined; i++) {
            rowLine.unshift(grid[row][col-i]);
            minCol = col - i;
        };
        for (var i = 1; grid[row][col + i] !== undefined; i++) {
            rowLine.push(grid[row][col + i]);
            maxCol = col + i;
        };
        if (coords) {
            return [ [row - grid_pkg.rowOffset, minCol - grid_pkg.colOffset - 1], [row - grid_pkg.rowOffset, maxCol - grid_pkg.colOffset + 1] ];
        }
        return rowLine;
    }

    this.linesAtCache = {};
    this.linesAt = function(row, col, tps) {
        if (typeof tps == 'undefined') tps = state.tilePlacements();

        var serialize = JSON.stringify(tps) + 'r' + row + 'c' + col;

        if (serialize in this.linesAtCache) {
            return this.linesAtCache[serialize];
        }

        var orig = this.tileAt(row, col, tps);

        if (typeof orig == 'undefined') return { rowLine: [], colLine: [] };

        var rowTps = this.row(row, tps);
        var colTps = this.column(col, tps);
        var rowLine = [orig];
        var colLine = [orig];
        var tile, minCol, maxCol, minRow, maxRow;

        for (var i = 1; typeof maxCol == 'undefined' ||
                        typeof minCol == 'undefined' ||
                        typeof maxRow == 'undefined' ||
                        typeof minRow == 'undefined'; i++) {
            if (typeof maxCol == 'undefined') {
                tile = this.tileAt(row, col + i, rowTps);
                if (typeof tile != 'undefined') {
                    rowLine.push(tile);
                } else {
                    maxCol = col + i;
                }
            }
            if (typeof minCol == 'undefined') {
                tile = this.tileAt(row, col - i, rowTps);
                if (typeof tile != 'undefined') {
                    rowLine.unshift(tile);
                } else {
                    minCol = col - i;
                }
            }
            if (typeof maxRow == 'undefined') {
                tile = this.tileAt(row + i, col, colTps);
                if (typeof tile != 'undefined') {
                    colLine.push(tile);
                } else {
                    maxRow = row + i;
                }
            }
            if (typeof minRow == 'undefined') {
                tile = this.tileAt(row - i, col, colTps);
                if (typeof tile != 'undefined') {
                    colLine.unshift(tile);
                } else {
                    minRow = row - i;
                }
            }
        };

        var ret = {
                rowLine: rowLine,
                colLine: colLine,
                colBounds: [[minRow, col], [maxRow, col]], 
                rowBounds: [[row, minCol], [row, maxCol]], 
               };
        this.linesAtCache[serialize] = ret;
        return ret;
    }


    this.getLines = function(row, col, coords) {
        if (coords) {
            return this.getRowLine(row, col, true).concat(this.getColLine(row, col, true));
        }
        return [this.getRowLine(row, col), this.getColLine(row, col)];
    }

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
    this.getPlayableNeighbors = function(row, col) {
        var playableNeighbors = [];
        var unplayableNeighbors = [];

        var lines = this.linesAt(row, col);

        var neighbors = lines.colBounds.concat(lines.rowBounds);

        for (var i = neighbors.length - 1; i >= 0; i--) {
            if (this.coordsPlayable(neighbors[i][_row], neighbors[i][_column])) {
                playableNeighbors.push(neighbors[i]);
            } else {
                unplayableNeighbors.push(neighbors[i]);
            }
        };

        return { playable: playableNeighbors, unplayable: unplayableNeighbors };
    }

    this.tileAt = function(row, col, tps) {

        if (typeof tps == 'undefined') tps = state.tilePlacements();

        var tp = _.flatten(tps.filter(function(tp) {
                    return tp[_row] === row && tp[_column] === col;
                }));

        return tp.length ? tp[2] : undefined;
    }


    this.placeTileValidate = function(row, col, tile) {


        if ( this.coordsIn([row, col], state.playable()) === -1) {
            console.log('coords not in playable; ' + row + ', '  + col);
            console.log(state.playable());
            return false;
        }
        
        var tps = state.tilePlacements(state.gameHistory.concat([
            state.turnHistory.concat([
                [row, col, tile]
            ])
        ]));

        var newLines = this.linesAt(row, col, tps);

        if ( !this.lineIsValid(newLines.rowLine) ||
             !this.lineIsValid(newLines.colLine) ) {
            return false;
        }
        
        return true;
    }

    this.coordsPlayable = function(row, col) {

        if (typeof this.tileAt(row, col) != 'undefined') return false;

        var upLine = this.linesAt(row - 1, col).colLine;
        var rightLine = this.linesAt(row, col + 1).rowLine;
        var downLine = this.linesAt(row + 1, col).colLine;
        var leftLine = this.linesAt(row, col - 1).rowLine;


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