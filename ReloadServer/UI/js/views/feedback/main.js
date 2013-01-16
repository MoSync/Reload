define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/feedback/main.html'
], function($, _, Backbone, template){

    var FeedbackView = Backbone.View.extend({

        events: {
            'click button.btn': 'submit'
        },

        initialize: function () {
            _.bindAll(this, 'render', 'close', 'submit');
        },

        submit: function (e) {
            e.preventDefault();
            var content = $('textarea').val();
            if (content.length > 0) {
                console.log('');
                // Send rpc call
                // Say "Thank you" on success.
                // Show error on failure.
            } else {
                alert('Please enter a message!');
            }
        },

        render: function () {
            var data = {};
            var compiledTemplate = _.template( template, data );
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
