define([
    'jquery',
    'underscore',
    'backbone',
    'models/index/content_nav',
    'text!../../../templates/index/content_nav.html'
], function($, _, Backbone, ContentNavModel, contentNavTemplate){

    var ContentNavView = Backbone.View.extend({

        el: '<ul class="nav nav-tabs">',

        events: {
            'click ul.nav li': 'setActive'
        },

        initialize: function () {
            _.bindAll(this, 'render', 'setActive');

            this.model = new ContentNavModel();
        },

        setActive: function (state) {
            // Read previous tab state
            var previous = this.model.getState();

            // Persist if current tab state =/= previous
            if (state !== previous && typeof state !== 'object') {
                this.model.setState(state);
            }

            // Clear old active tab before setting new tab as active.
            this.$el.children().each(function() {
                if ($(this).hasClass('active')) {
                    $(this).removeClass('active');
                }

                if ($(this).data('name') === state) {
                    $(this).addClass('active');
                }

            });
            if (typeof(state) === 'object') {
                $(state.target).parent().addClass('active');
            }
            // Set new tab as active.
            //$(e.target).parent().addClass('active');
        },

        render: function () {
            var items = $('<li data-name="index" class="active"><a href="/#">Quick Start</a></li>');
            items.append($('<li data-name="examples"><a href="/#/examples">Examples</a></li>'));

            // Weinre works only in webkit for now :(
            if ($.browser.webkit) {
                items.append($('<li data-name="weinre"><a href="/#/weinre">Weinre (Beta)</a></li>'));
            }

            items.append($('<li data-name="workbench"><a href="/#/workbench">Workbench</a></li>'));
            items.append($('<li data-name="docs"><a href="/#/docs">API Reference</a></li>'));
            items.append($('<li data-name="feedback" class="pull-right"><a href="/#/feedback">Send us feedback!</a></li>'));

            var nav = this.$el.html(items);

            var compiledTemplate = _.template( contentNavTemplate, { data: nav.html() } );
            return this.$el.html( compiledTemplate );
        }

    });

    return ContentNavView;
});
