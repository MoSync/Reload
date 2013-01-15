define([
    'jquery',
    'underscore',
    'backbone',
    'router'
], function ($, _, Backbone, Router) {

    var initialize = function () {

        // Setup Backbone to send RPC messages.
        var rpc = {
            rpc: function (options) {
                //var xhr =(this.sync || Backbone.sync).call(this, 'rpc', this, options);
                (this.sync || Backbone.sync).call(this, 'rpc', this, options);
            }
        };

        _.extend(Backbone.Collection.prototype, rpc);
        _.extend(Backbone.Model.prototype, rpc);

        Backbone.sync = function (method, model, options) {

            var resp,
            params = {};

            params.url          = options.url;
            params.data         = JSON.stringify(options.rpcMsg);
            params.contentType  = 'application/json';
            params.type         = 'POST';
            params.dataType     = 'json';

            // Only rpc calls are supported for now.
            if (method === 'rpc') {
                resp = $.ajax(_.extend(params, options));
            } else {
                console.log(method + ' is not supported.');
            }

            if (!resp) {
                options.error("Record not found");
            }
        };

        // Pass in our Router module and call it's initialize function
        Router.initialize();
    };

    return {
        initialize: initialize
    };
});
