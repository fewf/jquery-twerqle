window.state = require('./state');
window.board = require('./board');
window.pControls = require('./player_controls');
window.cPlayer = require('./computer_player');


exports.initDialog = function() {
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
        var label = $('<label>', { 'for': inputId }).text(label + ': ');
        var input = $('<input>', {
            type: 'number',
            id: inputId,
            value: value,
            min: min,
            max: max
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
        var ret = $('<div>', { 'class': 'slider' } ).append($(para)).append($(slider));
        return ret;
    }

    dialog.makeGame = function () {
        var numTypes = Number($('#colors-and-shapes-input').val());
        var numCopies = Number($('#tile-copies-input').val());
        // var numHumanPlayers = Number($('#human-players-input').val());
        var numComputerPlayers = Number($('#computer-players-input').val());
        var computerTypes = Number($('#computer-types-input').val());
        var noHuman = ($('#noHuman').is(':checked'));
        var players = [];
        var playerTypes = [];
        // if (numHumanPlayers + numComputerPlayers === 0) return false;

        // for (var i = 1; i <= numHumanPlayers; i++) {
        // players.push("You");
            // playerTypes.push(1);
        // }

        //type chooser
        for (var i = 1; i <= numComputerPlayers; i++) {
            if (computerTypes === 1) {
                players.push('c'+i+': '+'Baiter');
                // playerTypes.push(2);
            } else if (computerTypes === 2 || Math.random() < (1/2)) {
                players.push('c'+i+': '+'Blocker');
                // playerTypes.push(3);
            } else {
                players.push('c'+i+': '+'Baiter');
                // playerTypes.push(2);
            }
        };

        players = _.shuffle(players);
        if (!noHuman) players.unshift("You");

        for (var i = 0; i < players.length; i++) {
            if (players[i] === "Baiter") {
                playerTypes.push(2);
            } else {
                playerTypes.push(3);
            }
        };
        if (!noHuman) playerTypes.unshift(1);

        g = state.initState(players, playerTypes, numTypes, numCopies);
        if (!noHuman) g.human = g.players[0];
        g.minRow = g.center - g.numTypes * 3;
        g.maxRow = g.center + g.numTypes * 3;
        g.minCol = g.center - g.numTypes * 3;
        g.maxCol = g.center + g.numTypes * 3;
        g.columns = g.maxCol - g.minCol + 1;
        g.heldTile;
        g.zoomLevel = 50;
        g.speed = noHuman ? 2 : 1;
        board.initGame();
        this.selfDestruct();
    }

    dialog.selfDestruct = function() {
        $(this.container).remove()
    }

    dialog.controls = $('<div>', 
                            {
                            id: 'dialog-controls',
                            }
                        ).css( {
                            width: '50%',
                            margin: '0 auto'
                        })
    $(dialog.controls).append($(dialog.createSlider("Colors and Shapes", 3, 
                                                     state.maxTypes, 6)));
    $(dialog.controls).append($(dialog.createSlider("Tile Copies", 1, 100, 3)));
    // $(dialog.container).append($(dialog.createSlider("Human Players", 0, 4, 0)));
    $(dialog.controls).append($(dialog.createSlider("Computer Players", 0, 3, 1)));
    dialog.cTypes = $('<div>', { id: 'cTypes'});
    $(dialog.controls).append(dialog.cTypes);
    $(dialog.cTypes).append($('<p>').css('display', 'inline').text('Computer Type: '));
    $(dialog.cTypes).append($('<p>').css('display', 'inline').text('Twerqle-baiter').prepend($('<input>', {
            id: 'typeA',
            name: 'computer-types',
            val: 'Twerqle-baiter',
            type: 'radio'
        })));
    $(dialog.cTypes).append($('<p>').css('display', 'inline').text('Twerqle-blocker').prepend($('<input>', {
            id: 'typeB',
            name: 'computer-types',
            val: 'Twerqle-blocker',
            type: 'radio'
        })));
    $(dialog.cTypes).append($('<p>').css('display', 'inline').text('Mixed').prepend($('<input>', {
            id: 'mixed',
            name: 'computer-types',
            val: 'Mixed',
            type: 'radio'
        })));
    $(dialog.controls).append($('<p>').text('Check to watch computer play itself.').prepend($('<input>', {
            id: 'noHuman',
            type: 'checkbox'
        })));
    // $(dialog.controls)
    $(dialog.controls).append($('<input>', {
        type: 'button',
        value: 'PLAY!',
        on: {
            click: function () {
                dialog.makeGame();
            }
        }
    }));
    $(dialog.container).append($('<div>', {id: 'logo'}).css({
        width: 400,
        margin: '.5em auto'}).append($('<img>', {
        src: 'pngs/twerqle_logo.png'
        }).css({
            width: '100%',
            margin: '0 auto'
        })));
    $(dialog.container).append(dialog.controls);
    $('body').append($(dialog.container));
    $('body').css('background-color', '#ddd');

    return dialog;
}
