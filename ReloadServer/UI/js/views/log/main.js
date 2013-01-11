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
                    msgs.append(msg + '<br />');
                });

                //if(res.length !== 0) {
                    //console.log(res);
                //}

                var compiledTemplate = _.template( logTemplate, { data: msgs.html() } );
                self.$el.html( compiledTemplate );
            });
        }
    });

    // Our module now returns our view
    return LogView;
});
