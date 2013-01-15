define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/editor/main.html'
], function($, _, Backbone, editorTemplate){

    var EditorView = Backbone.View.extend({

        render: function () {
            console.log('render EDITOR VIEW');
            // Using Underscore we can compile our template with data
            var data = {};
            var compiledTemplate = _.template( editorTemplate, data );
            // Append our compiled template to this Views "el"
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
    return EditorView;
});
