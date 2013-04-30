require(['chardinjs']);
loadCss('js/vendor/chardinjs.css');

define([
    'jquery',
    'underscore',
    'backbone',
    'models/index/serverip',
    'text!../../../templates/index/content.html'
], function($, _, Backbone, ServerIpModel, contentTemplate){

    var ContentView = Backbone.View.extend({

        events: {
            'click .btn-mini': 'highlight'
        },

        className: 'index-content',

        initialize: function () {

            _.bindAll(this, 'render');

            var serveIpModel = new ServerIpModel();
            serveIpModel.on( 'change', function(){
                $('.serverip').html(serveIpModel.get('ip'));
            });
        },

        highlight: function (e) {
            var target = $(e.target).data('target');
            var message = $(e.target).data('message');
            var btn = $(target);
            btn.attr('data-intro', message);
            btn.attr('data-position', 'right');

            // Handle click event on target element
            var callback = function(){
                $('body').chardinJs('stop');
            };
            // Bind handler to target
            btn.on('click', callback);

            $('body').on('chardinJs:stop', function(){
                btn.removeAttr('data-intro');
                btn.removeAttr('data-position');
                // Unbing handler from target
                btn.off('click', callback);
            });
            $('body').chardinJs('start');
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
