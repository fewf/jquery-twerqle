var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');
Backbone.$ = $;


module.exports = Backbone.View.extend({

    tagName: 'svg',

    attributes: {
                    xmlns: 'http://www.w3.org/2000/svg',
                    viewBox: '0 0 100 100',
                    height: '100%',
                    width: '100%'
                },

    'class': 'tile',

    initialize: function(tileNum) {
        this.model.shape = app.game.getShape(this.model.tile);
        this.model.color = app.game.getColor(this.model.tile);
        this.render();
    },

    template: _.template($('#tile-template').html()),

    render: function() {
        this.$el.html(this.template(this.model));
        this.$el.addClass('c' + this.model.color);
        return this;
    }

});