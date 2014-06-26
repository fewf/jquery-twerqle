var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');
Backbone.$ = $;
var Player = require('../models/player');
var PlayerView = require('../views/player-view');
var PlayerList = require('../collections/players');

module.exports = Backbone.View.extend({
    tagName: 'div',

    id: 'game-view',

    initialize: function() {
        this.render();

        app.game = app.twq.startGame();
        var playerList = new PlayerList();

        for (var i = 0; i < app.game.players.length; i++) {
            var pView = new PlayerView({model: playerList.add(_.extend(_.pick(app.game.players[i], 'name', 'score', 'type', 'tiles'), {id: i})) });
            $('#players').append(pView.el);
        };
        this.playerList = playerList;        
    },

    events: {
        "click #play": "playTurn"
    },

    template: _.template($('#game-template').html()),

    render: function() {
        $('#app-view').append(this.$el.html(this.template()));
        $('#play').draggable();
        return this;
    },

    playTurn: function(e) {
        var $board = $('#board');
        $board.html('');
        var pIndex = app.game.players.indexOf(app.game.getCurrentPlayer());
        app.twq.playTurn(app.game);
        var board = app.twq.printBoard(app.game);

        for (var i = 0; i < board.length; i++) {
            $board.prepend('<p>' + board[i] + '</p>');
        };
        
        this.playerList.get(pIndex).fetch();
    }

});