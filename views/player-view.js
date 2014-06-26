var Backbone = require('backbone');
var $ = require('jquery');
require('jquery-ui');
Backbone.$ = $;
var _ = require('underscore');
var tileView = require('./tile-view');

module.exports = Backbone.View.extend({

    
    tagName: 'li',

    template: _.template($('#player-template').html()),

    initialize: function() {
        this.render();
        this.listenTo(this.model, 'change', this.render);        
    },

    render: function() {
        this.$el.html(this.template(this.model.toJSON()));
        var $rack = this.$el.children('.player-view').children('.player-rack');
        var tiles = this.model.get('tiles');
        for (var i = 0; i < tiles.length; i++) {
            var options = {
                            model: {
                                    tile: tiles[i]
                                    // shape: app.game.getShape(tiles[i]), 
                                    // color: app.game.getColor(tiles[i])
                                   }
                          }
            $rack.append($('<li>').html(new tileView(options).el));
        };
        // line below is a hack to get svg's to render
        $rack.html($rack.html());
        $rack.sortable({
            revert: 100,
            update: function () {
                // 
            },
            start: function(event, ui) { 
                //
            },
            stop: function (event, ui) {
                $(ui.item).css({
                    height: 50,
                    width: 50,
                    opacity: 1.0
                }).removeClass('selected');
            },
            over: function (event, ui) {
                $(ui.item).css({
                    height: 50,
                    width: 50,
                    opacity: 1.0
                });
            },
            out: function(event, ui) {
                $(ui.item).css({
                    opacity: 0.7
                });
            },
        });
        return this;
    },

    events: {
        "click svg": "selectTile"
    },

    selectTile: function(e) {
        console.log(e);
    }
});