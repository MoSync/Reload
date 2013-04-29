define([
   'underscore',
   'backbone'
], function(_, Backbone){
    var ContentNavModel = Backbone.Model.extend({
        getState: function() {
            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.getConfig',
                params: ['state'],
                id:     null
            };

            var self = this;
            options.success = function (resp) {
                self.set({ state: resp.result });
            };

            options.error   = function (resp) {
                console.log('Could not get UI state');
                console.log(resp);
            };

            this.rpc(options);
        },

        setState: function(state) {
            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.setConfig',
                params: ['state', state],
                id:     null
            };

            var self = this;
            options.success = function (resp) {
                self.set({ state: resp.result });
            };

            options.error   = function (resp) {
                console.log('Could not set UI state');
                console.log(resp);
            };

            this.rpc(options);
        }
    });

    return ContentNavModel;
});

