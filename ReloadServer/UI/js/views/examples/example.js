define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/examples/example.html',
], function($, _, Backbone, template){

    var ExampleView = Backbone.View.extend({

        events: {
            'click a.thumbnail':    function (e) { e.preventDefault(); },
            'click button.reload':  'reload',
            'click button.copy':    'copy'
        },

        initialize: function (options) {
            var self = this;
            this.projectCollection = options.projectCollection;
            _.bindAll(this, 'render', 'close');
            this.model.on('copied', function(){
                // Update project list.
                self.projectCollection.rePopulate();
            });
        },

        render: function () {
            // Redelegate events if this view was closed.
            this.delegateEvents();

            console.log(this.model);
            var data = {
                name: this.model.get('name'),
                description: this.model.get('description')
            };
            this.compiledTemplate = _.template( template, data );
            return this.$el.html( this.compiledTemplate );
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
        },

        reload: function (e) {
            e.preventDefault();

            // Display 'loading' message.
            var load_sign = $('<div class="loading">').append('loading');
            this.$el.html($(this.compiledTemplate).append(load_sign));

            // Disable buttons.
            $('.controls').css({display: 'none'});

            this.model.on('reloaded', function(){
                // Remove loading message.
                load_sign.remove();

                // Reenable buttons.
                $('.controls').css({display: ''});
            });

            // Call to ExampleProject::reload()
            // this.model is set in collections/examples.js
            var attrs = _.clone(this.model.attributes);
            this.model.reload(attrs);
        },

        copy: function (e) {
            e.preventDefault();

            // Display 'loading' message.
            var load_sign = $('<div class="loading">').append('loading');
            this.$el.html($(this.compiledTemplate).append(load_sign));

            // Disable buttons.
            $('.controls').css({display: 'none'});

            this.model.on('copied', function(){
                // Remove loading message.
                load_sign.remove();

                // Reenable buttons.
                $('.controls').css({display: ''});
            });

            var attrs = _.clone(this.model.attributes);
            this.model.copy(attrs);
        }
    });

    return ExampleView;
});

