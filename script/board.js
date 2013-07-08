
// var viewSize = 10;
function setDroppableCells() {
    $( 'div.playable' ).droppable({
        accept: 'img.tile',
        hoverClass: function( event, ui) {
            var row = Number($(this).attr('row'));
            var col = Number($(this).attr('col'));
            var heldTileNum = Number($(g.heldTile).attr('tile'));
            if (g.testTilePlacement(heldTileNum, row, col)) {
                return 'highlight';
            }    
        },
        drop: function( event, ui ) {
            var row = Number($(this).attr('row'));
            var col = Number($(this).attr('col'));
            var heldTileNum = Number($(g.heldTile).attr('tile'));
            if (g.placeTile(heldTileNum, row, col)) {
                board.updateBoardOnMove(g.heldTile, heldTileNum, this);
            }
        },
    });
    $( 'div.playable').click(function() {
        if ($('img.selected').length > 1 || !$('img.selected').length) {
            return false;
        } else {
            var selectedTile = $('img.selected');
            var row = Number($(this).attr('row'));
            var col = Number($(this).attr('col'));
            var selectedTileNum = Number($(selectedTile).attr('tile'));
            if (g.placeTile(selectedTileNum, row, col)) {
                cPlayer.animateTilePlacement(selectedTile, this);
                $(selectedTile).removeClass('selected');
                // board.updateBoardOnMove(selectedTile, selectedTileNum, this);
            }
        }
    });
}

function setMinMax(row, col) {
    var change = false;
    if (row - g.numTypes < g.minRow) { 
        g.minRow = row - g.numTypes;
        change = true;
        board.makeRow(true);
    }
    if (row + g.numTypes> g.maxRow) {
        g.maxRow = row + g.numTypes;
        change = true;
        board.makeRow()
    }
    if (col - g.numTypes < g.minCol) {
        g.minCol = col - g.numTypes;
        change = true;
        board.makeColumn(true);
    }
    if (col + g.numTypes> g.maxCol) {
        g.maxCol = col + g.numTypes;
        change = true;
        board.makeColumn();
    }
    g.columns = g.maxCol - g.minCol + 1;
    return change;
}



exports.getCellByRowCol = function (row, col) {
    return $('div.cell[row="'+row+'"][col="'+col+'"]');
}
exports.getRowColByCell = function (cell) {
    return [ Number( $(cell).attr('row') ), Number( $(cell).attr('col') ) ];
}
function resetTurn(turnHistory) {
    var row, col;
    for (var i = g.turnHistory.length - 1; i >= 0; i--) {
        row = g.turnHistory[i][0];
        col = g.turnHistory[i][1];
        exports.getCellByRowCol(row, col).html('');
    };
    g.resetTurn();
    $('#controls > input').attr('disabled', 'disabled');
    g.midTurn = false;
    updatePlayable();
    updatePlayerBoard();
}

exports.updateBoardOnMove = function (tile, tileNum, snappedTo) {
    var coords = board.getRowColByCell(snappedTo);
    setMinMax(coords[0], coords[1]);
    $(snappedTo).html(board.getColoredShape(tileNum));
    if (g.human) $(tile).remove();
    $('#endTurn').removeAttr('disabled');
    $('#resetTurn').removeAttr('disabled');
    $('#exchangeTiles').attr('disabled', 'disabled');
    $('img.selected').removeClass('selected');
    g.midTurn = true;
    board.updatePlayable();
}

exports.updatePlayable = function() {
    $('.playable').droppable('destroy').removeClass('playable');
    for (var i = g.turnPlayable.length - 1; i >= 0; i--) {
        exports.getCellByRowCol(g.turnPlayable[i][0], g.turnPlayable[i][1]).addClass('playable');
    };
    setDroppableCells();
}



exports.updatePlayerBoard = function() {
    for (var o = 0; o < g.players.length; o++) {
        var index = (g.turn + g.startIndex + o) % g.players.length;
        $('#player' + (o + 1) + ' p').replaceWith(
            '<p>' + g.players[index].name + ' - ' + g.players[index].score + '</p>'
        );
    };
    $('div.rack').html('');
    for (var j = 0; j < g.getCurrentPlayer().tiles.length; j++) {
        var xPos = j * (g.zoomLevel + 1);
        var newTile = board.getColoredShape(g.getCurrentPlayer().tiles[j]);
        $('div.rack').append($(newTile));
        if (g.getCurrentPlayer().type > 1) $('div.rack img.tile').addClass('cblack');
    };
    pControls.setDraggableTiles();
}

function makeGridCell (row, col) {
    var ret = '';
    var classes = ['cell'];
    if (col === g.minCol - g.numTypes) classes.push('start');
    if (col === g.maxCol + g.numTypes) classes.push('end');
    if ((row + col) % 2) classes.push('alt');
    if (row === g.center && col === g.center) classes.push('center');
    var cell = $('<div>', {
        'class': classes.join(' '),
        row: row,
        col: col, 
    }).append($(board.getColoredShape(g.board[row][col])))
    return cell;
} 

