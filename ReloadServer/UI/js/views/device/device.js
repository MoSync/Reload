define([
       'jquery',
       'underscore',
       'backbone',
       'models/device/device',
       'text!../../../templates/device/device.html'
], function($, _, Backbone, DeviceModel, deviceTemplate) {

    var DeviceView = Backbone.View.extend({

        events: {
            'click a.disconnect': 'disconnect'
        },

        initialize: function () {
            var self = this;
            _.bindAll(this, 'render', 'disconnect');
            this.model.on('disconnected', function(){
                self.close();
            });
        },

        disconnect: function (e) {
            e.preventDefault();
            this.model.disconnect();
        },

        render: function () {
            var data = {
                address:   this.model.get('address'),
                platform:  this.model.get('platform'),
                name:      this.model.get('name'),
                uuid:      this.model.get('uuid'),
                version:   this.model.get('version'),
            };
            var compiledTemplate = _.template( deviceTemplate, {data: data} );

            return this.$el.html(compiledTemplate);
        },

        close: function () {
            console.log('closed device view');
            this.undelegateEvents();
            this.$el.removeData().unbind();

            this.remove();
            Backbone.View.prototype.remove.call(this);
        }
    });

    return DeviceView;
});
