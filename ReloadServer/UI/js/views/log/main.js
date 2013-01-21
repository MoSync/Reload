define([
    'jquery',
    'underscore',
    'backbone',
    'models/log/log',
    'text!../../../templates/log/message.html'
], function($, _, Backbone, LogModel, messageTemplate){

    var LogView = Backbone.View.extend({

        timer: null,

        name: 'log',

        messages: $('<dl id="scroller" class="dl-horizontal">'),

        events: {
            'click #autoscroll': 'autoscrollCheck'
        },

        initialize: function () {
            _.bindAll(this, 'render', 'close', 'updateLog');

            this.model = new LogModel();
        },

        render: function () {

            this.$el.append( this.messages );

            // Update log on render() so we don't have to wait for
            // interval timer.
            this.updateLog();

            var self = this;
            this.timer = setInterval(function(){
                self.updateLog();
            }, 1000);
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
        },

        autoscrollCheck: function () {
            var scroll = $('#autoscroll').is(':checked');
            if (scroll) {
                console.log('');
            }

        }
    });

    // Our module now returns our view
    return LogView;
});
