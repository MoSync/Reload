define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/docs/main.html'
], function($, _, Backbone, docsTemplate){

    var DocsView = Backbone.View.extend({

        render: function () {

            console.log('render Docs VIEW');
            // Using Underscore we can compile our template with data
            var data = {};
            var compiledTemplate = _.template( docsTemplate, data );

            return this.$el.html( compiledTemplate );
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

    // Our module now returns our view
    return DocsView;
});

