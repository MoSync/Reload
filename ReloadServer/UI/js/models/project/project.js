define([
       'underscore',
       'backbone'
], function(_, Backbone){
    var ProjectModel = Backbone.Model.extend({
        reload: function (debug) {
            var d = debug || false;
            var self = this;
            console.log('!!! Reloading ' + this.get('name') + ' with debug flag: ' + d);

            var options     = {};
            options.rpcMsg  = {
                method: 'manager.reloadProject',
                params: [this.get('name'), d],
                id: 0
            };

            options.success = function (resp) {
                console.log('reload successful');
                console.log(resp);
                self.trigger('reloaded');
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
