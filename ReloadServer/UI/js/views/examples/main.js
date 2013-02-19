define([
    'jquery',
    'underscore',
    'backbone',
    'views/examples/list',
    'text!../../../templates/examples/main.html',
], function($, _, Backbone, ExampleListView, mainTemplate){

    var ExamplesView = Backbone.View.extend({

        name: 'examples',

        className: 'examples-content',

        initialize: function () {
            _.bindAll(this, 'render', 'close');
            this.examples = new ExampleListView();
        },

        render: function () {
            //var compiledTemplate = _.template( mainTemplate );
            //return this.$el.html( compiledTemplate );
            return this.$el.html( this.examples.render() );
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

    return ExamplesView;
});
