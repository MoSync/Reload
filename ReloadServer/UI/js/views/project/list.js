define([
    'jquery',
    'underscore',
    'backbone',
    'views/project/project',
    'text!../../../templates/project/list.html'
], function($, _, Backbone, ProjectView, projectListTemplate){

    var ProjectListView = Backbone.View.extend({

        events: {
            'click #projects li a': 'selectProject'
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

            $('#projects').append( pv.render() );
        },

        selectProject: function (e) {
            e.preventDefault();

            var t, p, a, self, id, found;

            t = $(e.target);
            self = this;

            p = t.parent().parent();
            a = t;
            id = t.data('id');

            if (t.is('span')) {
                p = t.parent().parent().parent();
                a = t.parent();
                id = t.parent().data('id');
            }

            found = this.projectList.getByCid(id);

            if (p.is('#projects')) {
                p.children().each(function() {
                    $(this).children().removeClass('select-project');
                    $(this).children().find('span').removeClass('project-name-clip');
                });

                a.addClass('select-project');
                a.find('span').addClass('project-name-clip');
            }

            // Hide all controls first.
            _(this.projectList.models).each(function (project) {
                if (project === found) {
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
