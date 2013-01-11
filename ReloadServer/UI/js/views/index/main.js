define([
    'jquery',
    'underscore',
    'backbone',
    'views/index/serverip',
    'views/index/serverinfo',
    'views/index/content_nav',
    'views/index/sidebar',
    'views/index/content'
], function($, _, Backbone, ServerIpView, ServerInfoView, ContentNavView, SidebarView, ContentView){

    var IndexView = Backbone.View.extend({

        initialize: function () {
            _.bindAll(this, 'render', 'close');
            this.serverIpView = new ServerIpView();
            this.serverInfoView = new ServerInfoView();
            this.contentNavView = new ContentNavView();
            this.contentView = new ContentView();
        },

        render: function () {

            $('#header-center').html( this.serverIpView.render() );

            $('#server-info').html( this.serverInfoView.render() );

            // TODO: Keep nav option selected after click event.
            $('#content-nav').html( this.contentNavView.render() );

            // Sidebar must be reinitialized.
            this.sidebarView = new SidebarView();
            $('#right-bar').html( this.sidebarView.render() );

            // Populate current container with a subview.
            return this.$el.html( this.contentView.render() );
        },

        close: function () {
            this.contentView.close();
        }
    });

    return IndexView;
});

