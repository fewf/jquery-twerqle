
// var viewSize = 10;
function setDroppableCells() {
    $( 'div.playable' ).droppable({
        accept: 'img.tile',
        hoverClass: 'highlight',
        drop: function( event, ui ) {
            var row = Number($(this).attr('row'));
            var col = Number($(this).attr('col'));
            var heldTileNum = Number($(g.heldTile).attr('tile'));
            if (g.placeTile(heldTileNum, row, col)) {
                updateTwerqle(g.heldTile, heldTileNum, this);
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
            var selectedTileNum = Number($('img.selected').attr('tile'));
            if (g.placeTile(selectedTileNum, row, col)) {
                updateTwerqle(selectedTile, selectedTileNum, this);
            }
        }
    });
}

function setMinMax(row, col) {
    var change = false;
    if (row - g.numTypes < g.minRow) { 
        g.minRow = row - g.numTypes;
        change = true;
        ui.makeRow(true);
    }
    if (row + g.numTypes> g.maxRow) {
        g.maxRow = row + g.numTypes;
        change = true;
        ui.makeRow()
    }
    if (col - g.numTypes < g.minCol) {
        g.minCol = col - g.numTypes;
        change = true;
        ui.makeColumn(true);
    }
    if (col + g.numTypes> g.maxCol) {
        g.maxCol = col + g.numTypes;
        change = true;
        ui.makeColumn();
    }
    g.columns = g.maxCol - g.minCol + 1;
    return change;
}

function setDraggableTiles() {
    $('div.rack').sortable({
        revert: 500,
        start: function(event, ui) { 
            g.heldTile = ui.item; 
        },
        stop: function (event, ui) {
            $(ui.item).css({
                height: 50,
                width: 50,
                opacity: 1.0
            }).removeClass('selected');
        },
        over: function (event, ui) {
            $(ui.item).css({
                height: 50,
                width: 50,
                opacity: 1.0
            });
        },
        out: function(event, ui) {
            $(ui.item).css({
                height: g.zoomLevel,
                width: g.zoomLevel,
                opacity: 0.7
            });
        },
    });
    $('div.rack img.tile').click(function () {
        if (g.midTurn) {
            $('img.selected').removeClass('selected');
            $(this).addClass('selected');
        } else {
            $(this).toggleClass('selected');
            if ($('img.selected').length) {
                $('#exchangeTiles').removeAttr('disabled');
            } else {
                $('#exchangeTiles').attr('disabled', 'disabled');
            }
        }
    });
}

function exchangeTiles() {
    var tileNums = [];
    $('div.rack img.selected').each( function () {
        tileNums.push(Number($(this).attr('tile')));
    });
    g.exchangeTiles(tileNums);
    updatePlayerBoard();
    play();
}

exports.getCellByRowCol = function(row, col) {
    return $('div.cell[row="'+row+'"][col="'+col+'"]');
}
function getRowColByCell(cell) {
    return [ Number( $(cell).attr('row') ), Number( $(cell).attr('col') ) ];
}
function resetTwerqle(turnHistory) {
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

function updateTwerqle(tile, tileNum, snappedTo) {
    var coords = getRowColByCell(snappedTo);
    var dimChange = setMinMax(coords[0], coords[1]);
    $(snappedTo).html(getColoredShape(tileNum));
    $(tile).remove();
    $('#endTurn').removeAttr('disabled');
    $('#resetTurn').removeAttr('disabled');
    $('#exchangeTiles').attr('disabled', 'disabled');
    $('img.selected').removeClass('selected');
    g.midTurn = true;
    updatePlayable();
}

function updatePlayable() {
    $('.playable').droppable('destroy').removeClass('playable');
    for (var i = g.turnPlayable.length - 1; i >= 0; i--) {
        exports.getCellByRowCol(g.turnPlayable[i][0], g.turnPlayable[i][1]).addClass('playable');
    };
    setDroppableCells();
}



function updatePlayerBoard() {

    for (var o = 0; o < g.players.length; o++) {
        var index = (g.turn + g.startIndex + o) % g.players.length;
        $('#player' + (o + 1) + ' p').replaceWith(
            '<p>' + g.players[index].name + ' - ' + g.players[index].score + '</p>'
        );
    };

    $('div.rack').html('');
    for (var j = 0; j < g.getCurrentPlayer().tiles.length; j++) {
        // var xPos = j * (g.zoomLevel + 1);
        var newTile = getColoredShape(g.getCurrentPlayer().tiles[j]);
        $('div.rack').append($(newTile));
        if (g.getCurrentPlayer().type > 1) $('div.rack img.tile').addClass('cblack');
    };

    setDraggableTiles();
}

function updateZoom(newZoom, oldZoom) {
    var oldTop = parseInt($('#twerqle').css('top'), 10);
    var oldLeft = parseInt($('#twerqle').css('left'), 10);
    var wh = $(window).height();
    var ww = $(window).width();
    var oldGridPosY = wh/2 - oldTop;
    var oldGridPosX = ww/2 - oldLeft;
    var newGridPosY = oldGridPosX * (newZoom/oldZoom);
    var newGridPosX = oldGridPosY * (newZoom/oldZoom);
    var newTop = wh/2 - newGridPosY;
    var newLeft = ww/2 - newGridPosX;
    var boardWidth = g.columns * (newZoom + 1);
    // var boardHeight = (g.maxRow - g.minRow + 1 * 2) * (newZoom + 2);
$('#twerqle').removeClass('zoom' + oldZoom).addClass('zoom' + newZoom);
    $('#twerqle').css({ 
        width: boardWidth, 
        top: newTop, 
        left: newLeft 
    });
}

function setZoom() {
    $('#zoom').slider({
        orientation: 'vertical',
        min: 10,
        max: 80,
        value: 50,
        step: 5,
        slide: function (event, ui) {
            console.log(event.type);
            var oldZoom = g.zoomLevel,
                newZoom = ui.value;
            g.zoomLevel = newZoom;
            updateZoom(newZoom, oldZoom);
        }
    });
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
    }).append($(getColoredShape(g.board[row][col])))
    return cell;
} 

