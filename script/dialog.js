var state = require('./state');
var ui = require('./ui');


var initDialog = function() {
    var dialog = {};
    dialog.container = $('<div>', { id: 'dialog-container' });
    $(dialog.container).css({
        backgroundColor: '#fff',
        position: 'fixed',
        top: '10%',
        left: '10%',
        minWidth: '80%',
        height: '80%',
        borderRadius: '20px'
    });
    dialog.createSlider = function(label, min, max, value) {
        var idMaker = label.toLowerCase().replace(/\s/g, "-");
        var sliderId = idMaker + '-slider';
        var inputId = idMaker + '-input';
        var label = $('<label>', { 'for': inputId }).text(label);
        var input = $('<input>', {
            type: 'text',
            id: inputId,
            value: value
        });
        var para = $('<p>').append($(label)).append($(input));
        var slider = $('<div>', { id: sliderId });
        $(slider).slider({
            min: min,
            max: max,
            value: value,
            slide: function( event, ui ) {
                $(input).val( ui.value );
            }
        });
        var ret = $('<div>', { 'class': 'slider' } ).append($(slider)).append($(para));
        return ret;
    }

    dialog.makeGame = function () {
        var numTypes = $('#colors-and-shapes-input').val();
        var numCopies = $('#tile-copies-input').val();
        var numPlayers = $('#players-input').val();
        var players = [];
        for (var i = 1; i <= numPlayers; i++) {
            players.push("player" + i);
        }

        g = state.initState(players, numTypes, numCopies);
        g.minRow = g.center - 15;
        g.maxRow = g.center + 15;
        g.minCol = g.center - 15;
        g.maxCol = g.center + 15;
        g.heldTile;
        g.zoomLevel = 50;
        ui.initTwerqle();
    }

    dialog.selfDestruct = function() {
        $(this.container).remove()
    }

    $(dialog.container).append($(dialog.createSlider("Colors and Shapes", 2, 12, 6)));
    $(dialog.container).append($(dialog.createSlider("Tile Copies", 1, 10, 3)));
    $(dialog.container).append($(dialog.createSlider("Players", 2, 8, 4)));
    $(dialog.container).append($('<input>', {
        type: 'button',
        value: 'PLAY!',
        on: {
            click: function () {
                dialog.makeGame();
                dialog.selfDestruct();
            }
        }
    }))
    $('body').append($(dialog.container));
    $('body').css('background-color', '#ddd');

    return dialog;
}

exports.initDialog = initDialog;