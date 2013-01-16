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
            'click ul.nav li': 'redrawTabs'
        },

        initialize: function () {
            _.bindAll(this, 'render', 'redrawTabs');
        },

        redrawTabs: function (e) {
            $(e.target).parent().parent().children().each(function() {
                console.log($(this));
                if($(this).hasClass('active')) {
                    $(this).removeClass('active');
                }
            });
            $(e.target).parent().addClass('active');
        },

        render: function () {
            console.log('render menu');
            var items = $('<li class="active"><a href="/#">Home</a></li>');

            // Weinre works only in webkit for now :(
            if ($.browser.webkit) {
                items.append($('<li><a href="/#/debug">Debug</a></li>'));
            }

            items.append($('<li><a href="/#/log">Log</a></li>'));
            items.append($('<li><a href="/#/docs">Docs</a></li>'));
            items.append($('<li class="pull-right"><a href="/#/feedback">Send us feedback!</a></li>'));

            var nav = this.$el.html(items);

            var compiledTemplate = _.template( contentNavTemplate, { data: nav.html() } );
            return this.$el.html( compiledTemplate );
        }

    });

    return ContentNavView;
});
