exports.setupInterface = function() {
    initControls();
    initPlayerTable();
    initZoom();
    if (g.human) initPlayerControls();
    setDraggableTiles();
}

function initControls() {
    var controls = $('<div>', {
        id: 'controls',
    }).mouseenter(function() {
        $(this).css('opacity', 1)
    }).mouseleave(function() {
        $(this).css('opacity', 0.5)
    });
    $(controls).append($('<p>').text('Tiles left in bag: ').append($('<span>', {id: 'bagCount'}).text(g.bag.length)));
    $('body').append($(controls));
}

function initPlayerTable() {
    var playerTable = $('<table>', {id: 'playerTable'});

    playerTable.append(
        $('<tr>').append(
            $('<th>').text('name'))
                 .append(
            $('<th>').text('score'))
                 .append(
            $('<th>').text('tiles'))
        );
    for (var i = 0; i < g.players.length; i++) {
        playerTable.append(
            $('<tr>').append(
                $('<td>', { id: 'name' + i }).text(g.players[i].name))
                     .append(
                $('<td>', { id: 'score' + i }).text(g.players[i].score))
                     .append(
                $('<td>', { id: 'tiles' + i }).text(g.players[i].tiles.length))
            );
    };

    $('#controls').append($(playerTable));
}

exports.updatePlayerTable = function() {
    for (var i = 0; i < g.players.length; i++) {
        $('td#score' + i).text(g.players[i].score);
        $('td#tiles' + i).text(g.players[i].tiles.length);
    };
    $('#bagCount').text(g.bag.length)
}

function initZoom() {
    var zoomContainer = $('<div>', { id: 'zoom-container' });
    var zoom = $('<div>', { id: 'zoom' }).slider({
                    orientation: 'vertical',
                    min: 10,
                    max: 80,
                    value: 50,
                    step: 5,
                    slide: function (event, ui) {
                        var oldZoom = g.zoomLevel,
                            newZoom = ui.value;
                        g.zoomLevel = newZoom;
                        updateZoom(newZoom, oldZoom);
                    }
    });
    $(zoomContainer).append(zoom).append($('<p>').text("ZOOM"));
    $('#controls').append($(zoomContainer));
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
exports.endTurn = function(result) {
    if (g.human) board.displayResult(result);
    board.updatePlayable();
    if (g.human) pControls.updatePlayerControls();
    pControls.updatePlayerTable();
    pControls.play();
}
function initPlayerControls() {
    var playerControls = $('<div>', { id: 'player_controls'});
    var rack = $('<div>', { id: 'rack' }).width(65 * g.numTypes);
    for (var i = 0; i < g.human.tiles.length; i++) {
        var newTile = board.getColoredShape(g.human.tiles[i]);
        $(rack).append($(newTile));
    };
    $(playerControls).width(65 * g.numTypes);
    $(playerControls).append($(rack));
    playerButtons = $('<div>', { id: 'player_buttons' });
    $(playerButtons).append($('<span>', { id: 'player_score' }).text('0'));
    $(playerButtons).append($('<input>', {
        id: 'endTurn',
        type: 'button',
        on: {
            click: function () {
                var result = g.endTurn();
                pControls.endTurn(result);
            }
        },
        value: 'end turn',
        disabled: 'disabled'
    }));
    $(playerButtons).append($('<input>', {
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
    $(playerButtons).append($('<input>', {
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
    $(playerControls).append($(playerButtons));
    $('body').append($(playerControls))
}

exports.updatePlayerControls = function() {
    $('#rack').empty();
    $('#player_score').text(String(g.human.score));
    for (var i = 0; i < g.human.tiles.length; i++) {
        var newTile = board.getColoredShape(g.human.tiles[i]);
        $('#rack').append($(newTile));
    };
    setDraggableTiles();
}

function setDraggableTiles() {
    $('#rack').sortable({
        revert: 100,
        update: function () {
            // if (g.human.tiles === g.numTypes) {
                
            // }
            var tiles = [];
            var rack = $('#rack img.tile');
            for (var i = 0; i < rack.length; i++) {
                tiles.push(Number($(rack[i]).attr('tile')));
            };
            g.human.tiles = tiles;
        },
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
    $('#rack img.tile').click(function () {
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
    $('#rack img.selected').each( function () {
        tileNums.push(Number($(this).attr('tile')));
    });
    var result = g.exchangeTiles(tileNums);
    pControls.endTurn(result);
}

function resetTurn(turnHistory) {
    var row, col;
    for (var i = g.turnHistory.length - 1; i >= 0; i--) {
        row = g.turnHistory[i][0];
        col = g.turnHistory[i][1];
        board.getCellByRowCol(row, col).html('');
    };
    g.resetTurn();
    $('#controls > input').attr('disabled', 'disabled');
    g.midTurn = false;
    board.updatePlayable();
    pControls.updatePlayerControls();
}

exports.getTileByNum = function(num) {
    return $('#rack img.tile[tile="' + num + '"]:first');
}

exports.getTileByRackOrder = function(index) {
    // 1-indexed!
    return $('#rack img.tile:nth-child(' + index + ')');
}

exports.play = function() {
    g.midTurn = false;
    $('#endTurn').attr('disabled', 'disabled');
    $('#exchangeTiles').attr('disabled', 'disabled');
    $('#resetTurn').attr('disabled', 'disabled');
    if (g.getCurrentPlayer().type > 1) {
        window.setTimeout(cPlayer.play, 500 * g.gamespeed, g.getCurrentPlayer().type);
    }
}