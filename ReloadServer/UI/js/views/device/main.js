define([
    'jquery',
    'underscore',
    'backbone',
    'collections/devices',
    'models/device/device',
    'views/device/device_list_dialog',
    'text!../../../templates/device/info.html'
], function($, _, Backbone,
        DeviceCollection,
        DeviceModel,
        DeviceListDialog,
        devicesInfoTemplate){

        var DevicesView = Backbone.View.extend({

            events: {
                'click a.open-dialog': 'openDialog'
            },

            initialize: function (options) {
                var self = this;
                this.parent = options.parent;
                this.collection = new DeviceCollection();

                _.bindAll(this,
                          'render',
                          'close',
                          'updateDeviceList',
                          'openDialog');

                this.collection.on('reset', function() {
                    self.updateDeviceList();
                });

                this.collection.on('add', function() {
                    self.updateDeviceList();
                });

                this.collection.on('updated', function(){
                    self.updateDeviceList();
                });
            },

            openDialog: function (e) {
                e.preventDefault();
                var deviceListDialog = new DeviceListDialog({
                    collection: this.collection
                });
                deviceListDialog.render();
            },

            render: function () {
                // We need to make this RPC in case device is connected but the
                // page is reloaded and devices[] is reset.
                if (this.collection.length === 0) {
                    this.collection.getDevices();
                }
                return this.$el;
            },

            close: function () {
               //COMPLETELY UNBIND THE VIEW
                this.undelegateEvents();
                this.$el.removeData().unbind();

                //Remove view from DOM
                this.remove();
                Backbone.View.prototype.remove.call(this);

                // Empty device list.
                this.collection.remove();
            },

            updateDeviceList: function() {
                this.parent.deviceCount = 0;

                if (this.collection.length === 0) {
                    this.$el.html( '<center>No clients connected.</center>' );
                } else {
                    var s = (this.collection.length > 1)? 's' : '';
                    var compiledTemplate = _.template( devicesInfoTemplate, {
                        count: this.collection.length,
                        s: s
                    });
                    this.$el.html( compiledTemplate );

                    this.parent.deviceCount = this.collection.length;
                }
            }
        });

    // Our module now returns our view
    return DevicesView;
});
