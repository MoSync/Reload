define([
    'jquery',
    'underscore',
    'backbone',
    'socket.io',
    'models/log/log',
    'text!../../../templates/log/message.html',
    'text!../../../templates/log/controls.html'
], function($, _, Backbone, io, LogModel, messageTemplate, controlsTemplate){

    var LogView = Backbone.View.extend({

        name: 'log',

        timer: null,

        messages: $('<dl id="scroller" class="dl-horizontal">'),

        events: {
            'click a#clear':         'clear'
        },

        initialize: function () {

            _.bindAll(this, 'render', 'close', 'clear', 'updateLog');

            var self = this;
            var socket = io.connect('http://localhost:8283');

            socket.on('log', function (data) {
                self.updateLog(data);
            });

            this.model = new LogModel();
            this.$el.append( $(_.template( controlsTemplate, {} )) );
        },

        render: function () {
            this.$el.append( this.messages );
            // Rebind all events in case close() was called.
            this.delegateEvents();
        },

        close: function () {
            console.log('close log');
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

        clear: function (e) {
            if (typeof(e) === 'obejct') {
                e.preventDefault();
            }

            this.messages.empty();
        },

        firstScroll: true,
        updateLog: function(data) {

            console.log(data);

            var compiledTemplate = _.template( messageTemplate, {
                header: data.type,
                message: data.msg,
                label: data.type
            });
            this.messages.append( compiledTemplate );

            // Autoscroll if at the bottom.
            var scroller = document.getElementById('scroller');
            var doScroll;

            // We are at the bottom.
            if ((scroller.scrollTop+scroller.clientHeight) === (scroller.scrollHeight-20)){
                doScroll = true;
            } else {
                doScroll = false;
            }

            // Do initial scroll as soon as overflow kick in.
            if ((scroller.clientHeight < scroller.scrollHeight) && this.firstScroll) {
                doScroll = true;
                this.firstScroll = false;
            }

            if (doScroll) {
                scroller.scrollTop += 20;
            }
        }
    });

    // Our module now returns our view
    return LogView;
});
