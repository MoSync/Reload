define([
   'underscore',
   'backbone'
], function(_, Backbone){

    var LogModel = Backbone.Model.extend({

        initialize: function () {
            _.bindAll(this, 'getLogMsg');
            this.messages = [''];
            this.getLogMsg();
        },

        getLogMsg: function (callback) {

            var options     = {};
            options.rpcMsg  = {
                method: 'manager.getRemoteLogData',
                params: [''],
                id:     null
            };

            //if (this.devices.length > 0) {
                //this.devices = [];
            //}

            options.success = function (resp) {
                var messages = [];

                _(JSON.parse(resp.result)).each(function (d) {
                    messages.push(d);
                });

                if (typeof(callback) === 'function') {
                    _(messages).each(function(m){
                        callback(m);
                    });
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

