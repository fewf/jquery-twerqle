var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');
Backbone.$ = $;

var PreGameView = require('../views/pre-game-view');
var GameView = require('../views/game-view');


module.exports = Backbone.View.extend({
    el: '#container',

    initialize: function() {

        this.render();
        this.pregameView = new PreGameView();
        // this.$el.append(pregameView.el);
    },

    // events: {
    //     "click .play": "playTurn",
    //     "click #start": "startGame"
    // },

    template: _.template($('#app-template').html()),

    render: function() {
        this.$el.html(this.template());
        return this;
    },



    events: {
        "click #start": "startGame"
    },

    startGame: function(e) {
        if (app.game) return void 0;
        this.gameView = new GameView();
        // this.pregameView.remove();
        this.pregameView.undelegateEvents();

        this.pregameView.$el.removeData().unbind(); 

        // Remove view from DOM
        this.pregameView.remove();  
        Backbone.View.prototype.remove.call(this.pregameView);
    }
});