var twq = require('./state');
var Board = require('./board');
var clc = require('cli-color');
var readline = require('readline');
var _ = require('underscore');

var colors = [clc.redBright, clc.blueBright, clc.greenBright, clc.yellowBright, clc.magentaBright, clc.cyanBright, clc.whiteBright, clc.blackBright, clc.bgRedBright, clc.bgCyanBright, clc.bgGreenBright, clc.bgYellowBright];
var shapes = [ '@', '#', '$', '%', '&', "O", "+", "=", "?", "\\", '*', "Z" ];
var numTypes = 6;
var copies = 1;
var error = clc.red;
var success = clc.green;

var stringRepeat = function(times, string) {
    if (typeof string != 'string') string = ' ';
    if (typeof times != 'number' || !times) return '';

    return new Array(times + 1).join(string);
}

var printCell = function(state, cell, coords, width, bgColor) {
    if (typeof bgColor !== 'function') bgColor = clc.bgWhite;

    if (typeof cell === 'undefined') {
        var pIndex = coords.in(state.playable()) + 1;
        ret = pIndex ? stringRepeat(width - String(pIndex).length, ' ') + clc.blackBright(String(pIndex)) : 
                               stringRepeat(width, ' ');
        return (coords.y + coords.x) % 2 ? clc.bgWhite(ret) : clc.bgWhiteBright(ret);
    } else { 

        // ret = bgColor(stringRepeat(width - 2, ' '));
        var padder;
        if (state.gameHistory.length && state.gameHistory[state.gameHistory.length - 1][0] !== 'exchange' && coords.in(state.gameHistory[state.gameHistory.length - 1]) != -1) {
            padder = clc.bgRed(' ');
        } else if (coords.in(state.turnHistory) != -1) {
            padder = clc.bgGreen(' ');
        } else {
            padder = clc.bgBlack(' ');
        }
        return padder + clc.bgBlack(colors[state.getColor(cell)](shapes[state.getShape(cell)])) + padder;
    }

    
}

var printTile = function(state, tile, bgColor) {
    if (typeof tile != 'number' || tile < 0 || tile > state.numTypes*state.numTypes) {
        return typeof bgColor == 'function' ? bgColor(' ') : ' ';
    }
    var color = state.getColor(tile);
    var shape = state.getShape(tile);

    if (typeof bgColor == 'function') return bgColor(colors[color](shapes[shape]));
    return colors[color](shapes[shape]);
}

var printTiles = function(state, tiles) {
    if (typeof tiles === 'undefined') var tiles = state.getCurrentPlay().tiles;

    return tiles.map(function(x) { return printTile(state, x); }).join(' ');
}

var printBoard = function(state, gridPkg, cellWidth) {
    if (typeof gridPkg == 'undefined') gridPkg = state.board.grid();
    if (typeof cellWidth == 'undefined') cellWidth = 3;
    var grid = gridPkg.grid;

    var colNum;
    var rowNum;
    var cell;
    var coords;
    var lines = []

    // add columns index
    var rowColumnSpacer = stringRepeat(cellWidth, ' ');
    var line = rowColumnSpacer;
    for (var i = 0; i < grid[0].length; i++) {
        colNum = i - gridPkg.colOffset;
        line +=stringRepeat(cellWidth - String(colNum).length, ' ') + colNum;
    };

    var lineLength = line.length;
    lines.push(line);


    var pIndex;
    for (var i = grid.length - 1; i >= 0; i--) {

        // lines.push(rowColumnSpacer + clc.bgWhiteBright(stringRepeat(lineLength - cellWidth - 2), ' '));

        rowNum = i - gridPkg.rowOffset;
        line = stringRepeat(cellWidth - String(rowNum).length, ' ');
        line += rowNum;
        for (var j = 0; j < grid[0].length; j++) {
            coords = new Board.Coordinates(j - gridPkg.colOffset, rowNum);
            line += printCell(state, grid[i][j], coords, cellWidth)
        };
        lines.push(line);

    };

    return lines.join('\n');

}



var rl = readline.createInterface(process.stdin, process.stdout);

