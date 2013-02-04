define([
    'jquery',
    'underscore',
    'backbone',
    'models/index/serverip',
    'text!../../../templates/index/content.html'
], function($, _, Backbone, ServerIpModel, contentTemplate){

    var ContentView = Backbone.View.extend({

        initialize: function () {

            _.bindAll(this, 'render');

            var serveIpModel = new ServerIpModel();
            serveIpModel.on( 'change', function(){
                $('.serverip').html(serveIpModel.get('ip'));
            });
        },

        render: function () {
            var compiledTemplate = _.template( contentTemplate, {} );
            this.$el.html( compiledTemplate );
            return this.$el;
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

    return ContentView;
});
