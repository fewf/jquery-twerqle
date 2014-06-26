var Backbone = require('backbone');
var Tile = require('../models/tile');


module.exports = Backbone.Collection.extend({
    model: Tile,

    gameDataSource: function() {

    },

    game: app.game || {},

    initialize: function(playerModel) {
    	this.player = playerModel;
    }

    sync: function(method, model, options) {
        this.models.forEach(function(model) {
            model.sync(method, model, options);
        })
    },

});