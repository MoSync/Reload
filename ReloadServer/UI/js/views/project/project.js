define([
    'jquery',
    'underscore',
    'backbone',
    'models/project/project',
    'text!../../../templates/project/project.html',
    'text!../../../templates/project/controls.html'
], function($, _, Backbone, ProjectModel, projectTemplate, controlsTemplate){

    var ProjectView = Backbone.View.extend({

        tagName: 'li',
        events: {
            'dblclick': 'toggleRename'
        },

        initialize: function (options) {

            _.bindAll(this,
                      'render',
                      'toggle',
                      'control',
                      'reloadProject',
                      'openFolder',
                      'removeProject');

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

        toggleRename: function () {
            var span = this.$container.find('span');
            var form = $('<form class="rename"><input value="'+span.html()+'"type="text"/></form>');
            span.html(form);


            var self = this;

            form.find('input').on('click', function () {
                self.model.set({ showControls: true });
                console.log(self.model.get('showControls'));
            });
            form.find('input').focus();
            form.find('input').on('blur', function() {
                $(this).parent().parent().html($(this).val());
            });
        },

        control: function (e) {
            e.preventDefault();
            console.log('control click');
            var command = $(e.target).data('command');
            var id = $(e.target).data('id');

            console.log($(e.target));

            switch (command) {
            case 'reload':
                this.reloadProject(id);
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
