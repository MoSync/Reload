define([
    'jquery',
    'underscore',
    'backbone',
    'socket.io',
    'models/devices/devices',
    'views/devices/device_list_dialog',
    'text!../../../templates/devices/info.html'
], function($, _, Backbone, io,
            DevicesModel,
            DeviceListDialog,
            devicesInfoTemplate){

    var DevicesView = Backbone.View.extend({

        devices: [],

        events: {
            'click a.open-dialog': 'openDialog'
        },

        initialize: function (options) {

            this.parent = options.parent;

            _.bindAll(this,
                      'render',
                      'close',
                      'updateDeviceList',
                      'openDialog'
                     );

            var socket = io.connect('http://localhost:8283');

            var self = this;
            socket.on('devices', function (data) {
                console.log('socket response');
                console.log('data ' + JSON.stringify(data.msg));
                self.devices = data.msg;
                self.render();
            });
            this.model = new DevicesModel();
        },

        openDialog: function () {
            var deviceListDialog = new DeviceListDialog( {devices: this.devices} );
            deviceListDialog.render();
        },

        render: function () {

            // We need to make this RPC in case device is connected but the
            // page is reloaded and devices[] is reset.
            var self = this;
            if (this.devices.length === 0) {
                this.model.getDevices(function(res) {
                    self.devices = res;
                    // Redraw device list.
                    self.updateDeviceList();
                });
            }

            // Update device list instantly on render
            this.updateDeviceList();
            return this.$el;
        },

        close: function () {

            //COMPLETELY UNBIND THE VIEW
            this.undelegateEvents();
            this.$el.removeData().unbind();

            //Remove view from DOM
            this.remove();
            Backbone.View.prototype.remove.call(this);

            // Empty device list.
            this.devices = [];
        },

        updateDeviceList: function() {

            this.parent.deviceCount = 0;

            if (this.devices.length === 0) {
                this.$el.html( '<center>No clients connected.</center>' );
            } else {
                var s = (this.devices.length > 1)? 's' : '';
                var compiledTemplate = _.template( devicesInfoTemplate, {
                    count: this.devices.length,
                    s: s
                });
                this.$el.html( compiledTemplate );

                this.parent.deviceCount = this.devices.length;
            }
        }
    });

    // Our module now returns our view
    return DevicesView;
});
