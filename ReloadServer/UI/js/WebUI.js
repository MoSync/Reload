var WebUI = Backbone.Model.extend({
    initialize: function() {
                    console.log('WebUI init');
    },

    rpcCall: function(path, data, success, error, complete) {
                    console.log('did rpc call');
        $.ajax({
            url:        path,
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
