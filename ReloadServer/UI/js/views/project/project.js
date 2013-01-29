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
                      'removeProject',
                      'rename');

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
            var self = this;

            var span = this.$container.find('span');
            var oldval = span.html();

            var form = $('<form class="rename"><input value="'+oldval+'"type="text"/></form>');
            span.html(form);

            var input = form.find('input');
            input.on('click', function () {
                self.model.set({ showControls: true });
                console.log(self.model.get('showControls'));
            });

            // Save on "Return" key press.
            input.keypress(function (e) {
                var val = $(this).val();
                if (e.which === 13) {
                    e.preventDefault();
                    if (val === oldval) {
                        $(this).parent().parent().html(oldval);
                    } else {
                        $(this).parent().parent().html(val);
                        self.rename(oldval, val);
                    }

                    $(this).parent().parent().html(val);
                }
            });

            input.on('blur', function() {
                var val = $(this).val();
                if (val === oldval) {
                    $(this).parent().parent().html(oldval);
                } else {
                    $(this).parent().parent().html(val);
                    self.rename(oldval, val);
                }
            });

            input.focus();
        },

        rename: function (from, to) {
            var errors = [];
            // Check if project name is taken.
            _(this.projectList.models).each(function (p) {
                if (p.get('name') === to) {
                    errors.push('Please enter a project name that is not taken.');
                }
            });

            if (errors.length !== 0) {
                _(errors).each(function(err){
                    alert(err);
                });
            } else {
                var options     = {};
                options.url     = 'http://localhost:8283';
                options.rpcMsg  = {
                    method: 'manager.renameProject',
                    params: [from, to],
                    id: 0
                };

                options.success = function (resp) {
                    console.log('--- R e n a m e   s u c c e s s f u l ---');
                    console.log(resp.result);
                };

                options.error   = function (resp) {
                    console.log('could not rename project');
                    console.log(resp);
                };

                this.model.rpc(options);
            }
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
