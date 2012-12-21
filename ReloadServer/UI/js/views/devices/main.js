define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/devices/main.html'
], function($, _, Backbone, devicesTemplate){

    var DevicesView = Backbone.View.extend({

        el: $('#container'),

        render: function () {
            console.log('render Devices  VIEW');
            console.log(this.model.devices);
            var data = {
                device: {
                    data: this.model
                }
            };
            var compiledTemplate = _.template( devicesTemplate, data );
            this.$el.html( compiledTemplate );
        }
    });

    // Our module now returns our view
    return DevicesView;
});

