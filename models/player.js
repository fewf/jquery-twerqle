var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
	defaults: {
		id: undefined,
		score: 0,
		name: 'unnamed'
	},

	gameDataSource: function() { return app.game.players[this.id] },

    create: function(model) {
        throw Error('cannot create players');
    },

    update: function(model) {
        throw Error('cannot update players');
    },

    destroy: function(model) {
        throw Error('cannot delete players');
    }
});