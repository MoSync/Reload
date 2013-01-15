define([
    'jquery',
    'underscore',
    'backbone',
    'models/devices/devices',
    'text!../../../templates/devices/main.html'
], function($, _, Backbone, DevicesModel, devicesTemplate){

    var DevicesView = Backbone.View.extend({

        timer: null,

        initialize: function (options) {

            console.log(options);
            this.parent = options.parent;

            _.bindAll(this, 'render', 'close', 'updateDeviceList');

            this.model = new DevicesModel();
        },

        render: function () {

            // Update device list instantly on render so we don't have
            // to wait for interval timer.
            this.updateDeviceList();

            var self = this;
            this.timer = setInterval(function(){
                self.updateDeviceList();
            }, 2000);
        },

        close: function () {

            //COMPLETELY UNBIND THE VIEW
            this.undelegateEvents();
            this.$el.removeData().unbind();

            //Remove view from DOM
            this.remove();
            Backbone.View.prototype.remove.call(this);

            // Clear timer.
            clearInterval(this.timer);
            this.timer = null;
        },

        updateDeviceList: function() {

            var self = this;
            // Clear previous content to prevent endless accumulation of
            // HTML. TODO Prevent flickering.
            self.$el.empty();

            self.parent.deviceCount = 0;

            this.model.getDevices(function(res) {

                var data = {};

                if(res.length === 0) {

                    self.$el.html( '<center>No clients connected.</center>' );

                } else {

                    _(res).each(function(d){
                        data.platform   = d.platform;
                        data.name       = d.name;
                        data.uuid       = d.uuid;
                        data.version    = d.version;

                        var compiledTemplate = _.template( devicesTemplate, { data: data } );
                        self.$el.append( compiledTemplate );

                        self.parent.deviceCount++;
                    });
                }

                $('#device-list').html( self.$el );
            });
        }
    });

    // Our module now returns our view
    return DevicesView;
});
