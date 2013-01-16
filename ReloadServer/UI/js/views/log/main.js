define([
    'jquery',
    'underscore',
    'backbone',
    'models/log/log',
    'text!../../../templates/log/main.html'
], function($, _, Backbone, LogModel, logTemplate){

    var LogView = Backbone.View.extend({

        timer: null,

        initialize: function () {
            _.bindAll(this, 'render', 'close', 'updateLog');

            this.model = new LogModel();
        },
        render: function () {

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

        updateLog: function() {
            var self = this;
            this.model.getLogMsg(function(res) {

                var msgs = $('<div>');
                _(res).each(function(msg) {

                    if(msg.indexOf("Error") >= 0) {
                        var errorHeader = msg.split(":",1);
                        errorHeader[0] += ":";

                        var errorBody = msg.substr( msg.indexOf(errorHeader[0]) + errorHeader[0].length );

                        msgs.append('<div class="errorContainer">' +
                                    '<img src="http://localhost:8283/img/error32.png" class="errorImg" />' +
                                    '<span class="RemoteErrorHeader">' + errorHeader[0] + '</span><br />' +
                                    '<span class="RemoteErrorBody">' + errorBody + '</span><br />' +
                                    '</div>'
                                    );
                    } else {
                        //msgs.append(msg + '<br />');
                        //<img src="http://www.iconhot.com/icon/png/ose-png/32/error-1.png" class="errorImg" />
                        //<img src="http://code.google.com/p/mosync/logo?cct=1322576702" class="rlogImg" />
                        msgs.append('<div class="rlogContainer">' +
                                    '<img src="http://localhost:8283/img/mosyncLogo.png" class="rlogImg" />' +
                                    '<span class="rlogHeader">Remote Log</span><br />' +
                                    '<span class="rlogBody">' + msg + '</span><br />' +
                                    '</div>'
                                    );
                    }
                });

                var compiledTemplate = _.template( logTemplate, { data: msgs.html() } );
                self.$el.html( compiledTemplate );
            });
        }
    });

    // Our module now returns our view
    return LogView;
});
