define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/project/remove_project_dialog.html'
], function($, _, Backbone, dialogTemplate){

    var RemoveProjectDialog = Backbone.View.extend({

        events: {
            'click button#submit': 'submit',
            'click button[data-dismiss]': 'close'
        },

        initialize: function (options) {
            _.bindAll(this, 'render', 'submit', 'close');

            this.project = options.project;

            this.compiledTemplate = _.template( dialogTemplate, {
                name: this.project.get('name')
            });

            this.$el = $(this.compiledTemplate);
        },

        submit: function () {
            this.project.set({
                destroy: true
            });
            this.close();
        },

        close: function () {
            var self = this;
            // Don't remove until transition is complete.
            this.$el.on('hidden', function () {
                self.remove();
            });
            this.$el.modal('hide');
        },

        render: function () {
            this.$el.modal('show');
        }
    });

    return RemoveProjectDialog;
});