exports.makeRow = function (prepend, rowNum) {
    var cell;
    if (typeof rowNum === 'undefined') {
        rowNum = prepend ? Number($('#twerqle div.row:first').attr('row')) - 1:
                           Number($('#twerqle div.row:last').attr('row')) + 1;
    }
    var row = $('<div>', {
        'class': 'row',
        id: 'row-' + rowNum,
        row: rowNum
    });
    if (!prepend) {
        $('#twerqle').append(row);
    } else {
        $('#twerqle').prepend(row);
    }
    for (var i = g.minCol; i <= g.maxCol; i++) {
        cell = makeGridCell(rowNum, i);
        row.append($(cell));
    };
    $('#twerqle').css({
        top: '-=' + (g.zoomLevel + 2) * Number(prepend)
    });
}

exports.makeColumn = function(prepend, colNum) {
    if (typeof rowNum === 'undefined') {
        colNum = prepend ? Number($('#twerqle div.row div.cell:first').attr('col')) - 1:
                           Number($('#twerqle div.row div.cell:last').attr('col')) + 1;
    }
    var row;
    for (var i = g.minRow; i <= g.maxRow; i++) {
        row = $('#row-' + i);
        if (!prepend) {
            $(row).append(makeGridCell(i, colNum));
        } else {
            $(row).prepend(makeGridCell(i, colNum));
        }
    }
    $('#twerqle').css({
        width: '+=' + (g.zoomLevel + 1),
        left: '-=' + (g.zoomLevel + 1) * Number(prepend)
    });

}

exports.drawBoard = function (){
    var toAppend, insert, data;
    $('#twerqle').empty();
    var boardWidth = g.columns * (g.zoomLevel + 1);
    var boardHeight = (g.maxRow - g.minRow) * (g.zoomLevel + 1);
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();
    var centerX = (boardWidth - windowWidth)/2;
    var centerY = (boardHeight - windowHeight)/2;
    for(var i = g.minRow; i <= g.maxRow; i++) {
        board.makeRow(false, i);
    };
    $('#twerqle').css({
        width: boardWidth,
        top: -centerY,
        left: -centerX
    });
    $('#twerqle').draggable();
    $('#twerqle').addClass('zoom' + g.zoomLevel);
}

function initPlayerBoard() {
    $('#players').append($('<div>', { id: 'player1' }));
    $('#player1').append($('<p>'));
    $('#player1').append($('<div>', { id: 'controls' }));
    $('#controls').append($('<input>', {
        id: 'endTurn',
        type: 'button',
        on: {
            click: function () {
            g.endTurn();
            updatePlayerBoard();
            updatePlayable();
            play();
            }
        },
        value: 'end turn',
        disabled: 'disabled'
    }));
    $('#controls').append($('<input>', {
        id: 'resetTurn',
        type: 'button',
        on: {
            click: function () {
            resetTurn();
            }
        },
        value: 'reset turn',
        disabled: 'disabled'
    }));
    $('#controls').append($('<input>', {
        id: 'exchangeTiles',
        type: 'button',
        on: {
            click: function () {
            exchangeTiles();
            }
        },
        value: 'exchange tiles',
        disabled: 'disabled'
    }));
    $('#player1').append($('<div>', {'class': 'rack'}));
    for (var i = 2; i <= g.players.length; i++) {
        $('#players').append($('<div>', { id: 'player' + i }));
        $('#player' + i).append($('<p>'));
    };
    board.updatePlayerBoard();
    $('div.rack img.tile').css({
        height: g.zoomLevel,
        width: g.zoomLevel
    });
}

exports.initGame = function() {
    board.drawBoard();
    initPlayerBoard();
    pControls.setupInterface();
    board.updatePlayable();
    setDroppableCells();
    pControls.play();
}


exports.getColoredShape = function(tile) {
    if (typeof tile === 'undefined') return '';
    var spacer = 12/g.numTypes,
        color = g.getColor(tile),
        shape = g.getShape(tile),
        colorClass = Math.floor(color * spacer);
    var ret = $('<img>', { 
            src: 'pngs/shape' + shape + '.png',
            'class': 'tile c' + colorClass,
            tile: tile
        });
    return ret;
}

exports.displayResult = function(result) {
    if (result[0] === 'score') {
        var announce = $('<div>', { id: 'announce' }).html(result[1] + 'pts!');
        $('body').append(announce);
        window.setTimeout(function() {
            $(announce).animate({"left": "-=2000px", "top": "-=2000px"}, 250 * g.speed, function() {
                $(this).remove();
            });
        }, 1000 * g.speed);
    } else if (result[0] === 'game over') {
        var text = "Game over! Winner(s): "
        for (var i = result[1].length - 1; i >= 0; i--) {
            text = text + result[1][i].name + ' ';
        };
        var text = text + ". Click for new game."
        var announce = $('<div>', { id: 'announce' }).text(text).click(function() {
            $(this).remove(); 
            $('#twerqle').empty();
            $('#controls').remove();
            $('#player_controls').remove();
            dialog.initDialog();
        });
        $('body').append(announce); 
    } else if (result[0] === 'exchange') {
        var announce = $('<div>', { id: 'announce' }).html('exchanged ' + result[1] + ' tiles');
        $('body').append(announce);
        window.setTimeout(function() {
            $(announce).animate({"left": "-=2000px", "top": "-=2000px"}, 500 * g.speed, function() {
                $(this).remove();
            });
        }, 1000 * g.speed);        
    }
}