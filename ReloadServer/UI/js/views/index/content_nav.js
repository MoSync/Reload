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
        },

        setActive: function (tab) {

            // Clear old active tab before setting new tab as active.
            this.$el.children().each(function() {
                if ($(this).hasClass('active')) {
                    $(this).removeClass('active');
                }

                if ($(this).data('name') === tab) {
                    $(this).addClass('active');
                }

            });
            if (typeof(tab) === 'object') {
                $(tab.target).parent().addClass('active');
            }
            // Set new tab as active.
            //$(e.target).parent().addClass('active');
        },

        render: function () {
            console.log('render menu');
            var items = $('<li data-name="index" class="active"><a href="/#">Quick Start</a></li>');

            // Weinre works only in webkit for now :(
            if ($.browser.webkit) {
                items.append($('<li data-name="debug"><a href="/#/debug">Debug</a></li>'));
            }

            items.append($('<li data-name="workbench"><a href="/#/workbench">Workbench (Beta)</a></li>'));
            items.append($('<li data-name="log"><a href="/#/log">Log</a></li>'));
            items.append($('<li data-name="docs"><a href="/#/docs">API Reference</a></li>'));
            items.append($('<li data-name="feedback" class="pull-right"><a href="/#/feedback">Send us feedback!</a></li>'));

            var nav = this.$el.html(items);

            var compiledTemplate = _.template( contentNavTemplate, { data: nav.html() } );
            return this.$el.html( compiledTemplate );
        }

    });

    return ContentNavView;
});
