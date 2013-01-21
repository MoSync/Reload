define([
    'jquery',
    'views/index/sidebar',
    'views/index/content_nav'
], function ($, SidebarView, ContentNavView) {

    var ViewHandler = function () {

        return {
            show: function(view) {

                if (this.currentView) {
                    this.currentView.close();
                }

                this.currentView = view;
                this.currentView.render();

                $('#content').html( this.currentView.el );

                if (this.sidebarView) {
                    console.log('sidebar is set!');
                } else {

                    this.sidebarView = new SidebarView();
                    $('#bar-left').html( this.sidebarView.render() );
                }

                if (this.contentNavView) {
                    console.log('nav is set!');
                } else {
                    this.contentNavView = new ContentNavView();
                    $('#content-nav').html( this.contentNavView.render() );
                    this.contentNavView.setActive(view.name);
                }
            }
        };
    };

    return ViewHandler;
});

