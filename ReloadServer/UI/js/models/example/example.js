define([
       'underscore',
       'backbone'
], function(_, Backbone){
    var ExampleModel = Backbone.Model.extend({
        reload: function (opts) {
            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.reloadExample',
                params: [JSON.stringify(opts)],
                id: 0
            };

            options.success = function (resp) {
                console.log('reload successful');
                console.log(resp);
            };

            options.error   = function (resp) {
                console.log('could not reload');
                console.log(resp);
            };

            this.rpc(options);
        },

        // Copy to workspace.
        copy: function () {
            // TODO
        }

    });
    return ExampleModel;
});
