define([
    'jquery',
    'underscore',
    'backbone',
    'collections/examples',
    'views/examples/example'
], function($, _, Backbone, ExampleCollection, ExampleView) {

    var ExamplesView = Backbone.View.extend({

        subViews: [],

        initialize: function (options) {
            this.projectCollection = options.projectCollection;
            _.bindAll(this,
                      'render',
                      'close',
                      'appendExampleView');

        },

        render: function () {
            var self = this;
            this.collection = new ExampleCollection();
            this.collection.on('add', this.appendExampleView);

            if (!this.$el.is(':empty')) {
                this.$el.empty();
            }

            _(this.collection.models).each(function (model) {
                self.appendExampleView(model);
            }, this);

            //var compiledTemplate = _.template( exampleListTemplate );
            return this.$el;
        },

        close: function () {
            var i;
            for (i = 0; i<this.subViews.length; i++) {
                this.subViews[i].close();
                this.subViews.splice(i, 1);
            }

            //Remove view from DOM
            this.remove();
            Backbone.View.prototype.remove.call(this);
        },

        appendExampleView: function (model) {
            var ev = new ExampleView({
                model: model,
                projectCollection: this.projectCollection
            });
            this.subViews.push(ev);
            this.$el.append( ev.render() );
        }
    });

    return ExamplesView;
});