var gameBuilder = function(finalCallback) {
    var qtys = [{qtyName: 'humans', default: 1, min: 0, max: 1},
                {qtyName: 'bots', default: 1, min: 0, max: 3},
                {qtyName: 'types', default: 6, min: 1, max: 12},
                {qtyName: 'copies', default: 3, min: 1, max: 10}];
    // var gameSpecs = {};

    // callback generator
    qtys.map(function(x, i) {
        // create a new array where each item is a function taking one argument (being the answer from readline.question)...
        x.callback = function(answer) {
            // all answers are asking for qty, so check input is numeric
            answer = answer ? answer : x.default;
            if (isNaN(Number(answer)) || Number(answer) > x.max || Number(answer) < x.min) {
                // initial question or loop back around if input's no good
                if (answer != 'initial') console.log('Huh? Try that again.');
                var qty = x;
            } else {
                // set game param to input value, 0 or blank string goes to default
                x.qty = Math.floor(Number(answer)) || x.default;
                // if last qty, call finalCallback provided.
                if (i == qtys.length - 1) {
                    return finalCallback(twq.initState(_.range(_.findWhere(qtys, {qtyName: 'bots'}).qty + _.findWhere(qtys, {qtyName: 'humans'}).qty).map(function(x) { return 'p' + (x + 1); }),
                                      [_.findWhere(qtys, {qtyName: 'humans'}).qty ? 0 : 10].concat(_.range(_.findWhere(qtys, {qtyName: 'bots'}).qty).map(function() { return 10; })), 
                                      _.findWhere(qtys, {qtyName: 'types'}).qty , 
                                      _.findWhere(qtys, {qtyName: 'copies'}).qty));                    
                    // return finalCallback(twq.initState(_.range(_.findWhere(qtys, {qtyName: 'bots'}).qty + 1).map(function(x) { return 'p' + (x + 1); }),
                    //                   [0].concat(_.range(_.findWhere(qtys, {qtyName: 'bots'}).qty).map(function() { return 10; })), 
                    //                   _.findWhere(qtys, {qtyName: 'types'}).qty , 
                    //                   _.findWhere(qtys, {qtyName: 'copies'}).qty));
                } else {
                    // advance to next question.
                    var qty = qtys[i + 1];
                }
            }   

            rl.question('How many ' + qty.qtyName + '? ' + qty.min + '-' + qty.max + ' (default:' + qty.default + ') ', qty.callback);
        }

    });

    qtys[0].callback('initial');

}

