define([
   'underscore',
   'backbone'
], function(_, Backbone){
    var ServerIpModel = Backbone.Model.extend({
        initialize: function () {
            _.bindAll(this, 'getServerIp');
            this.getServerIp();
        },

        getServerIp: function () {

            var options     = {};
            options.rpcMsg  = {
                method: 'manager.getNetworkIP',
                params: [''],
                id:     null
            };

            var self = this;
            options.success = function (resp) {
                self.set({ ip: resp.result });
            };

            options.error   = function (resp) {
                console.log('could not get ip');
                console.log(resp);
            };

            this.rpc(options);
        }
    });

    return ServerIpModel;
});
