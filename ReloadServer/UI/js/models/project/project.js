define([
       'underscore',
       'backbone'
], function(_, Backbone){
    var ProjectModel = Backbone.Model.extend({
        reload: function (flag) {

            var method, self = this;
            switch(flag) {
                case 'weinre':
                    method = 'runWeinre';
                break;

                case 'test':
                    method = 'runTests';
                break;

                default:
                    method = 'reload';
            }

            var options     = {};
            options.rpcMsg  = {
                method: 'manager.' + method,
                params: [this.get('name')],
                id: 0
            };

            options.success = function (resp) {
                console.log(resp);
                self.trigger('reloaded');
            };

            options.error   = function (resp) {
                console.log(resp);
            };

            this.rpc(options);
        }

    });
    // Return the model for the module
    return ProjectModel;
});
