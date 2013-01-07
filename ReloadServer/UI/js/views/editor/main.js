define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/editor/main.html'
], function($, _, Backbone, editorTemplate){

    var EditorView = Backbone.View.extend({

        el: $('#container'),

        render: function () {
            console.log('render shit EDITOR VIEW');
            // Using Underscore we can compile our template with data
            var data = {};
            var compiledTemplate = _.template( editorTemplate, data );
            // Append our compiled template to this Views "el"
            this.$el.html( compiledTemplate );
        }
    });

    // Our module now returns our view
    return EditorView;
});
