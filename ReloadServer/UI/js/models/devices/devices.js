define([
   'underscore',
   'backbone'
], function(_, Backbone){

    var DevicesModel = Backbone.Model.extend({

        initialize: function () {
            _.bindAll(this, 'getDevices');
            this.devices = [];
        },

        disconnect: function (address) {
            var self = this;

            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.disconnectDevice',
                params: [address],
                id:     null
            };

            if (this.devices.length > 0) {
                this.devices = [];
            }

            options.success = function (resp) {
                console.log(resp.result);
                self.trigger('disconnected');
            };

            options.error = function (resp) {
                console.log('could not disconnect the device');
                console.log(resp);
            };

            this.rpc(options);
        },

        getDevices: function (callback) {
            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.getClientInfo',
                params: [],
                id:     null
            };

            if (this.devices.length > 0) {
                this.devices = [];
            }

            var self = this;
            options.success = function (resp) {
                _(JSON.parse(resp.result)).each(function (d) {
                    self.devices.push(d);
                });

                if (typeof(callback) === 'function') {
                    callback(self.devices);
                }
            };

            options.error   = function (resp) {
                console.log('could not get client info');
                console.log(resp);
            };

            this.rpc(options);
        }
    });

    return DevicesModel;
});
