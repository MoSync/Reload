define([
       'underscore',
       'backbone',
       'socket.io',
       'models/device/device'
], function(_, Backbone, io, DeviceModel){

    var DeviceCollection = Backbone.Collection.extend({
        model: DeviceModel,

        initialize: function () {
            var self = this;

            _.bindAll(this);

            var socket = io.connect('http://localhost:8283');
            socket.on('devices', function (data) {
                self.reset();
                _(data.msg).each(function(d){
                    self.push(new DeviceModel(d));
                });
                console.log('Collection length: ' + self.length);
            });
        },

        getDevices: function () {
            var options     = {};
            options.rpcMsg  = {
                method: 'manager.getClientInfo',
                params: [''],
                id:     null
            };

            if (this.length > 0) {
                this.reset();
            }

            var self = this;
            options.success = function (resp) {
                _(JSON.parse(resp.result)).each(function (d) {
                    var device = new DeviceModel(d);
                    self.push(device);
                });
                self.trigger('updated');
            };

            options.error = function (resp) {
                console.log('Could not get device info.');
                console.log(resp);
            };

            this.rpc(options);
        }
    });

    return DeviceCollection;
});
