require(['gridalicious']);
define([
    'jquery',
    'underscore',
    'backbone',
    'collections/examples',
    'views/examples/example'
], function($, _, Backbone, ExampleCollection, ExampleView) {

    var ExampleListView = Backbone.View.extend({

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

            // React when all thumbnails with examples are ready.
            this.collection.on('done', function(){
                self.$el.gridalicious({
                    selector: '.thumbnail',
                    width: 250,
                    gutter: 10
                });
            });

            if (!this.$el.is(':empty')) {
                this.$el.empty();
            }

            _(this.collection.models).each(function (model) {
                self.appendExampleView(model);
            }, this);

            return this.$el;
        },

        close: function () {
            //Remove view from DOM
            this.remove();
            Backbone.View.prototype.remove.call(this);
        },

        appendExampleView: function (model) {
            var ev = new ExampleView({
                model: model,
                projectCollection: this.projectCollection
            });
            this.$el.append( ev.render() );
        }
    });

    return ExampleListView;
});
