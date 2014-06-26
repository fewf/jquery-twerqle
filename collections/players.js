var Backbone = require('backbone');
var Player = require('../models/player');


module.exports = Backbone.Collection.extend({
    model: Player,

    gameDataSource: "players",

    game: app.game || {},

    sync: function(method, model, options) {
        this.models.forEach(function(model) {
            model.sync(method, model, options);
        })

    },

});