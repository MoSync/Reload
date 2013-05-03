define([
    'jquery',
    'underscore',
    'backbone',
    'router'
], function ($, _, Backbone, Router) {

    var initialize = function () {
        // Make events available everywhere.
        _.extend({}, Backbone.Event);
        // Display compatibility issues warning.
        if (!$.browser.webkit) {
                $('#banner-message').show();
        }

        // Setup Backbone to send RPC messages.
        var rpc = {
            rpc: function (options) {
                (this.sync || Backbone.sync).call(this, 'rpc', this, options);
            }
        };

        _.extend(Backbone.Collection.prototype, rpc);
        _.extend(Backbone.Model.prototype, rpc);
        _.extend(Backbone.Router.prototype, rpc);

        Backbone.sync = function (method, model, options) {

            var resp,
            params = {};

            // POST
            /*
             *params.url          = 'http://localhost:' + location.port;
             *params.data         = JSON.stringify(options.rpcMsg);
             *params.contentType  = 'application/json';
             *params.type         = 'POST';
             *params.dataType     = 'json';
             */

            // GET
            params.url           = 'http://' + location.host + '/proccess';
            params.data          = options.rpcMsg;
            params.type          = 'GET';
            params.dataType      = 'jsonp';

            console.log(params.url);
            // Only rpc calls are supported for now.
            if (method === 'rpc') {
                //resp = $.ajax(_.extend(params, options));
                resp = $.getJSON(params.url, options.rpcMsg, function(data) {
                    options.success(data);
                });
            } else {
                console.log(method + ' is not supported.');
            }

            if (!resp) {
                options.error("Record not found");
            }
        };

        Router.initialize();
    };


    return {
        initialize: initialize
    };
});