exports.makeRow = function(prepend, rowNum) {
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

function drawBoard() {
    var toAppend, insert, data;
    $('#twerqle').empty();
    var boardWidth = g.columns * (g.zoomLevel + 1);
    var boardHeight = (g.maxRow - g.minRow) * (g.zoomLevel + 1);
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();
    var centerX = (boardWidth - windowWidth)/2;
    var centerY = (boardHeight - windowHeight)/2;
    for(var i = g.minRow; i <= g.maxRow; i++) {
        ui.makeRow(false, i);
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
            resetTwerqle();
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
    updatePlayerBoard();
    $('div.rack img.tile').css({
        height: g.zoomLevel,
        width: g.zoomLevel
    });
}

exports.initTwerqle = function() {
    drawBoard();
    initPlayerBoard();
    setDroppableCells();
    updatePlayable();
    setZoom();
    play();
}

function play() {
    g.midTurn = false;
    if (g.getCurrentPlayer().type > 1) {
        window.setTimeout(computerPlay, 100, g.getCurrentPlayer().type);
    }
}

function getColoredShape(tile) {
    if (typeof tile === 'undefined') return '';
    var spacer = 12/g.numTypes,
        color = g.getColor(tile),
        shape = g.getShape(tile),
        colorClass = Math.floor(color * spacer),
        shapeNumber = Math.floor(shape * spacer);
    var ret = $('<img>', { 
            src: 'pngs/shape' + shapeNumber + '.png',
            'class': 'tile c' + colorClass,
            tile: tile
        });
    return ret;
}

exports.getTileByRackOrder = function(index) {
    // 1-indexed!
    return $('div.rack img.tile:nth-child(' + index + ')');
}

exports.getTileByNum = function(num) {
    return $('div.rack img.tile[tile="' + num + '"]:first');
}

exports.animateTilePlacement = function(tile, cell, last) {
    $(tile).position({my: 'top left', at: 'top left', of: cell, using: function(css, calc) {
        $(this).removeClass('cblack');
        $(this).animate(css, 250, 'linear', function() {
            var row = Number($(cell).attr('row'));
            var col = Number($(cell).attr('col'));
            var heldTileNum = Number($(this).attr('tile'));
            if (g.placeTile(heldTileNum, row, col)) {
                updateTwerqle(tile, heldTileNum, cell);
            }
            if (last) $('#endTurn').click();
        });
    }})
}

function computerPlay(type) {
    var move = g.computerPlay(type);
    if (move[0] === 'play') {
        var moves = move[1];
        for (var i = 0; i < moves.length; i+=3) {
            var tile = ui.getTileByNum(moves[i]);
            var cell = ui.getCellByRowCol(moves[i+1], moves[i+2]);
            var last = moves.length === i + 3;
            ui.animateTilePlacement(tile, cell, last);
        };
    } else {
        $('div.rack img.tile').addClass('selected');
        exchangeTiles();
    }
}

exports.initializeControls = function() {
    $('#dialog').remove()
    $('#twerqle').draggable();
    $('#twerqle').addClass('zoom20');
    setZoom();
}