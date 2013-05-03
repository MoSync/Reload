define([
    'jquery',
    'views/index/sidebar',
    'views/index/content_nav'
], function ($, SidebarView, ContentNavView) {

    var views;

    var ViewHandler = function (options) {
        views = options.views;

        return {
            show: function(view) {
                if (this.currentView) {
                    this.currentView.close();
                }

                this.currentView = view;
                this.currentView.render();


                $('#content').html( this.currentView.el );

                if (this.sidebarView) {
                    //console.log('sidebar is already set');
                } else {
                    this.sidebarView = new SidebarView({
                        views: views,
                        projectCollection: options.projectCollection
                    });
                    $('#bar-left').html( this.sidebarView.render() );
                }

                if (this.contentNavView) {
                    this.contentNavView.setActive(view.name);
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

