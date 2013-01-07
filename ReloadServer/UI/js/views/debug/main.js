define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/debug/main.html'
], function($, _, Backbone, debugTemplate){

    var DebugView = Backbone.View.extend({

        el: $('#container'),

        initialize: function () {
            _.bindAll(this, 'render', 'close');
        },

        render: function () {
            var data = {};
            console.log(debugTemplate);
            var compiledTemplate = _.template( debugTemplate, data );
            this.$el.html( compiledTemplate );
        },

        close: function () {
            ////COMPLETELY UNBIND THE VIEW
            //this.undelegateEvents();
            //this.$el.removeData().unbind();

            ////Remove view from DOM
            //this.remove();
            //Backbone.View.prototype.remove.call(this);
        }
    });

    // Our module now returns our view
    return DebugView;
});
