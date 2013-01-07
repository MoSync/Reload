define([
    'jquery',
    'underscore',
    'backbone',
    'views/project/project',
    'text!../../../templates/project/list.html'
], function($, _, Backbone, ProjectView, projectListTemplate){

    var ProjectListView = Backbone.View.extend({

        events: {
            'click a.select-project': 'selectProject'
        },

        initialize: function (options) {

            this.projectList = options.projectList;

            _.bindAll(this, 'render', 'appendProjectView');

            this.compiledTemplate = _.template( projectListTemplate );
            this.$el.append( this.compiledTemplate );

            this.projectList.on('add', this.appendProjectView);
            this.projectList.on('remove', this.render);
            this.projectList.on('reset', this.render);
        },

        render: function () {
            console.log('rendered');
            $('#projectListContainer').empty();

            var self = this;
            _(this.projectList.models).each(function (p) {
                self.appendProjectView(p);
            }, this);
        },

        appendProjectView: function (project) {
            var pv = new ProjectView({
                model: project,
                el: $('#projectListContainer'),
                projectList: this.projectList
            });

            pv.render();
        },

        selectProject: function (ev) {
            console.log('project selected');

            var self = this;
            var id = $(ev.target).data('id');
            var found = this.projectList.getByCid(id);

            // Hide all controls first.
            _(this.projectList.models).each(function (project) {
                if (project === found) {
                    project.set({ showControls: true });
                    self.selectedProject = project;
                } else {
                    project.set({ showControls: false });
                }
            });
        }

    });

    return ProjectListView;
});
