define([
    'jquery',
    'underscore',
    'backbone',
    'views/index/sidebar_reload_button',
    'views/index/sidebar_controls',
    'views/index/sidebar_debug_switch',
    'views/project/list',
    'collections/projects',
    'text!../../../templates/index/sidebar.html'
], function($, _, Backbone, SidebarReloadButtonView, SidebarControls, SidebarDebugSwitchView, ProjectListView, ProjectCollection, sidebarTemplate){

    var SidebarView = Backbone.View.extend({

        el: $('#right-bar'),
        debug: false,
        selectedProject: null,

        initialize: function () {
            _.bindAll(this, 'render', 'changePath');
            this.collection = new ProjectCollection();

            this.collection.on('change:path', this.changePath);
        },

        render: function () {

            var data = {};
            var compiledTemplate = _.template( sidebarTemplate, data );
            this.$el.html( compiledTemplate );

            var sidebarReloadButtonView = new SidebarReloadButtonView({
                el: this.el,
                parent: this
            });
            sidebarReloadButtonView.render();

            var sidebarDebugSwitchView = new SidebarDebugSwitchView({
                el: this.el,
                parent: this
            });
            sidebarDebugSwitchView.render();

            var sidebarControls = new SidebarControls({
                el: this.el,
                projectList: this.collection
            });
            sidebarControls.render();

            var projectListView = new ProjectListView({
                el: this.el,
                projectList: this.collection,
                parent: this
            });
            projectListView.render();
        },

        changePath: function () {

            // TODO: Update only if path has changed.
            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.changeWorkspacePath',
                params: [this.collection.path],
                id: null
            };

            var self = this;
            options.success = function (resp) {
                console.log('RPC success, Changed workspace to: ' + resp.result);
                self.collection.rePopulate();
            };

            options.error   = function (resp) {
                //console.log('could not change workspace path');
                console.log(resp);
            };

            this.collection.rpc(options);

        }
    });

    return SidebarView;
});


