define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/devices/device_list_dialog.html',
    'text!../../../templates/devices/main.html'
], function($, _, Backbone, dialogTemplate, devicesTemplate){

    var DeviceListDialog = Backbone.View.extend({

        events: {
            'click button#submit': 'submit',
            'click button#close': 'close'
        },

        initialize: function (options) {
            _.bindAll(this, 'render', 'submit', 'close');

            this.devices = options.devices;
        },

        submit: function () {
            console.log('sublm');
            this.close();
        },

        close: function () {
            var self = this;

            // Don't remove until transition is complete.
            this.$el.on('hidden', function () {
                self.remove();
            });

            this.$el.modal('hide');
        },

        render: function () {
            this.delegateEvents();
            var data = {};
            var devices = $('<div>');
            _(this.devices).each(function(d){
                data.platform   = d.platform;
                data.name       = d.name;
                data.uuid       = d.uuid;
                data.version    = d.version;

                var compiledTemplate = _.template( devicesTemplate, { data: data } );
                devices.append( compiledTemplate );

            });

            var compiledTemplate = _.template( dialogTemplate, {devices: devices.html()} );
            this.$el = $(compiledTemplate);
            this.$el.modal('show');
        }

    });

    return DeviceListDialog;
});
