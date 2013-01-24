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
            'click button#close': 'close'
        },

        initialize: function (options) {

            _.bindAll(this, 'render');

            this.project = options.project;
            this.projectList = options.projectList;

            this.compiledTemplate = _.template( dialogTemplate, {} );
            this.$el = $(this.compiledTemplate);
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

            // Don't remove until transition is complete.
            this.$el.on('hidden', function () {
                this.remove();
            });

            this.$el.modal('hide');
        },

        render: function () {
            this.$el.modal('show');
        }

    });

    return CreateProjectDialog;
});
