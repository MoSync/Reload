define([
   'underscore',
   'backbone'
], function(_, Backbone){
    var ProjectModel = Backbone.Model.extend({
        reload: function (debug) {
            console.log('reloading ' + this.get('name'));

            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.reloadProject',
                params: [this.get('name'), debug],
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
        }
    });
    // Return the model for the module
    return ProjectModel;
});
