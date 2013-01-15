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
            this.parent = options.parent;

            _.bindAll(this, 'render', 'appendProjectView');

            this.projectList.on('add', this.appendProjectView);
            this.projectList.on('remove', this.render);
            this.projectList.on('reset', this.render);
        },

        render: function () {

            var self = this;
            _(this.projectList.models).each(function (p) {
                self.appendProjectView(p);
            }, this);

            this.compiledTemplate = _.template( projectListTemplate );
            return this.$el.html( this.compiledTemplate );
        },

        close: function () {
            console.log('close plv');

            //COMPLETELY UNBIND THE VIEW
            this.undelegateEvents();
            this.$el.removeData().unbind();

            //Remove view from DOM
            this.remove();
            Backbone.View.prototype.remove.call(this);
        },

        appendProjectView: function (project) {
            var pv = new ProjectView({
                model: project,
                projectList: this.projectList,
                parent: this.parent
            });

            $('#projectListContainer').append( pv.render() );
        },

        selectProject: function (e) {
            e.preventDefault();

            var self = this;
            var id = $(e.target).data('id');
            var found = this.projectList.getByCid(id);

            // Hide all controls first.
            _(this.projectList.models).each(function (project) {
                if (project === found) {
                    console.log(self.parent.debug);

                    project.set({ showControls: true });
                    //project.set({ debug: self.parent.debug });

                    self.selectedProject = project;
                    self.parent.selectedProject = project;
                } else {
                    project.set({ showControls: false });
                }
            });
        }

    });

    return ProjectListView;
});
