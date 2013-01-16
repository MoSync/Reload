define([
    'jquery',
    'underscore',
    'backbone',
    'models/index/serverip',
    'text!../../../templates/index/serverip.html'
], function($, _, Backbone, ServerIpModel, serverIpTemplate){

    var ServerIpView = Backbone.View.extend({

        initialize: function () {

            _.bindAll(this, 'render');

            this.model = new ServerIpModel();
            this.model.on( 'change', this.render );
        },

        render: function () {
            var compiledTemplate = _.template( serverIpTemplate, {
                ip: this.model.get('ip')
            });
            $('#server-ip').html( this.$el.html( compiledTemplate ) );
        }
    });

    return ServerIpView;
});