var gamePlayer = function(game) {

    var showTiles = function(tiles) {
        if (typeof tiles === 'undefined') tiles = game.getCurrentPlayer().tiles;
        console.log(printTiles(game, tiles));
        console.log(tiles.map(function(x, i) {return '|'; }).join(' '));
        console.log(tiles.map(function(x, i) {return String(i + 1); }).join(' '));
    }

    var helpMsg = function() {
        var lines = [];
        lines.push('TILE PLACEMENT:');
        lines.push('    To place a tile, enter with the format "X Y", where X is the number');
        lines.push('    representing the tile you want to place and Y is the number');
        lines.push('    representing the position on the board.');
        lines.push('');
        lines.push('    FOR EXAMPLE: 3 1 would place your 3rd tile in the 1st position on');
        lines.push('    the board');
        lines.push('');
        lines.push('    When you have finished placing all the tiles you wish to place,');
        lines.push('    enter "end". If you would like to start your turn over, enter');
        lines.push('    "reset"');
        lines.push('');    
        lines.push('TILE EXCHANGE:');
        lines.push('    To exchange one or more tiles, enter "exc X [Y Z...]" where X');
        lines.push('    (and Y and Z and so forth) are numbers representing tiles in');
        lines.push('    your hand.');
        lines.push('');
        lines.push('    FOR EXAMPLE: exc 1 3 4 would exchange the 1st, 3rd and 4th tiles in');
        lines.push('    your hand.');
        lines.push('');
        lines.push('SEE THIS MESSAGE AGAIN: enter "help"');


        return lines.join('\n');
    }

    var showTurnScore = function() {
        console.log('Turn score: ' + game.scoreTurn(game.moveLines()));
    }

    var showScores = function() {
        var plyrs = game.players;
        var widestScore = String(_.max(plyrs, function(player) { return player.score; }).score).length;

        var cellWidth = widestScore > 4 ? widestScore : 4;

        var lines = [];

        function formatCell(cellText) {
            return stringRepeat(cellWidth - String(cellText).length, ' ') + cellText;
        }

        function formatRow(row) {
            return row.join(' | ');
        }
        lines.push('');
        lines.push('SCORES:');
        lines.push('');
        lines.push(formatRow(_.pluck(plyrs, 'name').map(formatCell)));
        lines.push(stringRepeat(lines[lines.length - 1].length, '-'));
        lines.push(formatRow(_.pluck(plyrs, 'score').map(formatCell)));

        console.log(lines.join('\n'));
    }

    var botTurn = function() {
        var player = game.getCurrentPlayer();
        var move = game.computerPlay();
        if (move[0] === 'play') {

            for (var i = 0; i < move[1].length; i++) {
                if(!player.selectTile(game, move[1][i].tile).placeSelectedTile(game, move[1][i].coords)) {
                    throw 'Bot failed.';
                }
            };

            endScoringTurn(player);
        } else {
            player.selectedTiles = move[1];
            endTurn(player);
        }
    }

    var endScoringTurn = function(player) {
        if (game.turnHistory.length) {
            console.log(player.name + ' scores ' + game.scoreTurn(game.moveLines()) + ' points');
            endTurn(player);
        } else {
            console.log('Cannot end turn without placing any tiles or exchanging tiles. Enter "help" for help.');
        }
    }

    var endTurn = function(player) {
        player.endTurn(game);



        advanceTurn();
        
    }

    var advanceTurn = function() {
        showScores();
        console.log(printBoard(game));
        if (game.gameOver()) {
            console.log('Game over!');
            showScores();
            var winningScore = _.max(game.players, function(player) { return player.score; }).score;
            var winners = _.where(game.players, {score: winningScore});
            console.log('Winners: ' + _.pluck(winners, 'name'));
            rl.close();
        } else if (game.getCurrentPlayer().type > 0) {
            botTurn(game);
        } else {
            showTiles();
        }       
    }

    var exchange = function(params, player) {
        var excTiles = params.split(/\s+/).map(function(x) {return Number(x) - 1; }).sort();

        // handle errors
        if (_.uniq(excTiles).length == excTiles.length) {
            return console.log(error('Exchange parameters contains duplicates.'));
        }

        if (excTile.filter(function(x) { return isNaN(x) || x < 0 || x > player.tiles.length - 1; }).length) {
            return console.log(error('Exchange parameters badly formatted. Enter "help" for help.'));
        }

        // success
        // while (excTiles.length) {
        //     player.selectTile(game, player.tiles[excTiles.pop() - 1]);
        // }
        player.selectedTiles = excTiles.map(function(i) { return player.tiles[i]; });
        
        console.log(player.name + ' exchanges ' + excTiles.length + ' tiles.');
        endTurn(player);


    }
    var reset = function(player) {
        game.resetTurn();
        player.selectedTiles = [];
        showTiles();
        console.log(printBoard(game));
    }

    var sort = function(by, player) {
        player.tiles = player.sortTilesBy(by, game);
        showTiles();
    }
    var moveRegex = /^(\d+) (\d+)$/;

    var routeInput = function(input) {
        input = input.trim();
        var matches = input.match(moveRegex);
        var player = game.getCurrentPlayer();

        if (matches == null) {
            routeLine(input, player);
        } else {
            resolveTilePlacement(matches, player);
        }


        rl.prompt();
    }



    var resolveTilePlacement = function(matches, player) {
        // user options are 1-indexed; adjust to zero-indexed data.
        var tile = Number(matches[1]) - 1;
        var coords = Number(matches[2]) - 1;

        if (isNaN(tile) || isNaN(coords)) {
            console.log('Input are not valid numbers.');
        } else if (tile >= player.tiles.length || coords >= game.playable().length) {
            console.log('input out of bounds');
        } else if (player.selectTile(game, player.tiles[tile]).placeSelectedTile(game, game.playable()[coords])) {
            console.log(printBoard(game));
            showTurnScore();
            showTiles();
        } else {
            console.log('Not a valid tile placement.');
        }
    }

    var routeLine = function(line, player) {
        var seperatorIndex = line.indexOf(' ');

        var cmd = line.slice(0, seperatorIndex != -1 ? seperatorIndex : line.length);
        var params = line.slice(seperatorIndex).trim();

        switch (cmd) {
            case 'end':
                endScoringTurn(player);     break;
            case 'exc':
                exchange(params, player);   break;
            case 'help':
                console.log(helpMsg());     break;
            case 'reset':
                reset(player);              break;
            case 'sort':
                sort(params, player);       break;
            case 'game':
                console.log(game[params]);  break;
            default:
                console.log('Command not recognized. Enter "help" for help.');
        }

    }
    console.log(helpMsg());

    if (game.getCurrentPlayer().type != 0) {
        botTurn(game);
    } else {
        console.log(printBoard(game));
        showTiles();
    }

    rl.setPrompt('TWQ> ');
    rl.prompt();

    rl.on('line', routeInput);

    rl.on('close', function() {
        console.log('Thanks for playing!');
        process.exit(0);
    });

}

gameBuilder(gamePlayer);
