var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');
Backbone.$ = $;


module.exports = Backbone.View.extend({
    tagName: 'div',

    id: 'pre-game-view',

    initialize: function() {

        this.render();
    },



    template: _.template($('#pre-game-template').html()),

    render: function() {
        $('#app-view').append(this.$el.html(this.template()));
        return this;
    }

});