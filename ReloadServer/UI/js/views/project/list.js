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

            _.bindAll(this,
                      'render',
                      'appendProjectView',
                      'makeSelection',
                      'selectNext',
                      'selectPrevious');

            this.projectList.on('add', this.appendProjectView);
            this.projectList.on('remove', this.render);
            this.projectList.on('reset', this.render);
        },

        render: function () {
            var self = this;
            // Detect CTRL+ALT+DOWN key combination.
            $(document).keydown(function (e) {
                if(e.ctrlKey && e.keyCode===82) { // CTRL + R
                    e.preventDefault();
                    self.parent.selectedProject.reload();
                }

                if(e.ctrlKey && e.altKey && e.keyCode===40) { // CTRL + ALT + DOWN
                    e.preventDefault();
                    console.log('ctrl alt down');
                    self.selectNext();
                }

                if(e.ctrlKey && e.altKey && e.keyCode===38) { // CTRL + ALT + UP
                    e.preventDefault();
                    console.log('ctrl alt up');
                    self.selectPrevious();
                }
            });

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

        selectNext: function () {
            var id;

            // Select first project in the list if none is selected.
            if(!this.parent.selectedProject) {
                id = this.projectList.at(0).cid;
            } else {
                // If a selection is already made find out the id of
                // next element.
                var pos = _.indexOf(this.projectList.models, this.parent.selectedProject);
                var proj = this.projectList.at(pos+1) ? this.projectList.at(pos+1) : this.projectList.at(pos);
                id = proj.cid;
            }

            this.selectProject(id);
        },

        selectPrevious: function () {
            var id;

            // Select last project in the list if none is selected.
            if(!this.parent.selectedProject) {
                id = this.projectList.at(this.projectList.length-1).cid;
            } else {
                // If a selection is already made find out the id of
                // previous element.
                var pos = _.indexOf(this.projectList.models, this.parent.selectedProject);
                var proj = this.projectList.at(pos-1) ? this.projectList.at(pos-1) : this.projectList.at(pos);
                id = proj.cid;
            }

            this.selectProject(id);
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
            var t, id;
            if (typeof(e) === 'object') {
                e.preventDefault();
                console.log('event');
                t = $(e.target);
                id = t.data('id');
                if (t.is('span')) {
                    id = t.parent().data('id');
                }
            } else {
                id = e;
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
