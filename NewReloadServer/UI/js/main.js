(function($){
    var WebUiView = Backbone.View.extend({

        serverIpPlaceholder: $('.server-info'),

        serverPath: 'http://localhost',
        serverPort: 8283,


        initialize: function() {
            _.bindAll(this, 'render');
            this.render();
        },

        render: function() {
            $(this.serverIpPlaceholder).append(this.getServerIp());
        },

        getServerIp: function() {
            var data = {
                "method" :  "getServerAddress",
                "params" :  [],
                "id" :      0
            };
            data = JSON.stringify(data);

            var success = function(res) {
                console.log('success');
                console.log(res);
            };
            var error = function(res) {
                console.log('err');
                console.log(res);
            };
            var complete = function(res) {
                console.log('complete');
                console.log(res);
            };

            this.rpcCall(data, success, error, complete);
        },

        rpcCall: function(data, success, error, complete) {
            $.ajax({
                url:        this.serverPath + ':' + this.serverPort,
                data:       data,
                type:       'POST',
                contentType:'application/json',
                dataType:   'json',
                success:    function(response) { success('succ'); },
                error:      function(response) { error('error'); },
                complete:   function(response) { complete('complete'); }
            });
        }
    });

    var ui = new WebUiView();
})(jQuery);

/*
function clickHandler(event) {
    var rpcMethod = $(event.target).data('rpcMethod');
    var rpcParams = $(event.target).data('rpcParams');
    var request = {
        'method' : rpcMethod,
        'params' : rpcParams
    };
    var success = function(response) {console.log(response);};
    var error = function(response) {console.log(response);};
    var complete = function(response) {console.log(response);};

    var ui = new WebUI();
    ui.rpcCall(path, JSON.stringify(request), success, error, complete);
}
*/
