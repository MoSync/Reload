define([
    'jquery',
    'underscore',
    'backbone',
    'models/index/serverip',
    'text!../../../templates/index/serverip.html'
], function($, _, Backbone, ServerIpModel, serverIpTemplate){

    var ServerIpView = Backbone.View.extend({

        el: $('#header-center'),

        initialize: function () {

            _.bindAll(this, 'render');

            this.model = new ServerIpModel();
            this.model.on( 'change', this.render );

        },

        render: function () {
            var data = { ip: this.model.get('ip') };
            var compiledTemplate = _.template( serverIpTemplate, data );
            this.$el.html( compiledTemplate );
        }

    });

    return ServerIpView;
});


