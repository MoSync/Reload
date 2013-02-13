define([
    'jquery',
    'underscore',
    'backbone',
    'models/project/project',
    'views/project/rename_project_dialog',
    'text!../../../templates/project/project.html',
    'text!../../../templates/project/controls.html'
], function($, _, Backbone,
            ProjectModel,
            RenameProjectDialog,
            projectTemplate,
            controlsTemplate){

    var ProjectView = Backbone.View.extend({

        tagName: 'li',

        initialize: function (options) {

            _.bindAll(this,
                      'render',
                      'toggle',
                      'control',
                      'reloadProject',
                      'openFolder',
                      'removeProject',
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
                this.removeProject(id);
                break;

            default:
                console.log('Unknown action');
            }
        },

        renameProject: function () {
            var self = this;
            // Remember old name until change is made in dialog.
            var oldName = this.model.get('name');

            // RPC when project obj is modified by the dialog.
            this.model.on('change:name', function(){
                var options     = {};
                options.url     = 'http://localhost:8283';
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

        reloadProject: function () {
            var self = this;
            // TODO refactor reload function from
            // sidebar_reload_button.js

            // Check if a project is selected.
            if (this.parent.selectedProject === null) {
                alert ('Please select a project.');
                return;
            }

            // TODO Make an extra pull for device list before trying to
            // reload.
            // Check if any devices are connected.
            if (this.parent.deviceCount === 0) {
                alert ('Please connect a device.');
                return;
            }

            console.log('--- R e l o a d i n g ---');
            console.log(this.model.get('name'));
            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.reloadProject',
                params: [this.model.get('name'), this.parent.debug],
                id: 0
            };

            options.success = function (resp) {
                console.log('reload');
                console.log(resp.result);
                // Clear log.
                self.parent.views.logView.clear();
            };

            options.error   = function (resp) {
                console.log('could not remove project folder');
                console.log(resp);
            };

            this.model.rpc(options);
        },

        openFolder: function () {
            var options     = {};
            options.url     = 'http://localhost:8283';
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
            var c = confirm('Are you sure you want to delete ' +
                            this.model.get('name') + ' ?');
            if (!c) {
                return;
            }

            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.removeProject',
                params: [this.model.get('name')],
                id: 0
            };

            var self = this;
            options.success = function (resp) {
                console.log(resp.result);
                self.projectList.remove(self.model);
                self.projectList.rePopulate();
                self.parent.selectedProject = null;
            };

            options.error   = function (resp) {
                console.log('could not remove project folder');
                console.log(resp);
            };

            this.projectList.rpc(options);
        }

    });

    return ProjectView;
});
