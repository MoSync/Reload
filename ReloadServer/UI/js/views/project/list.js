define([
    'jquery',
    'underscore',
    'backbone',
    'views/project/project',
    'text!../../../templates/project/list.html'
], function($, _, Backbone, ProjectView, projectListTemplate){

    var ProjectListView = Backbone.View.extend({

        className: 'project-list',
        events: {
            'click #projects li a': 'selectProject'
        },

        initialize: function (options) {

            this.projectList = options.projectList;
            this.parent = options.parent;

            _.bindAll(this, 'render', 'appendProjectView', 'makeSelection');

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

            if (this.parent.selectedProject) {
                if (this.parent.selectedProject.get('name') === project.get('name')) {
                    this.makeSelection(project.cid);
                }
            }

            $('#projects').append( pv.render() );
        },

        selectProject: function (e) {
            e.preventDefault();

            // Hide overlay
            $('body').chardinJs('stop');

            var t, id;
            t = $(e.target);
            id = t.data('id');
            if (t.is('span')) {
                id = t.parent().data('id');
            }
            this.makeSelection(id);
        },

        makeSelection: function (id) {
            var self = this;
            var found = this.projectList.getByCid(id);
            _(this.projectList.models).each(function (project) {
                if (project === found) {
                    project.set({ showControls: true });
                    self.parent.selectedProject = project;
                } else {
                    project.set({ showControls: false });
                }
            });
        }
    });

    return ProjectListView;
});
