define([
    'jquery',
    'underscore',
    'backbone',
    'views/index/change_workspace_dialog',
    'views/index/create_project_dialog',
    'models/project/project',
    'text!../../../templates/index/sidebar_controls.html'
], function($, _, Backbone,
            ChangeWorkspaceDialog,
            CreateProjectDialog,
            ProjectModel,
            sidebarControlsTemplate){

    var SidebarControlsView = Backbone.View.extend({

        events: {
            'click a#add-project':          'addProject',
            'click a#change-workspace':     'changeWorkspace',
            'click a#update-project-list':  'updateProjectList'
        },

        initialize: function (options) {
            this.projectList = options.projectList;
        },

        render: function () {
            var compiledTemplate = _.template( sidebarControlsTemplate, {} );
            return this.$el.html( compiledTemplate );
        },

        addProject: function (e) {
            e.preventDefault();

            var self = this;

            var project = new ProjectModel();

            project.on('change', function() {

                var options     = {};
                options.url     = 'http://localhost:8283';

                options.success = function (resp) {
                    console.log('project saved!');
                    console.log(resp.result);
                    // Add to collection on successful creation.
                    self.projectList.add(project);
                    console.log(resp);
                };

                options.error   = function (resp) {
                    console.log('could not save project');
                    console.log(resp);
                };

                options.rpcMsg  = {
                    method: 'manager.createNewProject',
                    params: [project.get('name'), project.get('type')],
                    id: null
                };

                project.rpc(options);
            });

            var dialog = new CreateProjectDialog( { project: project, projectList: this.projectList } );
            dialog.render();
        },

        changeWorkspace: function (e) {
            e.preventDefault();

            var dialog = new ChangeWorkspaceDialog( { projectList: this.projectList } );
            dialog.render();
        },

        updateProjectList: function (e) {
            e.preventDefault();

            console.log('Update project list');
            this.projectList.rePopulate();
        }
    });

    return SidebarControlsView;
});
