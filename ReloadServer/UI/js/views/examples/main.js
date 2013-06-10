define([
    'jquery',
    'underscore',
    'backbone',
    'views/examples/list'
], function($, _, Backbone, ExampleListView){

    var ExamplesView = Backbone.View.extend({

        name: 'examples',

        className: 'span12 pad10 examples',

        initialize: function (options) {
            _.bindAll(this, 'render', 'close');
            this.examples = new ExampleListView({ projectCollection: options.projectCollection });
        },

        render: function () {
            this.delegateEvents();
            return this.$el.html( this.examples.render() );
        },

        close: function () {
            //Remove view from DOM
            this.remove();
            this.examples.close();
            this.undelegateEvents();
            Backbone.View.prototype.remove.call(this);
        }

    });

    return ExamplesView;
});
