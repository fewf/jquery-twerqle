exports.play = function(type) {
    var move = g.computerPlay(type);
    if (move[0] === 'play') {
        var moves = move[1];
        for (var i = 0; i < moves.length; i+=3) {
            var tileNum = Number(moves[i]);
            var row = Number(moves[i+1]);
            var col = Number(moves[i+2]);
            var cell = board.getCellByRowCol(row, col);
            g.placeTile(tileNum, row, col);
            if (g.human) {
                var tile = cPlayer.makeTile(tileNum);
                cPlayer.animateTilePlacement(tile, cell);
            } else {
                $(cell).append(board.getColoredShape(tileNum));
                board.updateBoardOnMove(undefined, tileNum, cell);
            }
        };
        window.setTimeout(function() {
            var result = g.endTurn();
            pControls.endTurn(result);
        }, 250 * g.speed)
    } else {
        $('div.rack img.tile').addClass('selected');
        cPlayer.exchangeTiles();
    }
}

exports.makeTile = function(tileNum) {
    var tile = board.getColoredShape(tileNum);
    var compPlayers = g.players.filter(function(x) { return Boolean(x.type); } );
    for (var i = 0; i <= compPlayers.length; i++) {
        if (g.getCurrentPlayer().name === compPlayers[i].name) break;
    };
    $(tile).addClass('computer' + (i + 1) + 'Tile');
    $('body').append($(tile));
    return tile;
}

exports.exchangeTiles = function() {
    var result = g.exchangeTiles(g.getCurrentPlayer().tiles);
    pControls.endTurn(result);
}

exports.animateTilePlacement = function(tile, cell) {
    $(tile).position({my: 'top left', at: 'top left', of: cell, using: function(css, calc) {
        $(this).animate(css, 250 * g.speed, 'linear', function() {
            var heldTileNum = Number($(this).attr('tile'));
            board.updateBoardOnMove(tile, heldTileNum, cell);
        });
    }})
}