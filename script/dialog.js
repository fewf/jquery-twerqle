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
        width: '80%',
        height: '80%',
        borderRadius: '20px'
    });

    dialog.createSlider = function(label, min, max, value) {
        var idMaker = label.toLowerCase().replace(/\s/g, "-");
        var sliderId = idMaker + '-slider';
        var inputId = idMaker + '-input';
        var label = $('<label>', { 'for': inputId }).text(label + ': ');
        var input = $('<input>', {
            'class': 'slider-input',
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
        var ret = $('<div>', { 'class': 'slider', id: idMaker } ).append($(para)).append($(slider));
        return ret;
    }

    dialog.makeGame = function () {
        var numTypes = Number($('#colors-and-shapes-input').val());
        var numCopies = Number($('#tile-copies-input').val());
        // var numHumanPlayers = Number($('#human-players-input').val());
        var numComputerPlayers = Number($('#computer-players-input').val());
        var computerType = Number($('input[name=computer-types]:checked').val());
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
            players.push("Computer " + i)
            playerTypes.push(computerType);
            // if (computerTypes === 1) {
            //     players.push('c'+i+': '+'Baiter');
            //     // playerTypes.push(2);
            // } else if (computerTypes === 2 || Math.random() < (1/2)) {
            //     players.push('c'+i+': '+'Blocker');
            //     // playerTypes.push(3);
            // } else {
            //     players.push('c'+i+': '+'Baiter');
            //     // playerTypes.push(2);
            // }
        };

        // players = _.shuffle(players);
        if (!noHuman) players.unshift("You");

        // for (var i = 0; i < players.length; i++) {
        //     if (players[i] === "Baiter") {
        //         playerTypes.push(2);
        //     } else {
        //         playerTypes.push(3);
        //     }
        // };
        if (!noHuman) playerTypes.unshift(0);

        g = state.initState(players, playerTypes, numTypes, numCopies);
        if (!noHuman) g.human = g.players[0];
        g.minRow = g.center - g.numTypes * numCopies;
        g.maxRow = g.center + g.numTypes * numCopies;
        g.minCol = g.center - g.numTypes * numCopies;
        g.maxCol = g.center + g.numTypes * numCopies;
        g.columns = g.maxCol - g.minCol + 1;
        g.heldTile;
        g.zoomLevel = 50;
        g.speed = noHuman ? 0.25 : 2;
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
                            width: '45%',
                            margin: '0 1em 0 0',
                            'float': 'left'
                        });

    // $(dialog.container).append($(dialog.createSlider("Human Players", 0, 4, 0)));
    $(dialog.controls).append($('<div>', {id: 'logo'}).css({
    width: 400,
    margin: '.5em auto'}).append($('<img>', {
    src: 'pngs/twerqle_logo.png'
    }).css({
        width: '100%',
        margin: '0 auto'
    })));
    $(dialog.controls).append($(dialog.createSlider("Computer Players", 0, 3, 1)));
    $(dialog.controls).append($('<input>', { id: 'showMore', type: 'button'})
                      .val('Show/hide advanced settings')
                      .click(function() {
                        $('#tile-copies').toggleClass('hidden');
                        $('#colors-and-shapes').toggleClass('hidden');
                      }));
    $(dialog.controls).append($(dialog.createSlider("Colors and Shapes", 3, 
                                                     state.maxTypes, 6)).addClass('hidden'));
    $(dialog.controls).append($(dialog.createSlider("Tile Copies", 1, 100000, 3)).addClass('hidden'));
    
    dialog.cTypes = $('<div>', { id: 'cTypes'});
    $(dialog.controls).append(dialog.cTypes);
    $(dialog.cTypes).append($('<p>').css('display', 'inline').text('Computer Type: '));
    $(dialog.cTypes).append($('<p>').css('display', 'inline').text('Easy').prepend($('<input>', {
            id: 'typeA',
            name: 'computer-types',
            val: 2,
            type: 'radio'
        })));
    $(dialog.cTypes).append($('<p>').css('display', 'inline').text('Medium').prepend($('<input>', {
            id: 'typeB',
            name: 'computer-types',
            val: 4,
            type: 'radio',
            checked: 'checked'
        })));
    $(dialog.cTypes).append($('<p>').css('display', 'inline').text('Hard').prepend($('<input>', {
            id: 'mixed',
            name: 'computer-types',
            val: 8,
            type: 'radio'
        })));
    $(dialog.cTypes).append($('<p>').css('display', 'inline').text('Evil').prepend($('<input>', {
            id: 'mixed',
            name: 'computer-types',
            val: 10,
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
    dialog.imageColumn = $('<div>', {
                            id: 'image-column',
                            }
                        ).css({
                            width: '15%',
                            margin: '0 1em 0 0',
                            'float': 'left'
                        }).append($('<img>', {src: 'pngs/turn1.png'}))
                          .append($('<img>', {src: 'pngs/turn2.png'}))
                          .append($('<img>', {src: 'pngs/turn3.png'}))
                          .append($('<img>', {src: 'pngs/turn4.png'}));

    dialog.howTo = $('<div>',
                        {
                        id: 'dialog-how',
                        }
                    ).css( {
                        width: '35%',
                        margin: '0 1em 0 0',
                        'float': 'left'
                    });

    var p1 = 'Play is very much like Scrabble, with the player making the first line going through the center of the board. However, there are no bounds to the board. Also, lines are not words made up of letters, instead they are lines of tiles that are either the same color but different shape, or same shape but different color, like in the image shown on top.';
    var p2 = 'The game continues with players making lines off the initial line, like the next image down.';
    var p3 = 'And of course you can do fancy, Scrabble-like stuff like this next move, which scores 9 points. Three for the line of ovals, and 2 each for each oval/triangle line added onto.';
    var p4 = 'There are not allowed duplicates in line, which means once you have all the colors of a certain shape, or all the shapes of a certain color in a line, that line cannot be played on anymore. The player who plays the final color or shape on a line collects a bonus equal to the total length of the line, so the 4th move scores 12.'
    var p5 = 'If you do not have a move, you can exchange your tiles. In twerqle, select each tile you want to exchange by clicking on it, and then press "exchange tiles"';
    var p6 = 'The game ends when the first player runs out of tiles. That player gets a bonus 6 points.';

    $(dialog.howTo).append($('<p>').text(p1))
                   .append($('<p>').text(p2))
                   .append($('<p>').text(p3))
                   .append($('<p>').text(p4))
                   .append($('<p>').text(p5))
                   .append($('<p>').text(p6));




    $(dialog.container).append(dialog.controls).append(dialog.howTo).append(dialog.imageColumn);
    $('body').append($(dialog.container));
    $('body').css('background-color', '#ddd');

    return dialog;
}
