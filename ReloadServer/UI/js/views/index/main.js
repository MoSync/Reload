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
            this.contentNavView = new ContentNavView();
            this.contentView = new ContentView();
        },

        render: function () {

            // TODO: Keep nav option selected after click event.
            $('#content-nav').html( this.contentNavView.render() );

            this.sidebarView = new SidebarView();
            $('#bar-left').html( this.sidebarView.render() );

            // Populate current container with a subview.
            return this.$el.html( this.contentView.render() );
        },

        close: function () {
            this.contentView.close();
        }
    });

    return IndexView;
});

