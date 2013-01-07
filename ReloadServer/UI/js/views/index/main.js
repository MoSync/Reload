define([
    'jquery',
    'underscore',
    'backbone',
    'views/index/serverip',
    'views/index/sidebar'
], function($, _, Backbone, ServerIpView, SidebarView){

    var IndexView = Backbone.View.extend({

        //el: $('#right-bar'),

        initialize: function () {
        },

        render: function () {
            console.log('rendering index view');

            var serverIpView = new ServerIpView();
            serverIpView.render();

            var sidebarView = new SidebarView();
            sidebarView.render();
        }
    });

    return IndexView;
});

