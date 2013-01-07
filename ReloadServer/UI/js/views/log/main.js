define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/log/main.html'
], function($, _, Backbone, logTemplate){

    var LogView = Backbone.View.extend({

        el: $('#container'),

        render: function () {
            console.log('render Log VIEW');
            // Using Underscore we can compile our template with data
            var data = {};
            var compiledTemplate = _.template( logTemplate, data );
            // Append our compiled template to this Views "el"
            this.$el.html( compiledTemplate );
        }
    });

    // Our module now returns our view
    return LogView;
});
