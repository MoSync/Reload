define([
    'jquery',
    'underscore',
    'backbone',
    'socket.io',
    'models/devices/devices',
    'text!../../../templates/devices/main.html'
], function($, _, Backbone, io, DevicesModel, devicesTemplate){

    var DevicesView = Backbone.View.extend({

        timer: null,
        devices: [],

        initialize: function (options) {

            console.log(options);
            this.parent = options.parent;

            _.bindAll(this, 'render', 'close', 'updateDeviceList');

            var socket = io.connect('http://localhost:8283');

            var self = this;
            socket.on('devices', function (data) {
                console.log('data ' + JSON.stringify(data.msg));
                self.devices = data.msg;
                self.render();
            });
            this.model = new DevicesModel();
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

            // Clear timer.
            clearInterval(this.timer);
            this.timer = null;

            // Empty device list.
            this.devices = [];
        },

        updateDeviceList: function() {
            // Clear previous content to prevent endless accumulation of
            // HTML.
            this.$el.empty();

            this.parent.deviceCount = 0;

            if (this.devices.length === 0) {
                console.log('no connected');
                this.$el.html( '<center>No clients connected.</center>' );
            } else {
                var data = {};
                var self = this;
                _(this.devices).each(function(d){
                    data.platform   = d.platform;
                    data.name       = d.name;
                    data.uuid       = d.uuid;
                    data.version    = d.version;

                    var compiledTemplate = _.template( devicesTemplate, { data: data } );
                    self.$el.append( compiledTemplate );

                    self.parent.deviceCount++;
                });
            }
            $('#device-list').html( this.$el );
        }
    });

    // Our module now returns our view
    return DevicesView;
});
