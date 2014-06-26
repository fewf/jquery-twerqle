var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
	defaults: {
        grid: [];
        playableCoords: [];
	},

	game: app.game || {},

	sync: function(method, model, options) {
        if (typeof options == 'function') {
            options = {
                success: options,
                error: function(msg) { console.log(msg); }
            };
        }

        var resp;

        switch (method) {
            case "read":    resp = this.read(model);        break;
            case "create":  resp = this.create(model);      break;
            case "update":  resp = this.update(model);      break;
            case "delete":  resp = this.destroy(model);     break;
        }

        if (resp) {
            options.success(resp);  
        } else {
            options.error('Record not found.'); 
        }
    },

    read: function(model) {
        model.set('grid', this.game.board.grid());

        return model;
    },

    create: function(model) {
        throw Error('cannot create board');
    },

    update: function(model) {
        throw Error('cannot update board');
    },

    destroy: function(model) {
        throw Error('cannot delete board');
    }
});