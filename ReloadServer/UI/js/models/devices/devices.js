define([
   'underscore',
   'backbone'
], function(_, Backbone){

    var DevicesModel = Backbone.Model.extend({

        initialize: function () {
            _.bindAll(this, 'getDevices');
            this.devices = [];
            this.getDevices();
        },

        getDevices: function () {

            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.getClientInfo',
                params: [],
                id:     null
            };

            var self = this;
            options.success = function (resp) {
                console.log('Got device info ' + resp.result);
                _(JSON.parse(resp.result)).each(function (d) {
                    self.devices.push(d);
                });
                console.log(self.devices);
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
