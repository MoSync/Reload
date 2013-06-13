define([
    'jquery',
    'underscore',
    'backbone',
    'models/project/project',
    'views/project/rename_project_dialog',
    'views/project/remove_project_dialog',
    'text!../../../templates/project/project.html',
    'text!../../../templates/project/controls.html'
], function($, _, Backbone,
            ProjectModel,
            RenameProjectDialog,
            RemoveProjectDialog,
            projectTemplate,
            controlsTemplate){

    var ProjectView = Backbone.View.extend({

        tagName: 'li',

        initialize: function (options) {

            _.bindAll(this,
                      'render',
                      'toggle',
                      'control',
                      'openFolder',
                      'removeProject',
                      'runTests',
                      'renameProject');

            this.projectList = options.projectList;

            this.parent = options.parent;

            this.model.on('change', this.toggle);

            this.id = (this.model.id !== undefined) ? this.model.id: this.model.cid;

            this.controls = _.template(controlsTemplate, {
                id: this.id
            });

            this.$controls = $(this.controls);


            this.compiledTemplate = _.template( projectTemplate, {
                name: this.model.get('name'),
                id: this.id
            });

            this.$container = $(this.compiledTemplate);
        },

        render: function () {
            return this.$el.html(this.$container);
        },

        toggle: function () {
            console.log('toggle');
            if (this.model.get('showControls')) {
                // Bind event to controls
                this.$controls.on('click', this.control);

                // Add style to selected project row.
                this.$container.addClass('select-project');
                this.$container.find('span').addClass('project-name-clip');

                // Show controls
                this.$container.append(this.$controls);

            } else {

                this.$container.removeClass('select-project');
                this.$container.find('span').removeClass('project-name-clip');

                // Unbind doubleclick.
                this.$container.find('span').off('dblclick');

                // Remove form.

                // Unbind events from controls
                this.$controls.off('click', this.control);
                //this.$controls.removeData().unbind();
                // Remove controls
                this.$controls.remove();
            }
        },


        control: function (e) {
            e.preventDefault();
            var command = $(e.target).data('command');
            var id = $(e.target).data('id');

            switch (command) {
            case 'rename':
                this.renameProject();
                break;

            case 'open':
                this.openFolder();
                break;

            case 'delete':
                this.removeProject();
                break;

            case 'test':
                this.runTests();
                break;

            default:
                console.log('Unknown action');
            }
        },

        runTests: function () {
            this.model.reload('test');
        },

        renameProject: function () {
            var self = this;
            // Remember old name until change is made in dialog.
            var oldName = this.model.get('name');

            // RPC when project obj is modified by the dialog.
            this.model.on('change:name', function(){
                var options     = {};
                options.rpcMsg  = {
                    method: 'manager.renameProject',
                    params: [oldName, self.model.get('name')],
                    id: 0
                };

                options.success = function (resp) {
                    console.log('--- R e n a m e   S u c c e s s f u l ---');
                    console.log(resp.result);
                    self.projectList.rePopulate();
                };

                options.error   = function (resp) {
                    console.log('Could not rename project');
                    console.log(resp);
                };

                self.model.rpc(options);
            });

            var dialog = new RenameProjectDialog({
                project: this.model,
                projectList: this.projectList
            });
            dialog.render();
        },

        openFolder: function () {
            var options     = {};
            options.rpcMsg  = {
                method: 'manager.openProjectFolder',
                params: [this.model.get('name')],
                id: null
            };

            options.success = function (resp) {
                console.log(resp);
            };

            options.error   = function (resp) {
                console.log('could not open project folder');
                console.log(resp);
            };

            this.model.rpc(options);
        },

        removeProject: function () {
            var self = this;
            this.model.on('change:destroy', function() {
                var options     = {};
                options.rpcMsg  = {
                    method: 'manager.removeProject',
                    params: [self.model.get('name')],
                    id: 0
                };

                options.success = function (resp) {
                    console.log(resp.result);
                    self.projectList.remove(self.model);
                    self.model.destroy();
                    self.projectList.rePopulate();
                    self.parent.selectedProject = null;
                };

                options.error   = function (resp) {
                    console.log('could not remove project folder');
                    console.log(resp);
                };

                self.projectList.rpc(options);
            });


            var dialog = new RemoveProjectDialog({
                project: this.model
            });
            dialog.render();
        }

    });

    return ProjectView;
});
