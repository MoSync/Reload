define([
   'underscore',
   'backbone'
], function(_, Backbone){

    var LogModel = Backbone.Model.extend({

        initialize: function () {
            _.bindAll(this, 'getLogMsg');
            this.messages = [];
            this.getLogMsg();
        },

        getLogMsg: function (callback) {

            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.getRemoteLogData',
                params: [],
                id:     null
            };

            //if (this.devices.length > 0) {
                //this.devices = [];
            //}

            var self = this;
            options.success = function (resp) {
                _(JSON.parse(resp.result)).each(function (d) {
                    self.messages.push(d);
                });
                console.log(self.messages);

                if (typeof(callback) === 'function') {
                    callback(self.messages);
                }
            };

            options.error   = function (resp) {
                console.log('could not get remote log message');
                console.log(resp);
            };

            this.rpc(options);
        }
    });

    return LogModel;
});

