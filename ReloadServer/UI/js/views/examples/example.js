define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/examples/example.html',
], function($, _, Backbone, template){

    var ExampleView = Backbone.View.extend({

        events: {
            'click a.thumbnail': 'highlight'
        },

        initialize: function () {
            _.bindAll(this, 'render', 'close');
        },

        render: function () {
            var data = {};
            var compiledTemplate = _.template( template, data );
            return this.$el.html( compiledTemplate );
        },

        close: function () {
            //COMPLETELY UNBIND THE VIEW
            this.undelegateEvents();
            this.$el.removeData().unbind();

            //Remove view from DOM
            this.remove();
            Backbone.View.prototype.remove.call(this);
        },

        highlight: function (e) {
            e.preventDefault();
            console.log('highlight');
        }
    });

    return ExampleView;
});

