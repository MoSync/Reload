define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/debug/main.html'
], function($, _, Backbone, debugTemplate){

    var DebugView = Backbone.View.extend({

        el: $('#container'),

        render: function () {
            console.log('render Debug  VIEW');
            var data = {};
            var compiledTemplate = _.template( debugTemplate, data );
            this.$el.html( compiledTemplate );
        }
    });

    // Our module now returns our view
    return DebugView;
});
