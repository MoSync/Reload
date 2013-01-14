define([
    'jquery',
    'underscore',
    'backbone',
    'views/index/serverip',
    'views/devices/main',
    'text!../../../templates/index/sidebar_left_foot.html'
], function($, _, Backbone, ServerIpView, DevicesView, template){

    var SidebarLeftFootView = Backbone.View.extend({

        initialize: function () {
            _.bindAll(this, 'render');
        },

        render: function () {


            var serverIpView = new ServerIpView();
            serverIpView.render();

            var devicesView = new DevicesView();
            devicesView.render();

            var compiledTemplate = _.template( template, {} );
            var o = $(compiledTemplate);
            return this.$el.html( o );
        }
    });

    return SidebarLeftFootView;
});
