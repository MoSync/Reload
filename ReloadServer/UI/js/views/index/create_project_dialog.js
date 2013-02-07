define([
    'jquery',
    'underscore',
    'backbone',
    'models/project/project',
    'text!../../../templates/index/create_project_dialog.html'
], function($, _, Backbone, ProjectModel, dialogTemplate){

    var CreateProjectDialog = Backbone.View.extend({

        events: {
            'click button#submit': 'submit',
            'click button[data-dismiss]': 'close',
            'keypress input#project-name': 'captureKeys'
        },

        initialize: function (options) {

            _.bindAll(this, 'render', 'submit', 'close');

            this.compiledTemplate = _.template( dialogTemplate, {} );
            this.$el = $(this.compiledTemplate);

            this.project = options.project;
            this.projectList = options.projectList;
        },

        captureKeys: function (e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                this.submit();
            }
        },

        submit: function () {

            var errors = [];
            var type = 'web';
            var rdolist = document.getElementsByName("projectType");
            if (rdolist[1].checked) {
                type = "native";
            }

            var newProjectName = $('#project-name').val();

            // Check for empty name.
            if (newProjectName.length === 0) {
                errors.push('Please enter a project name.');
            }

            // Check if project name is taken.
            _(this.projectList.models).each(function (p) {
                if (p.get('name') === newProjectName) {
                    errors.push('Please enter a project name that is not taken.');
                }
            });

            if (errors.length > 0) {
                alert(errors.join(','));
            } else {
                this.project.set({
                    name: newProjectName,
                    type: type
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
            this.delegateEvents();
            this.$el.modal('show');
        }

    });

    return CreateProjectDialog;
});
