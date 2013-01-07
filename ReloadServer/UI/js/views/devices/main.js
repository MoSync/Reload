define([
    'jquery',
    'underscore',
    'backbone',
    'models/devices/devices',
    'text!../../../templates/devices/main.html'
], function($, _, Backbone, DevicesModel, devicesTemplate){

    var DevicesView = Backbone.View.extend({

        el: $('#container'),

        timer: null,

        initialize: function () {
            _.bindAll(this, 'render', 'close', 'updateDeviceList');

            this.model = new DevicesModel();
        },

        close: function () {
            ////COMPLETELY UNBIND THE VIEW
            //this.undelegateEvents();
            //this.$el.removeData().unbind();

            ////Remove view from DOM
            //this.remove();
            //Backbone.View.prototype.remove.call(this);

            clearInterval(this.timer);
            this.timer = null;
        },

        render: function () {

            var self = this;
            this.timer = setInterval(function(){
                self.updateDeviceList();
            }, 2000);
        },

        updateDeviceList: function() {

            var self = this;
            this.model.getDevices(function(res) {

                var data = {};

                if(res.length === 0) {

                    data = 'No clients connected.';

                } else {

                    var devices = $('<div>');

                    _(res).each(function(d){
                        var device = $('<dl>');
                        device.append($('<dt>Platform</dt><dd>'    + d.version + '</dd>'));
                        device.append($('<dt>Name</dt><dd>'        + d.name + '</dd>'));
                        device.append($('<dt>UUID</dt><dd>'        + d.uuid + '</dd>'));
                        device.append($('<dt>Version</dt><dd>'     + d.version + '</dd>'));
                        devices.append(device);
                    });

                    data = devices.html();
                }

                var compiledTemplate = _.template( devicesTemplate, { data: data } );
                self.$el.html( compiledTemplate );
            });
        }
    });

    // Our module now returns our view
    return DevicesView;
});
