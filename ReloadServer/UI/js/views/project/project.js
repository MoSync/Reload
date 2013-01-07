define([
    'jquery',
    'underscore',
    'backbone',
    'models/project/project',
    'text!../../../templates/project/project.html',
    'text!../../../templates/project/controls.html'
], function($, _, Backbone, ProjectModel, projectTemplate, controlsTemplate){

    var ProjectView = Backbone.View.extend({

        initialize: function (options) {

            _.bindAll(this,
                      'render',
                      'toggle',
                      'control',
                      'reloadProject',
                      'openFolder',
                      'removeProject');

            this.projectList = options.projectList;

            this.model.on('change', this.toggle);

            this.controls = _.template(controlsTemplate, {
                id: this.id,
                className: this.className
            });

            this.$controls = $(this.controls);

            this.id = (this.model.id !== undefined) ? this.model.id: this.model.cid;

            this.compiledTemplate = _.template( projectTemplate, {
                name: this.model.get('name'),
                id: this.id
            });

            this.$container = $(this.compiledTemplate);
        },

        render: function () {
            this.$el.append(this.$container);
        },

        toggle: function () {
            if (this.model.get('showControls')) {
                // Bind event to controls
                this.$controls.on('click', this.control);
                // Show controls
                this.$container.append(this.$controls);
            } else {
                // Unbind events from controls
                this.$controls.off('click', this.control);
                // Remove controls
                this.$controls.remove();
            }
        },

        control: function (e) {
            e.preventDefault();
            var command = $(e.target).data('command');
            var id = $(e.target).data('id');

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
            console.log('yey');
            console.log(this.model.get('debug'));
            console.log(this.model.get('name'));
            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.reloadProject',
                params: [this.model.get('name'), this.model.get('debug')],
                id: 0
            };

            options.success = function (resp) {
                console.log('reload');
                console.log(resp.result);
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
                id: null
            };

            var self = this;
            options.success = function (resp) {
                console.log('remove success');
                console.log(resp.result);
                self.projectList.remove(self.model);
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

