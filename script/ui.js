
// var viewSize = 10;




function setDroppableCells() {
    $( "div.playable" ).droppable({
        accept: 'img.tile',
        hoverClass: "highlight",
        drop: function( event, ui ) {
            // console.log("droppable drop");
            var row = Number($(this).attr("row"));
            var col = Number($(this).attr("col"));
            var heldTileNum = Number($(g.heldTile).attr("tile"));
            if (g.placeTile(heldTileNum, row, col)) {
                updateTwerqle(g.heldTile, heldTileNum, this);
            }
        },
        // activate: function (event, ui) { console.log("droppable activate"); },
        // create: function (event, ui) { console.log("droppable create"); },
        // deactivate: function (event, ui) { console.log("droppable deactivate"); },
        // out: function (event, ui) { console.log("droppable out"); },
        // over: function (event, ui) { console.log("droppable over"); }
    });
}

function setMinMax(row, col) {
    var change = false;
    if (row < g.minRow) { g.minRow = row; change = true; }
    if (row > g.maxRow) { g.maxRow = row; change = true; }
    if (col < g.minCol) { g.minCol = col; change = true; }
    if (col > g.maxCol) { g.maxCol = col; change = true; }
    return change;
}

function setDraggableTiles() {
    $('div.rack').sortable({
        revert: true,
        start: function(event, ui) { 
            // console.log("sortable start");
            g.heldTile = ui.item; 
        },
        stop: function (event, ui) {
            // console.log("sortable stop");
            $(ui.item).css({
                height: 50,
                width: 50,
                opacity: 1.0
            });
        },
        over: function (event, ui) {
            // console.log("sortable over");
            $(ui.item).css({
                height: 50,
                width: 50,
                opacity: 1.0
            });
        },
        out: function(event, ui) {
            // console.log("sortable out");
            $(ui.item).css({
                height: g.zoomLevel,
                width: g.zoomLevel,
                opacity: 0.7
            });
        },
        activate: function(event, ui) { 
            console.log("sort activate"); 
            }, 
        beforeStop: function (event, ui) { 
            console.log("sortable beforeStop"); 
            },
        change: function (event, ui) { 
            console.log("sortable change"); 
            },
        create: function (event, ui) { 
            console.log("sortable create"); 
            },
        deactivate: function (event, ui) { 
            console.log("sortable deactivate"); 
            },
        receive: function (event, ui) { 
            console.log("sortable receive"); 
            },
        remove: function (event, ui) { 
            console.log("sortable remove"); 
            },
        sort: function (event, ui) { 
            console.log("sortable sort"); 
            },
        update: function (event, ui) { 
            console.log("sortable update");
            }
    });
    $('div.rack img.tile').dblclick(function () {
        $(this).toggleClass('exchange');
    });
}

function exchangeTiles() {
    var tileNums = [];
    $('div.rack img.exchange').each( function () {
        tileNums.push(Number($(this).attr('tile')));
    });
    g.exchangeTiles(tileNums);
    updatePlayerBoard();
}

exports.getCellByRowCol = function(row, col) {
    return $('div.grid[row="'+row+'"][col="'+col+'"]');
}
function getRowColByCell(cell) {
    return [ Number( $(cell).attr('row') ), Number( $(cell).attr('col') ) ];
}
function resetTwerqle(turnHistory) {
    var row, col;
    for (var i = g.turnHistory.length - 1; i >= 0; i--) {
        row = g.turnHistory[i][0];
        col = g.turnHistory[i][1];
        exports.getCellByRowCol(row, col).html("");
    };
    g.resetTurn();
    updatePlayable();
    updatePlayerBoard();
}

