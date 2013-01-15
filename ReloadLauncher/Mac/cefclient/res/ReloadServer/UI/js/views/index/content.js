define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/index/content.html'
], function($, _, Backbone, contentTemplate){

    var ContentView = Backbone.View.extend({

        initialize: function () {

            _.bindAll(this, 'render');

        },

        render: function () {
            var data = {};

            var compiledTemplate = _.template( contentTemplate, data );
            this.$el.html( compiledTemplate );
            return this.$el;
        },

        close: function () {
            //COMPLETELY UNBIND THE VIEW
            this.undelegateEvents();
            this.$el.removeData().unbind();

            //Remove view from DOM
            this.remove();
            Backbone.View.prototype.remove.call(this);
        }

    });

    return ContentView;
});
