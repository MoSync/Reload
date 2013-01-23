define([
   'underscore',
   'backbone'
], function(_, Backbone){

    var WorkbenchModel = Backbone.Model.extend({

        // Stores the text in the editor.
        data: null,

        initialize: function () {
            _.bindAll(this, 'getData', 'setData', 'doit', 'rpcCall');
        },

        getData: function (callback) {
            if (typeof(callback) === 'function') {
                callback(this.data);
            }
        },

        setData: function (data) {
            this.data = data;
        },
		
		doit: function(script) {
			console.log("@@@ workbench model doit");
            this.rpcCall('manager.evalJS', [escape(script)]);
        },
		
		rpcCall: function(methodName, paramArray) {

            var options = {};
            options.url = 'http://localhost:8283';
            options.rpcMsg = {
                method: methodName,
                params: paramArray,
                id: 0
            };

            options.success = function (resp) {
                console.log('@@@ Workbench RPC success: ' + methodName);
                console.log(resp.result);
            };

            options.error = function (resp) {
                console.log('@@@ Workbencg RPC error: ' + methodName);
                console.log(resp);
            };

            this.rpc(options);
        }
    });

    return WorkbenchModel;
});
