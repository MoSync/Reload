define([
       'jquery',
       'underscore',
       'backbone',
       'collections/devices',
       'views/device/device',
       'text!../../../templates/devices/device_list_dialog.html'
], function($, _, Backbone, DeviceCollection, DeviceView, dialogTemplate){

    var DeviceListDialog = Backbone.View.extend({

        deviceViews: [], // List of subviews.

        events: {
            'click button#submit': 'submit',
            'click button[data-dismiss]': 'close'
        },
        initialize: function () {
            var self = this;
            _.bindAll(this, 'render', 'submit', 'close', 'makeList');
            this.collection.on('add', function(){
                self.makeList();
            });
            this.collection.on('reset', function(){
                self.makeList();
            });
        },

        submit: function () {
            this.close();
        },

        close: function () {
            var self = this;

            // Don't remove until transition is complete.
            this.$el.on('hidden', function () {
                self.remove();
            });

            this.$el.modal('hide');
        },

        /*
         *        generateList: function () {
         *
         *            console.log('generatelist');
         *            console.log(this.devices);
         *            _(this.devices).each(function(d){
         *                data.address    = d.address;
         *                data.platform   = d.platform;
         *                data.name       = d.name;
         *                data.uuid       = d.uuid;
         *                data.version    = d.version;
         *
         *                var compiledTemplate = _.template( devicesTemplate, { data: data } );
         *                devicesContainer.append( compiledTemplate );
         *            });
         *        },
         */

        makeList: function () {
            console.log('makelist');
            var self = this;
            var container = this.$el.find('#device-list-container');
            container.empty();

            // Kill all subviews.
            _(this.deviceViews).each(function(dv){
                dv.close();
            });
            this.deviceViews = [];

            // Create device view list.
            _(this.collection.models).each(function(model){
                // Save deviceview in a list to be able to remove it later.
                self.deviceViews.push(new DeviceView({
                    model: model
                }));
            });

            // Append all device views to the dialog view.
            _(this.deviceViews).each(function(dv){
                console.log('dv');
                container.append(dv.render());
            });
        },

        render: function () {
            var self = this;
            var compiledTemplate = _.template( dialogTemplate, {} );
            this.$el = $(compiledTemplate);

            this.$el.on('show', function(){
                self.makeList();
            });

            this.$el.modal('show');
            this.delegateEvents();
        }
    });

    return DeviceListDialog;
});
