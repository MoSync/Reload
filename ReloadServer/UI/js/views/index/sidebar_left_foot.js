define([
    'jquery',
    'underscore',
    'backbone',
    'views/index/serverip',
    'views/index/serverinfo',
    'views/device/main',
    'text!../../../templates/index/sidebar_left_foot.html'
], function($, _, Backbone, ServerIpView, ServerInfoView, DevicesView, template){

    var SidebarLeftFootView = Backbone.View.extend({

        initialize: function (options) {
            this.parent = options.parent;
            _.bindAll(this, 'render');
        },

        render: function () {

            var serverIpView = new ServerIpView();
            serverIpView.render();

            var serverInfoView = new ServerInfoView();
            serverInfoView.render();

            var devicesView = new DevicesView( {parent: this.parent} );
            var compiledTemplate = _.template( template, {} );
            var o = $(compiledTemplate).append( devicesView.render() );
            return this.$el.html( o );
        }
    });

    return SidebarLeftFootView;
});
