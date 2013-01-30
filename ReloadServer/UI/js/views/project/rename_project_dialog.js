define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/project/rename_project_dialog.html'
], function($, _, Backbone, dialogTemplate){

    var RenameProjectDialog = Backbone.View.extend({

        events: {
            'click button#submit': 'submit',
            'click button#close': 'close'
        },

        initialize: function (options) {
            _.bindAll(this, 'render', 'submit', 'close');

            this.project = options.project;
            this.projectList = options.projectList;

            this.compiledTemplate = _.template( dialogTemplate, {
                name: this.project.get('name')
            });

            this.$el = $(this.compiledTemplate);
        },

        submit: function () {
            var name = $('#project-name').val();
            var errors = [];

            if (name.length === 0) {
                errors.push('Project name can not be empty.');
            }

            // Check if project name is taken.
            _(this.projectList.models).each(function (p) {
                if (p.get('name') === name) {
                    errors.push('Please enter a project name that is not taken.');
                }
            });

            if (errors.length > 0) {
                alert(errors.join(','));
            } else {
                this.project.set({
                    name: name
                });

                this.close();
            }
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

    return RenameProjectDialog;
});
