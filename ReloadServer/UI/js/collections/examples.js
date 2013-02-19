define([
   'underscore',
   'backbone',
   'models/example/example'
], function(_, Backbone, ExampleModel){

    var ExampleCollection = Backbone.Collection.extend({

        initialize: function () {
            //_.bindAll(this, 'populate', 'rePopulate', 'setpath');
            console.log('example collection');
            //console.log(this.test());
        }

    });

    return ExampleCollection;
});
