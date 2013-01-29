define([
    'jquery',
    'underscore',
    'backbone',
    'models/feedback/feedback',
    'text!../../../templates/feedback/main.html',
    'text!../../../templates/feedback/thanks.html'
], function($, _, Backbone, FeedbackModel, mainTemplate, thanksTemplate){

    var FeedbackView = Backbone.View.extend({

        name: 'feedback',

        events: {
            'click button.btn': 'submit'
        },

        initialize: function () {
            _.bindAll(this, 'render', 'close', 'submit');
            this.model = new FeedbackModel();
        },

        submit: function (e) {
            e.preventDefault();
            var self = this;

            var content = $('textarea').val();

            if (content.length <= 0) {
                alert('Please enter a message!');
            } else {
                var options     = {};
                options.url     = 'http://localhost:8283';
                options.rpcMsg  = {
                    method: 'manager.sendFeedback',
                    params: [content],
                    id: 0
                };

                options.success = function (resp) {
                    console.log('--- F e e d b a c k   s e n t ---');
                    console.log(resp.result);
                    // Say "Thank you" on success.
                    self.sayThankYou();
                    // Show error on failure.
                };

                options.error   = function (resp) {
                    console.log('--- E R R O R ---');
                    console.log(resp);
                };

                this.model.rpc(options);
            }
        },

        sayThankYou: function () {
            var data = {};
            var compiledTemplate = _.template( thanksTemplate, data );
            return this.$el.html( compiledTemplate );
        },

        render: function () {
            var data = {};
            var compiledTemplate = _.template( mainTemplate, data );
            return this.$el.html( compiledTemplate );
        },

        close: function () {
            console.log('close debug');
            //COMPLETELY UNBIND THE VIEW
            this.undelegateEvents();
            this.$el.removeData().unbind();

            //Remove view from DOM
            this.remove();
            Backbone.View.prototype.remove.call(this);
        }
    });

    // Our module now returns our view
    return FeedbackView;
});
