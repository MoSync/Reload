define([
    'jquery',
    'underscore',
    'backbone',
    'models/index/serverinfo',
    'text!../../../templates/index/serverinfo.html'
], function($, _, Backbone, ServerInfoModel, serverInfoTemplate){

    var ServerInfoView = Backbone.View.extend({

        initialize: function () {
            _.bindAll(this, 'render');
            this.model = new ServerInfoModel();
            // "on change" will trigger when callback returns info from
            // server.
            this.model.on( 'change', this.render );
        },

        render: function () {
            var data = {
                version: this.model.get('version'),
                timestamp: this.model.get('timestamp')
            };
            var compiledTemplate = _.template( serverInfoTemplate, data );
            return this.$el.html( compiledTemplate );
        }
    });

    return ServerInfoView;
});
