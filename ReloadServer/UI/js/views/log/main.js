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
                        /*console.log("------------------------------");
                        console.log(msg.indexOf(errorHeader[0]));
                        console.log(errorHeader[0].length);
                        console.log("------------------------------");*/
                        console.log("------------------------------");
                        console.log(errorHeader[0]);
                        
                        var errorBody = msg.substr( msg.indexOf(errorHeader[0]) + errorHeader[0].length );
                        //var errorHeader = msg.substr( 0, msg.indexOf("Error:") + "Error:".length() );
                        console.log(errorBody);
                        console.log("------------------------------");

                        /*var eh = document.createElement("span");
                        eh.class = "RemoteErrorHeader";
                        eh.innerHTML = errorHeader[0];

                        var eb = document.createElement("span");
                        eb.class = "RemoteErrorBody";
                        eb.innerHTML = errorBody;*/

                        msgs.append('<div class="errorContainer">' +
                                    '<img src="http://www.iconhot.com/icon/png/ose-png/32/error-1.png" class="errorImg" />' + 
                                    '<span class="RemoteErrorHeader">' + errorHeader[0] + '</span><br />' +
                                    '<span class="RemoteErrorBody">' + errorBody + '</span><br />' +
                                    '</div>' 
                                    );
                    } else {
                        msgs.append(msg + '<br />');
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
