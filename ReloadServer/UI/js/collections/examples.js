define([
   'underscore',
   'backbone',
   'models/example/example'
], function(_, Backbone, ExampleModel){

    var ExampleCollection = Backbone.Collection.extend({

        model: ExampleModel,

        initialize: function () {
            _.bindAll(this, 'populate');
            this.populate();
        },

        populate: function () {
            var self = this;
            // Populate with records.
            var options     = {};
            options.rpcMsg  = {
                method: 'manager.getExampleList',
                params: [''],
                id:     null
            };

            options.success = function (resp) {
                _.map(resp.result, function (p) {
                    self.push(new ExampleModel(p));
                });
            };

            options.error   = function (resp) {
                console.log('Could not get example list');
                console.log(resp);
            };

            this.rpc(options);
        },
    });

    return ExampleCollection;
});