function updateTwerqle(tile, tileNum, snappedTo) {
    var coords = getRowColByCell(snappedTo);
    var dimChange = setMinMax(coords[0], coords[1]);
    $(snappedTo).html(getColoredShape(tileNum));
    $(tile).remove();
    // $(snappedTo).addClass('zoom' + g.zoomLevel)
    // $(snappedTo).children().css({
    //     height: g.zoomLevel,
    //     width: g.zoomLevel
    // });
    if (dimChange) drawBoard();
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
        var xPos = j * (g.zoomLevel + 2);
        var newTile = getColoredShape(g.getCurrentPlayer().tiles[j]);
        $('div.rack').append($(newTile));
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
    // boardWidth = ((viewSize * 2) + 1) * (newZoom + 2)
    var boardWidth = (g.maxCol - g.minCol + 3) * (newZoom + 2);
    var boardHeight = (g.maxRow - g.minRow + 3) * (newZoom + 2);
$('#twerqle').removeClass('zoom' + oldZoom).addClass('zoom' + newZoom);
    // $('div.grid img.tile').removeClass('zoom' + oldZoom).addClass('zoom' + newZoom);
    // $('div.grid').css({
    //     height: newZoom,
    //     minWidth: newZoom
    // });
    // $('div.grid img.tile').css({
    //     height: newZoom,
    //     width: newZoom
    // });
    $('#twerqle').css({ 
        width: boardWidth, 
        top: newTop, 
        left: newLeft 
    });
}

function setZoom() {
    $('#zoom').slider({
        orientation: "vertical",
        min: 20,
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
    var ret = "";
    var classes = ['grid'];
    if (col === g.minCol - 1) classes.push('start');
    if (col === g.maxCol + 1) classes.push('end');
    if ((row + col) % 2) classes.push('alt');
    if (row === g.center && col === g.center) classes.push('center');
    var cell = $('<div>', {
        'class': classes.join(' '),
        row: row,
        col: col, 
    }).append($(getColoredShape(g.board[row][col])))
    $('#twerqle').append($(cell));
} 

function drawBoard() {
    
    var toAppend, insert, data;
    $('#twerqle').empty();
    var boardWidth = (g.maxCol - g.minCol + 3) * (g.zoomLevel + 2);
    var boardHeight = (g.maxRow - g.minRow + 3) * (g.zoomLevel + 2);
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();
    var centerX = (boardWidth - windowWidth)/2;
    var centerY = (boardHeight - windowHeight)/2;
    for(var i = g.minRow - 1; i <= g.maxRow + 1; i++) {
        for (var j = g.minCol - 1; j <= g.maxCol + 1; j++) { 
            makeGridCell(i, j);
        };
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
    $('#player1').append($('<p></p>'));
    $('#player1').append($('<div>', { id: 'controls' }));
    $('#controls').append($('<input>', {
        type: "button",
        on: {
            click: function () {
            g.endTurn();
            updatePlayerBoard();
            updatePlayable();
            }
        },
        value: "end turn"
    }));
    $('#controls').append($('<input>', {
        type: "button",
        on: {
            click: function () {
            resetTwerqle();
            }
        },
        value: "reset turn"
    }));
    $('#controls').append($('<input>', {
        id: 'hello',
        type: "button",
        on: {
            click: function () {
            exchangeTiles();
            }
        },
        value: "exchange tiles"
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
}

function getColoredShape(tile) {
    if (typeof tile === "undefined") return "";
    var spacer = 12/g.numTypes,
        color = g.getColor(tile),
        shape = g.getShape(tile),
        colorClass = Math.floor(color * spacer),
        shapeNumber = Math.floor(shape * spacer);
    var ret = $('<img>', { 
            src: 'pngs/shape' + shape + '.png',
            'class': 'tile c' + colorClass,
            tile: tile
        });
    return ret;
}

exports.getTileByRackOrder = function(index) {
    return $('div.rack img.tile:nth-child(' + index + ')');
}

exports.animateTilePlacement = function(tile, cell) {
    $(tile).position({my: 'top left', at: 'top left', of: cell, using: function(css, calc) {
        $(this).animate(css, 500, "linear", function() {
            var row = Number($(cell).attr("row"));
            var col = Number($(cell).attr("col"));
            var heldTileNum = Number($(this).attr("tile"));
            if (g.placeTile(heldTileNum, row, col)) {
                updateTwerqle(tile, heldTileNum, cell);
            }
        });
    }})
}