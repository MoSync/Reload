define([
   'underscore',
   'backbone'
], function(_, Backbone){
    var ServerInfoModel = Backbone.Model.extend({
        initialize: function () {
            _.bindAll(this, 'getServerInfo');
            this.getServerInfo();
        },

        getServerInfo: function () {

            var options     = {};
            options.rpcMsg  = {
                method: 'manager.getVersionInfo',
                params: [''],
                id:     null
            };

            var self = this;
            options.success = function (resp) {
                var o = JSON.parse(resp.result);
                self.set({ version: o.version });
                self.set({ timestamp: o.timestamp });
            };

            options.error   = function (resp) {
                console.log('could not get server info');
                console.log(resp);
            };

            this.rpc(options);
        }
    });

    return ServerInfoModel;
});
