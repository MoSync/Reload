define([
       'underscore',
       'backbone'
], function(_, Backbone) {
    var DeviceModel = Backbone.Model.extend({

        initialize: function () {
            _.bindAll(this, 'disconnect');
        },

        disconnect: function () {
            var self = this;

            var options     = {};
            options.rpcMsg  = {
                method: 'manager.disconnectDevice',
                params: [this.get('address')],
                id:     null
            };

            options.success = function (resp) {
                console.log('DeviceModel: ' + self.get('address') + ' disconnected');
                console.log(resp.result);
                self.trigger('disconnected');
            };

            options.error = function (resp) {
                console.log('Could not disconnect the device');
                console.log(resp);
            };

            this.rpc(options);
        }
    });

    return DeviceModel;
});
