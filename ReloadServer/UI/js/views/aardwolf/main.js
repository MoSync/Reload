define([
    'jquery',
    'underscore',
    'backbone',
    'models/index/serverip',
    'text!../../../templates/aardwolf/main.html'
], function($, _, Backbone, ServerIpModel, aardwolfTemplate){

    var AardwolfView = Backbone.View.extend({

        name: 'aardwolf',

        className: 'aardwolf',

        compiledTemplate: {},

        initialize: function () {
            var self = this;
            _.bindAll(this, 'render', 'close');
            var serveIpModel = new ServerIpModel();
            serveIpModel.on( 'change', function(){

                self.compiledTemplate = _.template( aardwolfTemplate, { serverIp : serveIpModel.get('ip') } );
                self.render();
            });
        },

        render: function () {
            var data = {};
            return this.$el.html( this.compiledTemplate );
        },

        close: function () {
            //COMPLETELY UNBIND THE VIEW
            this.undelegateEvents();
            this.$el.removeData().unbind();

            //Remove view from DOM
            this.remove();
            Backbone.View.prototype.remove.call(this);
        }
    });

    // Our module now returns our view
    return AardwolfView;
});
