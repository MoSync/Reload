define([
    'jquery',
    'underscore',
    'backbone',
    'models/log/log',
    'text!../../../templates/log/message.html',
    'text!../../../templates/log/controls.html'
], function($, _, Backbone, LogModel, messageTemplate, controlsTemplate){

    var LogView = Backbone.View.extend({

        timer: null,

        name: 'log',

        messages: $('<dl id="scroller" class="dl-horizontal">'),

        events: {
            'click a#clear':         'clear'
        },

        initialize: function () {
            _.bindAll(this, 'render', 'close', 'clear', 'updateLog');

            this.model = new LogModel();
            this.model.on('change', this.clear);
            this.$el.append( $(_.template( controlsTemplate, {} )) );
        },

        render: function () {
            this.$el.append( this.messages );
            // Rebind all events in case close() was called.
            this.delegateEvents();

            // Update log on render() so we don't have to wait for
            // interval timer.
            this.updateLog();

            var self = this;
            this.timer = setInterval(function(){
                self.updateLog();
            }, 1000);
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
        updateLog: function() {
            var self = this;
            this.model.getLogMsg(function(res) {

                var header, message, label;

                header = 'Log';
                message = res;
                label = 'info';

                if(message.indexOf("Error") >= 0) {
                    var errorHeader = message.split(":",1);
                    header = errorHeader[0];
                    errorHeader[0] = errorHeader[0] += ":";
                    message = message.substr( message.indexOf(errorHeader[0]) + errorHeader[0].length );
                    label = 'important';
                }

                var compiledTemplate = _.template( messageTemplate, {
                    header: header,
                    message: message,
                    label: label
                });
                self.messages.append( compiledTemplate );

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
                if ((scroller.clientHeight < scroller.scrollHeight) && self.firstScroll) {
                    doScroll = true;
                    self.firstScroll = false;
                }

                if (doScroll) {
                    scroller.scrollTop += 20;
                }
            });
        }
    });

    // Our module now returns our view
    return LogView;
});
