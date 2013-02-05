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

        scrollPosition: 0,

        firstScroll: true,

        events: {
            'click a#clear': 'clear'
        },

        initialize: function () {

            _.bindAll(this,
                      'render',
                      'close',
                      'clear',
                      'updateLog',
                      'restoreScroll');

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

            // Restore scroll position.
            this.restoreScroll();
        },

        restoreScroll: function () {
            var self = this;
            // A hack to wait for scroller element to render and apply
            // scroll position to it.
            setTimeout(function () {
                var scroll = document.getElementById('scroller');
                scroll.scrollTop = self.scrollPosition;

                // Save scroll position on manual scroll.
                $(scroll).bind('scroll', function () {
                    self.scrollPosition = scroll.scrollTop;
                    console.log(scroll.scrollTop);
                });

            }, 100);
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

        updateLog: function(data) {

            console.log(this.scrollPosition);

            var header, label;
            label = 'info'; // CSS style.
            header = 'Log'; // Log line prefix.

            console.log(data.msg.indexOf('Error:'));
            if (0 === data.msg.indexOf('javascript:')) {
                header = 'Workbench';
                data.msg = data.msg.substr(11);
            } else if (0 <= data.msg.indexOf('Error:')) {
                header = 'Error';
                label = 'important';
            }

            var compiledTemplate = _.template( messageTemplate, {
                header: header,
                message: data.msg,
                label: label
            });
            this.messages.append( compiledTemplate );

            // Autoscroll if at the bottom.
            var scroller = document.getElementById('scroller');
            var doScroll;

            // We are at the bottom.
            if (
                ((scroller.scrollTop+scroller.clientHeight) === (scroller.scrollHeight-20))
                || ((scroller.scrollTop+scroller.clientHeight) === (scroller.scrollHeight-19))
            ){
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

            // Save scroller position for later restore.
            this.scrollPosition = scroller.scrollTop;
        }
    });

    // Our module now returns our view
    return LogView;
});
