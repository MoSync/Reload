(function($){
    //Backbone.emulateHTTP = true;
    //Backbone.emulateJSON = true;
    Backbone.sync = function(method, model){
        console.log(method + ': ' + JSON.stringify(model));
    };
    /*
     * Project model.
     */
    var Project = Backbone.Model.extend({
        url: '/'
    });

    /*
     * A single row within workspace column.
     */
    var ProjectView = Backbone.View.extend({
        projectTpl: $('#project-template').html(),

        initialize: function(options) {
            _.bindAll(this, 'render');

            this.controls = new ProjectControlsView({
                model: this.model,
                parent: this
            });

            var self = this;
            this.model.on('change', function(){
                if(this.get('visible')) {
                    self.controls.show();
                } else {
                    self.controls.hide();
                }
            });

            this.render();
        },
        render: function() {
            // Parse template and set values
            var id = (this.model.id !== undefined)? this.model.id: this.model.cid;
            this.className = 'projectContainerEven'+id;
            var t = _.template(this.projectTpl, { name: this.model.get('name'), id: id, className: this.className });
            this.container = t; // keep internal element reference for call from controls.
            this.$el.append(t);
        },
    });

    var ProjectControlsView = Backbone.View.extend({
        template: $('#project-controls-template').html(),

        initialize: function(options) {
            this.parent = options.parent;
            _.bindAll(this, 'render', 'hide', 'show');
            this.render();
        },

        render: function() {
        },

        show: function() {
            var t = _.template(this.template, { className: this.model.cid});
            $('.'+this.parent.className).append(t);
        },

        hide: function() {
            $('.projectControls' + this.model.cid).remove();
        }
    });

    var WorkspaceControlsView = Backbone.View.extend({
        template: $('#workspace-controls-template').html(),

        events: {
            'click a#add-project': 'addProject'
        },

        initialize: function(options) {
            _.bindAll(this, 'render', 'addProject');
            this.workspace = options.workspace;
            this.render();
        },

        render: function() {
            console.log(this.template);
            var t = _.template(this.template);
            this.$el.append(t);
        },

        addProject: function() {
            console.log('add project');
            this.workspace.addProject();
        }
    });

    /*
     * A collection of projects within given directory.
     */
    var Workspace = Backbone.Collection.extend({
        model: Project
    });

    /*
     * A view of projects withing a workspace.
     */
    var WorkspaceView = Backbone.View.extend({
        events: {
            'click a': 'selectProject'
        },

        initialize: function() {
            _.bindAll(this, 'render', 'addProject', 'appendProject');

            this.collection = new Workspace();
            this.collection.bind('add', this.appendProject);

            this.render();
        },

        render: function() {
            console.log('render workspace view');
            var self = this;
            _(this.collection.models).each(function(project){
                self.appendProject(project);
            }, this);
        },

        addProject: function () {
            var self = this;

            var project = new Project();
            // Add project to the workspace collection only when name is set from the dialog.
            project.on('change', function() {
                project.save();
                self.collection.add(project);
            });

            // Open dialog and ask for project name and type.
            var apdv = new AddProjectDialogView(project);

        },

        appendProject: function(project) {
            var pv = new ProjectView({
                model: project,
                el: this.el
            });

            this.$el.append(pv);
        },

        selectProject: function(e) {
            var id = $(e.target).data('id');
            var project = this.collection.getByCid(id);

            // Hide all controls first.
            _(this.collection.models).each(function(project){
                project.set({visible: false});
            });

            // Reveal controls for a specific project row.
            project.set({visible: true});

        }
    });

    var AddProjectDialogView = Backbone.View.extend({
        el: $("#new-project-dialog"),

        initialize: function(project) {
            this.project = project;
            _.bindAll(this, 'render');
            this.render();
        },

        render: function() {
            var context = this;
            // Show dialog
            this.$el.dialog({
                autoOpen : false,
                title : "Create New Project",
                width : 450,
                modal : true,
                buttons : {
                    "Create" : function() {
                        var type = "web";
                        var rdolist = document.getElementsByName("projectType");
                        var newProjectName = document.getElementById("newProjectName");

                        if(rdolist[0].checked) {
                            type = "native";
                        }

                        if(newProjectName.value !== "") {

                            context.project.set({
                                name: newProjectName.value,
                                type: type
                            });

                            $(this).dialog("close");
                        } else {
                            alert("Please enter A Project Name!");
                        }
                    },
                    "Cancel" : function() {
                        $(this).dialog("close");
                    }
                },
                close : function(event, ui) {
                }
            }).dialog('open');
        },
    });

    /*
     * Init workspace and workspace controls.
     */
    var workspace = new WorkspaceView({
        el: $('#projectListContainer')
    });

    var workspaceControls = new WorkspaceControlsView({
        el: $('#file-options'),
        workspace: workspace
    });


    var ChangeWorkspaceDialog = Backbone.View.extend({
        changeWorkspaceDialog:  $("#change-workspace-dialog"),

        initialize: function(context) {
            this.context = context;
            _.bindAll(this, 'render');
            this.render();
        },

        render: function() {
            var context = this.context;

            this.changeWorkspaceDialog.dialog({
                autoOpen : false,
                title : "Change Workspace Path",
                width : 400,
                modal : true,
                buttons : {
                    "Change" : function() {
                        var workspacePath = document.getElementById("workspacePath");
                        if(workspacePath.value !== "") {
                            context.setWorkspacePath(workspacePath.value);
                            $(this).dialog("close");
                        } else {
                            alert("Please enter a path!");
                        }
                    },
                    "Cancel" : function() {
                        context.getWorkspacePath();
                        $(this).dialog("close");
                    }
                },
                close : function(event, ui) {}
            }).dialog('open');
        }
    });

    var WebUiView = Backbone.View.extend({
        workspacePath:          '',

        serverIpPlaceholder:    $('.server-info'),

        addProjectBtn:          $('#add-project'),
        updateProjectListBtn:   $('#update-project-list'),
        changeWorkspaceBtn:     $('#change-workspace'),
        reloadBtn:              $('#reload-button'),


        serverPath: 'http://localhost',
        serverPort: 8283,


        initialize: function() {
            _.bindAll(this, 'render', 'getServerIp', 'changeWorkspace', 'setWorkspacePath', 'getWorkspacePath');
            this.render();
        },

        render: function() {
            // Set server IP when page loads
            this.getServerIp($(this.serverIpPlaceholder));

            // UI bindings
            this.addProjectBtn.bind('click', this.addProject);
            this.updateProjectListBtn.bind('click', this.updateProjectList);
            this.changeWorkspaceBtn.bind('click', this.changeWorkspace);

            this.reload();
        },

        addProject: function() {
            //console.log('add project');
        },

        getProjectList: function() {
            console.log('get project list');

            var data = {
                "method" :  "manager.getProjectLIst",
                "params" :  [],
                "id" :      0
            };

            var success = function(result) {
                console.log("getProjectList: " +result.result);
            };

            var error = function(result) {
                console.log("getProjectList: " +'err');
                console.log(result);
            };

            var complete = function(result) {
                console.log("getProjectList: " +'comp');
                console.log(result);
            };

            this.rpcCall(data, success, error, complete);
        },

        updateProjectList: function() {
            console.log('update project list');
        },

        changeWorkspace: function() {
            // Show popout and pass it current scope
            var dialog = new ChangeWorkspaceDialog(this);
        },

        setWorkspacePath: function(path) {
            this.workspacePath = path;

            // Make current scope available to inner functions
            var context = this;

            var data = {
                "method" :  "manager.changeWorkspace",
                "params" :  [this.workspacePath],
                "id" :      0
            };

            var success = function(result) {
                console.log("result: " +result.result);

                return context.getProjectList();
            };

            var error = function(result) {
                console.log(result);
            };

            var complete = function(result) {
                console.log(result);
            };

            this.rpcCall(data, success, error, complete);
        },

        getWorkspacePath: function() {
            return this.workspacePath;
        },

        reload: function() {
            console.log('reload project');
        },

        add: function() {
            var data = {
                "method" :  "manager.add",
                "params" :  [1,1],
                "id" :      0
            };

            var success = function(res) {
                console.log('success');
                console.log(res.result);
            };
            var error = function(res) {
                console.log('err');
                console.log(res);
            };
            var complete = function(res) {
                console.log('complete');
                console.log(res);
            };

            this.rpcCall(data, success, error, complete);
        },

        getServerIp: function(placeholder) {
            var data = {
                "method" :  "manager.getNetworkIP",
                "params" :  [],
                "id" :      0
            };

            var success = function(response) {
                placeholder.append(response.result);
            };

            var error = function(res) {
                console.log('err');
                console.log(res);
            };

            var complete = function(res) {
                console.log('complete');
                console.log(res);
            };

            this.rpcCall(data, success, error, complete);
        },

        rpcCall: function(data, success, error, complete) {
            var d = JSON.stringify(data);
            $.ajax({
                url:        this.serverPath + ':' + this.serverPort,
                data:       d,
                type:       'POST',
                contentType:'application/json',
                dataType:   'json',
                success:    function(response) { success(response); },
                error:      function(response) { error(response); },
                complete:   function(response) { complete(response); }
            });
        }
    });

    var ui = new WebUiView();
})(jQuery);
