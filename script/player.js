var _ = require('underscore');

exports.arrayIsSubset = function(array1, array2) {
    if (array1.length > array2.length) return false;
    for (var i = array1.length - 1; i >= 0; i--) {
        if (array2.indexOf(array1[i]) === -1) {
            return false;
        }
    };
    return true;
}

var Player = function(name, type, state) {
    this.name = name;
    this.type = type;
    this.score = 0;
    this.tiles = [];
    this.selectedTiles = [];

    this.turnTiles = function() {
        if (!this.isActive(state) || !state.turnHistory.length) return this.tiles.slice(0);

        var rackCopy = this.tiles.slice(0);
        var tile;
        for (var i = 0; i < state.turnHistory.length; i++) {
            tile = state.turnHistory[i][2];
            rackCopy.splice(rackCopy.indexOf(tile), 1);
        };
        return rackCopy;
    }
}

// state changing functions
Player.prototype.endTurn = function(state) {
    if ( !this.isActive(state) ) {
        return false;
    }

    if ( state.turnHistory.length ) {
        state.endScoringTurn();
    } else if ( this.selectedTiles.length ) {
        this.exchangeTiles( state, this.selectedTiles );
        state.endExchangeTurn(this.selectedTiles);
        this.selectedTiles = [];
    }
    return true;
}

Player.prototype.deselectTile = function( tile ) {
    var index = this.selectedTiles.indexOf(tile);
    if ( index === -1 ) throw 'tried to deselect tile not in selection';

    return this.selectedTiles.splice(index, 1);
}

Player.prototype.selectTile = function( state, tile ) {
    if ( !this.hasTile(tile) ) {
        throw new Error("tried to select tile not had").stack;
    }

    if ( state.turnHistory.length ) {
        this.selectedTiles = [ tile ];
    } else {
        this.selectedTiles.push(tile);
    }
    return this;
}

Player.prototype.placeSelectedTile = function( state, row, col ) {
    if ( !this.isActive(state) || this.selectedTiles.length > 1 ) return false;

    return state.tilePlace(row, col, this.selectedTiles.pop());
}
Player.prototype.hasTile = function(tile) {
    return this.turnTiles().indexOf(Number(tile)) !== -1;
}

Player.prototype.hasTiles = function(tiles) {
        var rack = this.turnTiles();
    for (var i = tiles.length - 1; i >= 0; i--) {
        if (rack.indexOf(tiles[i]) === -1) {
            return false;
        }
        rack.splice(rack.indexOf(tiles[i]), 1);
    };

        return true;
}

Player.prototype.isActive = function(state) {
    return state.getCurrentPlayer() === this;
}
// Player.prototype.turnTiles = function(state) {
//     if (!this.isActive(state) || !state.turnHistory.length) return this.tiles;

//     var rackCopy = this.tiles.slice(0);
//     var tile;
//     for (var i = 0; i < state.turnHistory.length; i++) {
//         tile = state.turnHistory[i][2];
//         rackCopy.splice(rackCopy.indexOf(tile), 1);
//     };
//     return rackCopy;
// }

Player.prototype.drawTiles = function(state, count) {
    // can't send state.bag directly, mutation won't take.
    count = Math.min(state.bag.length, count);
    var playerTileCount = this.tiles.length;

    this.tiles = this.tiles.concat(_.take(state.bag, count));
    state.bag = _.drop(state.bag, count);

    if (this.tiles.length !== playerTileCount + count) 
        throw 'Somehow ended up with ' + this.tiles.length + ' tiles.';

    return true;
}

Player.prototype.exchangeTiles = function(state, selectedTiles) {
    if ( state.turnHistory.length ||
         !this.hasTiles(selectedTiles, state) ||
         state.bag.length < selectedTiles.length) return false;

    if ( !this.drawTiles(state, selectedTiles.length) ) throw 'draw tiles failed';
    if ( !this.returnTiles(state, selectedTiles) ) throw 'return tiles failed';
    
    return true;
}

Player.prototype.returnTiles = function(state, selectedTiles) {
    if (!selectedTiles.length) return false;
    for (var i = selectedTiles.length - 1; i >= 0; i--) {
        this.removeTile(selectedTiles[i]);
        state.bag.push(selectedTiles[i]);
    };
    state.bag = _.shuffle(state.bag);

    return true;
}

Player.prototype.removeTile = function(tile) {
    if (this.tiles.indexOf(tile) === -1) {
        throw new Error('hasnt tile').stack;
    }

    return this.tiles.splice(this.tiles.indexOf(tile), 1);
}

Player.prototype.getAllLinesInRack = function(state) {
    // takes list of tile values, returns all lines which are not subsets
    // of other found lines.

    var lines = [];
    var tiles = _.uniq(this.tiles);


    for (var i = 0; i < state.numTypes; i++) {
        lines.push(tiles.filter(
            function (x) { return state.getShape(x) === i; }));
        lines.push(tiles.filter(
            function (x) { return state.getColor(x) === i; }));
    }
    lines = lines.filter(function (x) { return x.length > 0; } );
    var linesCopy = state.copy2dArray(lines);
    var testLine;

    outer:
    for (var i = lines.length - 1; i >= 0; i--) {
        testLine = lines[i];
        inner:
        for (var j = 0; j < linesCopy.length; j++) {
            if ( i === j ) continue inner;
            if ( exports.arrayIsSubset(testLine, linesCopy[j])) {
                linesCopy.splice(i, 1);
                continue outer;
            }
        };
    };
    return linesCopy;
}

Player.prototype.getLongestLine = function(state) {
        
    var lines = this.getAllLinesInRack(state);

    var linesLengths = lines.map(function (x) { return x.length; });

    var maxLine = Math.max.apply(Math, linesLengths);

    return lines[linesLengths.indexOf(maxLine)];
}




exports.Player = Player;