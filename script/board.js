var _ = require('underscore');
var clc = require('cli-color');

var colors = [clc.red, clc.blue, clc.green, clc.yellow, clc.magenta, clc.cyan, clc.white, clc.black, clc.bgRed, clc.bgCyan, clc.bgGreen, clc.bgYellow ];
var shapes = [ '@', '#', '$', '%', '&', '*', "+", "=", "?", "\\", "8", "Z" ];


var Board = function(boardSize, state) {
    // this.grid = new Array(boardSize);
    // for (var i = 0; i < boardSize; i++) {
    //     this.grid[i] = new Array(boardSize);
    // }
    this.center = (boardSize + 1) / 2;
    this.gridCache = {};
    this.gridTime = 0;
    this.grid = function(gh) {

        var start = +new Date();
        var serial = _.flatten(gh).join('');
        if (this.gridCache[serial]) {
            var end = +new Date();
            this.gridTime += (end - start);
            return this.gridCache[serial];
        }
        var rows = _.flatten(gh.map(function(x) {
                        if ( x[0] != 'exchange') {
                            return x.map(function(y) {
                                return y[0];
                            });
                        } else {
                            return 0;
                        }
                    }));
        var cols = _.flatten(gh.map(function(x) {
                        if ( x[0] != 'exchange') {
                            return x.map(function(y) {
                                return y[1];
                            });
                        } else {
                            return 0;
                        }
                    }));

        var highRow = Math.max.apply(null, rows.length ? rows : [0]) + 2;
        var lowRow = Math.min.apply(null, rows.length ? rows : [0]) - 2;
        var highCol = Math.max.apply(null, cols.length? cols : [0]) + 2;
        var lowCol = Math.min.apply(null, cols.length? cols : [0]) - 2;

        var rowCount = highRow - lowRow + 1;
        var rowOffset = lowRow * -1;
        var colCount = highCol - lowCol + 1;
        var colOffset = lowCol * -1;

        var newgrid = new Array(rowCount);

        for (var i = 0; i < newgrid.length; i++) {
            newgrid[i] = new Array(colCount);
        };

        gh.map(function(turnHistory) {
            if (turnHistory[0] == 'exchange') return;
            turnHistory.map(function(move) {
                newgrid[move[0] + rowOffset][move[1] + colOffset] = move[2]
            });
        });
        var end = +new Date();
        this.gridTime += (end - start);
        var ret = { grid: newgrid, 'rowOffset': rowOffset, 'colOffset': colOffset };
        this.gridCache[serial] = ret;
        return ret;
    }

    this.rowMinMax = function(gh) {
        var rows = _.flatten(gh.map(function(x) {
                if ( x[0] != 'exchange') {
                    return x.map(function(y) {
                        return y[0];
                    });
                } else {
                    return 0;
                }
            }));
        return { max: Math.max.apply(null,  rows), 
                min: Math.min.apply(null, rows) };
    }

    this.row = function(rowNum, tps) {
        if (typeof tps == 'undefined') tps = state.tilePlacements();
        
        return tps.filter(function(tp) {
            return tp[0] === rowNum;
        });
    }

    this.column = function(colNum, tps) {
        if (typeof tps == 'undefined') tps = state.tilePlacements();
        
        return tps.filter(function(tp) {
            return tp[1] === colNum;
        });
    }

    this.printTile = function(tile) {
        if (typeof tile != 'number') return ' ';
        if ( typeof tile != 'number' || (tile < 0 || tile > state.numTypes*state.numTypes)) return '_'
        var color = state.getColor(tile);
        var shape = state.getShape(tile);

        return colors[color](shapes[shape]);
    }

     this.printTiles = function(tiles) {
        if (typeof tiles === 'undefined') var tiles = state.getCurrentPlay().turnTiles();
        // var printTile = this.printTile;
        return tiles.map(function(x) { return state.board.printTile(x); }).join(' ');
    }
    this.minimPrintBoard = function(offset) {

        var highRow = Math.max.apply(null, state.playableCache.map(function(x) { return x[0] })) + 1;
        var lowRow = Math.min.apply(null, state.playableCache.map(function(x) { return x[0] })) - 1;
        var highCol = Math.max.apply(null, state.playableCache.map(function(x) { return x[1] })) + 1;
        var lowCol = Math.min.apply(null, state.playableCache.map(function(x) { return x[1] })) -1;

        var row;
        var center = this.center;
        var grid = state.turnGrid();

        // if (offset) {
        //     var highRow = center + offset;
        //     var lowRow = center - offset;
        //     var highCol = center + offset;
        //     var lowCol = center - offset;            
        // } else {
        //     var highRow = Math.max.apply(null, state.playableCache.map(function(x) { return x[0] })) + 1;
        //     var lowRow = Math.min.apply(null, state.playableCache.map(function(x) { return x[0] })) - 1;
        //     var highCol = Math.max.apply(null, state.playableCache.map(function(x) { return x[1] })) + 1;
        //     var lowCol = Math.min.apply(null, state.playableCache.map(function(x) { return x[1] })) -1;

        // }
        var playable = state.playable();

        for (var i = lowRow; i <= highRow; i++) {
            row = '';
            for (var j = lowCol; j <= highCol; j++) {
                var cell;
                if ( grid[i][j] === undefined ) {
                    if ( this.coordsIn([i, j], playable) === -1 ) {
                        cell = ' ';
                    } else {
                        cell = clc.bgGreen(' ');
                    }
                } else {
                    if ( this.coordsIn([i, j], playedTiles) === -1 ) {
                        cell = this.printTile(grid[i][j]);
                    } else {
                        cell = clc.bgWhite(this.printTile(grid[i][j]));
                    }
                }
                row += cell;
            };
            console.log(row);
        };
        console.log('');
    }

    this.printBoard = function(offset) {
        var grid_pkg = state.turnGrid();
        var grid = grid_pkg.grid;
        row = '   ';
        var colNum;
        var rowNum;
        for (var i = 0; i < grid[0].length; i++) {
            colNum = i - grid_pkg.colOffset;
            row += new Array(4 - String(colNum).length).join(' ');
            row += colNum;
        };

        console.log(row);

        for (var i = 0; i < grid.length; i++) {
            row = '';
            rowNum = i - grid_pkg.rowOffset;
            row += rowNum;
            row += new Array(4 - String(rowNum).length).join(' ');
            for (var j = 0; j < grid[0].length; j++) {
                var cell;
                if ( grid[i][j] === undefined ) {
                    cell = ' ';
                } else {
                    cell = state.board.printTile(grid[i][j]);
                }
                row += '  '; 
                row += cell;
                // row += ' ';
            };
            console.log(row);
        };
        console.log('');
  
    }
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
        //console.log(state.turnGrid()[91][91]);

        var grid_pkg = state.turnGrid();
        var grid = grid_pkg.grid;

        row = row + grid_pkg.rowOffset;
        col = col + grid_pkg.colOffset;


        if (grid[row] === undefined) {
            debugger;
        }
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

    // this.linesAt = _.memoize(this.linesAtLogic); 
    this.timesCached = 0;
    this.timesCalled = 0;
    this.linesAtCache = {};
    this.linesAt = function(row, col, tps) {
        this.timesCalled++;
        if (typeof tps == 'undefined') tps = state.tilePlacements();

        var serialize = JSON.stringify(tps);

        if (serialize in this.linesAtCache) {
            return this.linesAtCache[serialize];
        }


        var orig = this.tileAt(row, col);

        if (typeof orig == 'undefined') return { row: [], col: [] };

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
        if (typeof minRow == 'undefined' ||
            typeof maxRow == 'undefined' ||
            typeof minCol == 'undefined' ||
            typeof maxCol == 'undefined') {
            debugger;
        }
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

        // var neighbors = this.getCoordNeighbors(row, col);
        // var neighbors = this.getLines(row, col, true);

        var lines = this.linesAt(row, col);

        var neighbors = lines.colBounds.concat(lines.rowBounds);


        // debugger;
        for (var i = neighbors.length - 1; i >= 0; i--) {
            if (this.coordsPlayable(neighbors[i][0], neighbors[i][1])) {
                playableNeighbors.push(neighbors[i]);
            } else {
                unplayableNeighbors.push(neighbors[i]);
            }
        };

        return [ playableNeighbors, unplayableNeighbors ];
    }

    // this.getCoordNeighbors = function(row, col) {
    //     var neighbors =     [
    //                             [row + 1, col], [row - 1, col], 
    //                             [row, col + 1], [row, col - 1]
    //                         ];
    //     return neighbors;                    
    //     // return neighbors.filter( function(x) { 
    //     //         return x[0] > 0 && x[0] < this.board.grid.length &&
    //     //                     x[1] > 0 && x[1] < this.board.grid.length;
    //     //     ;});
    // }



    // this.hasNeighbor = function(row, col) {
    //     var neighbors = this.getCoordNeighbors(row, col);
    //     for (var i = neighbors.length - 1; i >= 0; i--) {
    //         if (this.tileAt(neighbors[i][0], neighbors[i][1])) return true;
    //     };
    // }

    this.tileAt = function(row, col, tps) {

        if (typeof tps == 'undefined') tps = state.tilePlacements();

        var tp = _.flatten(tps.filter(function(tp) {
                    return tp[0] === row && tp[1] === col;
                }));

        return tp.length ? tp[2] : undefined;
    }


    this.placeTileValidate = function(row, col, tile) {


        if ( this.coordsIn([row, col], state.playable()) === -1) {
            console.log('coords not in playable; ' + row + ', '  + col);
            console.log(state.playable());
            return false;
        }
        state.turnHistory.push([row, col, tile]);

        var newLines = this.linesAt(row, col);
        // var testing = this.linesAt(row, col);

        // debugger;

        if ( !this.lineIsValid(newLines.rowLine) ) {
            state.turnHistory.pop();
            return false;
        }
        if ( !this.lineIsValid(newLines.colLine) ) {
            state.turnHistory.pop();
            return false;
        }
        state.turnHistory.pop();
        return true;
    }

    this.coordsPlayable = function(row, col) {
        // var grid_pkg = state.turnGrid();
        // var grid = grid_pkg.grid;
        // row = row + grid_pkg.rowOffset;
        // col = col + grid_pkg.colOffset;

        if (typeof this.tileAt(row, col) != 'undefined') return false;

        var upLine = this.getColLine(row - 1, col);
        var rightLine = this.getRowLine(row, col + 1);
        var downLine = this.getColLine(row + 1, col);
        var leftLine = this.getRowLine(row, col - 1);


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
        for (var i = line.length - 1; i >= 0; i--) {
            if (state.getShape(line[i]) === shape) return true;
        };
        return false;
    }

    this.lineHasColor = function(line, color) {
        for (var i = line.length - 1; i >= 0; i--) {
            if (state.getColor(line[i]) === color) return true;
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