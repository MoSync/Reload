define([
    'jquery',
    'underscore',
    'backbone',
    'models/index/content_nav',
    'text!../../../templates/index/content_nav.html'
], function($, _, Backbone, ContentNavModel, contentNavTemplate){

    var ContentNavView = Backbone.View.extend({

        initialize: function () {
            _.bindAll(this, 'render');
        },

        render: function () {
            var items = $('<li><a href="/#/editor">EDITOR</a></li>');

            // Weinre works only in webkit for now :(
            if ($.browser.webkit) {
                items.append($('<li><a href="/#/debug">DEBUG</a></li>'));
            }

            items.append($('<li><a href="/#/devices">DEVICES</a></li>'));
            items.append($('<li><a href="/#/log">LOG</a></li>'));
            items.append($('<li><a href="/#/docs">DOCS</a></li>'));

            var nav = $('<div>');
            nav.append($('<ul>').append(items));

            var compiledTemplate = _.template( contentNavTemplate, { data: nav.html() } );
            return this.$el.html( compiledTemplate );
        }

    });

    return ContentNavView;
});
