define([
    'jquery',
    'underscore',
    'backbone',
    'collections/examples',
    'views/examples/example',
    'text!../../../templates/examples/list.html'
], function($, _, Backbone, ExampleCollection, ExampleView, exampleListTemplate) {

    var ExamplesView = Backbone.View.extend({

        events: {
            'click a.thumbnail': 'highlight'
        },

        initialize: function () {
            _.bindAll(this,
                      'render',
                      'close',
                      'highlight');

            this.collection = new ExampleCollection();
        },

        render: function () {
            var self = this;
            _(this.collection.models).each(function (model) {
                self.appendExampleView(model);
            }, this);

            var compiledTemplate = _.template( exampleListTemplate );
            return this.$el.html( compiledTemplate );
        },

        close: function () {
            //COMPLETELY UNBIND THE VIEW
            this.undelegateEvents();
            this.$el.removeData().unbind();

            //Remove view from DOM
            this.remove();
            Backbone.View.prototype.remove.call(this);
        },

        highlight: function (e) {
            e.preventDefault();
            console.log('highlight');
        },

        appendExampleView: function (model) {
            console.log('appendExampleView');
            var ev = new ExampleView({
                model: model
            });


            $('#examples').append( ev.render() );
        },

        rebuildEvents: function () {
            this.delegateEvents();
            console.log('rebuildevents');
        }
    });

    return ExamplesView;
});
