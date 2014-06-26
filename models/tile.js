var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

    

    shape: function() {
        return app.game.getShape(this.tileNum);
    }

    color: function() {
        return app.game.getColor(this.tileNum);
    }

});