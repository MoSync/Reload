define([
    'jquery',
    'underscore',
    'backbone',
    'views/index/serverip',
    'views/index/content_nav',
    'views/index/sidebar',
    'views/index/content'
], function($, _, Backbone, ServerIpView, ContentNavView, SidebarView, ContentView){

    var IndexView = Backbone.View.extend({

        el: $('#container'),

        initialize: function () {
            _.bindAll(this, 'render', 'close');
            this.serverIpView = new ServerIpView();
            this.contentNavView = new ContentNavView();
            this.sidebarView = new SidebarView();
            this.contentView = new ContentView();
        },

        render: function () {
            console.log('rendering index view');

            this.serverIpView.render();
            this.contentNavView.render();
            this.sidebarView.render();
            this.$el.html(this.contentView.render());
        },

        close: function () {
            this.contentView.close();
        }

    });

    return IndexView;
});

