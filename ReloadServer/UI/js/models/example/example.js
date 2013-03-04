define([
       'underscore',
       'backbone'
], function(_, Backbone){
    var ExampleModel = Backbone.Model.extend({
        reload: function (opts) {
            var self, options;

            self = this;

            options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.reloadExample',
                params: [JSON.stringify(opts)],
                id: null
            };

            options.success = function (resp) {
                self.trigger('reloaded');
                console.log(resp);
            };

            options.error = function (resp) {
                console.log('could not reload');
                console.log(resp);
            };

            this.rpc(options);
        },

        // Copy to workspace.
        copy: function (opts) {
            var self = this;
            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.copyExample',
                params: [JSON.stringify(opts)],
                id: null
            };

            options.success = function (resp) {
                console.log('Copy successful');
                console.log(resp);
                self.trigger('copied');
            };

            options.error   = function (resp) {
                console.log('Could not copy example');
                console.log(resp);
            };

            this.rpc(options);
        }

    });
    return ExampleModel;
});
