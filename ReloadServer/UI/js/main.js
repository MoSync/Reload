(function ($) {

    var rpc = {
        rpc: function (options) {
            var xhr = (this.sync || Backbone.sync).call(this, 'rpc', this, options);
        }
    };
    _.extend(Backbone.Collection.prototype, rpc);
    _.extend(Backbone.Model.prototype, rpc);

    Backbone.sync = function (method, model, options) {

        var resp,
            params = {};

        params.url          = options.url;
        params.data         = JSON.stringify(options.rpcMsg);
        params.contentType  = 'application/json';
        params.type         = 'POST';
        params.dataType     = 'json';

        // Only rpc calls are supported for now.
        if (method === 'rpc') {
            resp = $.ajax(_.extend(params, options));
        } else {
            console.log(method + ' is not supported.');
        }

        if (!resp) {
            options.error("Record not found");
        }
    };

    /*
     * SAMPLE
     * Model making a RPC call.
     * Must contain 'url' and 'rcpMsg' fields for Backbone.sync to read and make
     * ajax call. rpc method takes options argument containing functions for
     * handling succes and error cases.
     */
    var Model = Backbone.Model.extend({

        initialize: function () {

            this.set({name: 'My Model'});

            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.add',
                params: [1, 1],
                id: null
            };
            options.success = function (resp) { console.log(resp); };
            options.error   = function (resp) { console.log(resp); };

            this.rpc(options);
        }
    });

    //var m = new Model();

    /*
     * Project model.
     */
    var Project = Backbone.Model.extend({
    });

    /*
     * A single row within workspace column.
     */
    var ProjectView = Backbone.View.extend({
        projectTpl: $('#project-template').html(),
        controlsTpl: $('#project-controls-template').html(),

        initialize: function (options) {

            this.projectCollection = options.projectCollection;

            _.bindAll(this, 'render', 'control', 'openFolder', 'removeProject', 'reloadProject');

            var self = this;

            this.model.on('change', this.toggle, this);
            this.model.on('destroy', this.close, this);

            // Parse template and set values
            this.id = (this.model.id !== undefined) ? this.model.id: this.model.cid;
            this.className = 'projectContainerEven' + this.id;
            this.container = _.template(this.projectTpl, {
                name: this.model.get('name'),
                id: this.id,
                className: this.className
            });

            this.$container = $(this.container);

            this.controls = _.template(this.controlsTpl, {
                id: this.id,
                className: this.className
            });
            this.$controls = $(this.controls);

            this.render();
        },

        render: function () {
            this.$el.append(this.$container);
        },

        reloadProject: function (id) {
            var debug = false;
            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.reloadProject',
                params: [this.model.get('name'), debug],
                id: 0
            };

            options.success = function (resp) {
                console.log('reload');
                console.log(resp);
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
                console.log(JSON.parse(resp.result));
            };

            options.error   = function (resp) {
                console.log('could not open project folder');
                console.log(resp);
            };

            this.model.rpc(options);
        },

        removeProject: function (id) {
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
                self.projectCollection.remove(self.model);
            };

            options.error   = function (resp) {
                console.log('could not remove project folder');
                console.log(resp);
            };

            this.projectCollection.rpc(options);
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
        }

    });

    var WorkspaceControlsView = Backbone.View.extend({
        template: $('#workspace-controls-template').html(),

        events: {
            'click a#add-project': 'addProject',
            'click a#change-workspace': 'changeWorkspaceDialog',
            'click a#update-project-list': 'updateProjectList'
        },

        initialize: function (options) {
            _.bindAll(this,
                      'render',
                      'addProject',
                      'changeWorkspaceDialog',
                      'changeWorkspace',
                      'updateProjectList'
                     );
            this.workspace = options.workspace;
            this.render();
        },

        render: function () {
            var t = _.template(this.template);
            this.$el.append(t);
        },

        addProject: function () {
            console.log('add project');
            this.workspace.addProject();
        },

        updateProjectList: function () {
            this.workspace.reRender();
        },

        changeWorkspaceDialog: function () {
            var dialog = new ChangeWorkspaceDialog({
                controls: this,
                currentPath: this.workspace.collection.path
            });
        },

        changeWorkspace: function (path) {

            var newWorkspacePath = path;

            // Change only if new path is provided
            if (newWorkspacePath !== this.workspace.collection.path) {
                console.log('Change workspace to ' + path);
                var options     = {};
                options.url     = 'http://localhost:8283';
                options.rpcMsg  = {
                    method: 'manager.changeWorkspacePath',
                    params: [newWorkspacePath],
                    id: null
                };

                var workspace = this.workspace;
                options.success = function (resp) {
                    console.log('changed workspace path to ' + newWorkspacePath);
                    workspace.collection.path = newWorkspacePath;
                    // Signal path change.
                    workspace.collection.trigger('change:path');
                };

                options.error   = function (resp) {
                    console.log('could not change workspace path');
                    console.log(resp);
                };

                this.workspace.collection.rpc(options);
            }

        }
    });

    /*
     * Collection of projects within given directory.
     */
    var Workspace = Backbone.Collection.extend({
        model: Project,
        path: '',

        initialize: function () {
            _.bindAll(this, 'setPath');
            // Get current workspace path.
            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.getWorkspacePath',
                params: [],
                id: null
            };

            var setPath = this.setPath;
            options.success = function (resp) {
                console.log('workspace path is ' + resp.result.path);
                setPath(resp.result.path);
            };

            options.error = function (resp) {
                console.log('could not get workspace path');
                console.log(resp);
            };

            this.rpc(options);
        },

        setPath: function (path) {
            this.path = path;
            console.log(this.path);
        }
    });

    /*
     * View of projects withing a workspace.
     */
    var WorkspaceView = Backbone.View.extend({
        debugSwitch: $('#debug-switch'),
        bigReload: $('#big-reload'),

        debug: false,

        selectedProject: null,
        events: {
            'click a.select-project': 'selectProject'
        },

        initialize: function () {
            _.bindAll(this,
                      'render',
                      'reRender',
                      'addProject',
                      'appendProject',
                      'populate',
                      'clear',
                      'switchDebug',
                      'reload'
                     );

            this.debugSwitch.bind('click', this.switchDebug);

            this.bigReload.bind('click', this.reload);

            this.collection = new Workspace();

            this.collection.bind('add', this.appendProject);

            this.collection.bind('reset', function () {
                console.log('rest');
            });

            this.collection.bind('remove', this.reRender);

            // Empty on collection change.
            this.collection.bind('change:path', this.reRender);

            this.populate();

            this.render();
        },

        switchDebug: function () {
            this.debug = this.debugSwitch.is(':checked');
            console.log(this.debug);
        },

        reload: function () {
            console.log('reload from big button');
            if (this.selectedProject === null) {
                alert('Select a project first.');
            } else {
                var options     = {};
                options.url     = 'http://localhost:8283';
                options.rpcMsg  = {
                    method: 'manager.reloadProject',
                    params: [this.selectedProject.get('name'), this.debug],
                    id: null
                };

                options.success = function (resp) {
                    console.log('reload successful!');
                    console.log(resp);
                };

                options.error   = function (resp) {
                    console.log('could not reload project.');
                    console.log(resp);
                };

                this.selectedProject.rpc(options);

            }
        },

        clear: function () {
            this.collection.reset();
            // Remove all objects from dom
            this.$el.empty();

        },

        render: function () {
            console.log('render');
            var self = this;
            _(this.collection.models).each(function (project) {
                self.appendProject(project);
            }, this);
        },

        reRender: function () {
            console.log('reRender');
            // Empty model collection
            this.clear();
            // Empty DOM list
            this.$el.empty();
            // Rebuild the collection and DOM elements
            this.populate();
        },

        populate: function () {
            var self = this;

            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.getProjectList',
                params: [],
                id: null
            };

            options.success = function (resp) {
                _.map(JSON.parse(resp.result), function (p) {
                    self.collection.push(new Project(p));
                });
            };

            options.error   = function (resp) {
                console.log('could not retrieve project list');
                console.log(resp);
            };

            this.collection.rpc(options);
        },


        addProject: function () {
            var self = this;

            // Build options for RPC call.
            var options     = {};
            options.url     = 'http://localhost:8283';

            var project = new Project();
            // Add project to the workspace collection only when name is set from the dialog.
            project.on('change', function () {

                options.success = function (resp) {
                    console.log('project saved!');
                    console.log(resp);
                    // Add to collection on successful creation.
                    self.collection.add(project);
                };

                options.error   = function (resp) {
                    console.log('could not save project');
                    console.log(resp);
                };

                // Don't add project to the collection if it's already there.
                var project = this;
                if (_.indexOf(self.collection.models, project) === -1) {
                    options.rpcMsg  = {
                        method: 'manager.createNewProject',
                        params: [project.get('name'), project.get('type')],
                        id: null
                    };
                    // Let server create the project in file system.
                    project.rpc(options);

                } else {
                    console.log('in collection');
                }
            });

            project.on('reload', function () {
                console.log('reload it');
            });

            project.on('remove', function () {
                console.log('destroyed');
            });

            // Open dialog and ask for project name and type.
            var apdv = new AddProjectDialogView(project);

        },

        removeProject: function () {
            console.log('remove');
        },

        appendProject: function (project) {
            var self = this;

            var pv = new ProjectView({
                model: project,
                el: self.el,
                parent: self,
                projectCollection: self.collection
            });

            this.$el.append(pv);
        },

        selectProject: function (e) {
            var self = this;
            var id = $(e.target).data('id');
            var found = this.collection.getByCid(id);

            // Hide all controls first.
            _(this.collection.models).each(function (project) {
                if (project === found) {
                    project.set({showControls: true});
                    self.selectedProject = project;
                } else {
                    project.set({showControls: false});
                }
            });

            // Reveal controls for a specific project row.
            //project.set({visible: true});

        }
    });

    var AddProjectDialogView = Backbone.View.extend({
        el: $("#new-project-dialog"),

        initialize: function (project) {
            this.project = project;
            _.bindAll(this, 'render');
            this.render();
        },

        render: function () {
            var context = this;
            // Show dialog
            this.$el.dialog({
                autoOpen : false,
                title : "Create New Project",
                width : 450,
                modal : true,
                buttons : {
                    "Create" : function () {
                        var type = "web";
                        var rdolist = document.getElementsByName("projectType");
                        var newProjectName = document.getElementById("newProjectName");

                        if (rdolist[0].checked) {
                            type = "native";
                        }

                        if (newProjectName.value !== "") {

                            context.project.set({
                                name: newProjectName.value,
                                type: type
                            });

                            $(this).dialog("close");
                        } else {
                            alert("Please enter A Project Name!");
                        }
                    },
                    "Cancel" : function () {
                        $(this).dialog("close");
                    }
                },
                close : function (event, ui) {
                }
            }).dialog('open');
        }
    });

    var ChangeWorkspaceDialog = Backbone.View.extend({
        changeWorkspaceDialog:  $("#change-workspace-dialog"),

        initialize: function (options) {
            this.controls = options.controls;
            _.bindAll(this, 'render');
            $('#workspacePath').val(options.currentPath);
            this.render();
        },

        render: function () {
            var controls = this.controls;

            this.changeWorkspaceDialog.dialog({
                autoOpen : false,
                title : "Change Workspace Path",
                width : 400,
                modal : true,
                buttons : {
                    "Change" : function () {
                        var workspacePath = document.getElementById("workspacePath");
                        if (workspacePath.value !== "") {
                            controls.changeWorkspace(workspacePath.value);
                            $(this).dialog("close");
                        } else {
                            alert("Please enter a path!");
                        }
                    },
                    "Cancel" : function () {
                        $(this).dialog("close");
                    }
                },
                close : function (event, ui) {}
            }).dialog('open');
        }
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



    var WebUiView = Backbone.View.extend({
        workspacePath:          '',

        serverIpPlaceholder:    $('.server-info'),

        addProjectBtn:          $('#add-project'),
        updateProjectListBtn:   $('#update-project-list'),
        changeWorkspaceBtn:     $('#change-workspace'),
        reloadBtn:              $('#reload-button'),


        serverPath: 'http://localhost',
        serverPort: 8283,


        initialize: function () {
            _.bindAll(this, 'render', 'getServerIp', 'changeWorkspace', 'setWorkspacePath', 'getWorkspacePath');
            this.render();
        },

        render: function () {
            // Set server IP when page loads
            this.getServerIp($(this.serverIpPlaceholder));

            // UI bindings
            this.addProjectBtn.bind('click', this.addProject);
            this.updateProjectListBtn.bind('click', this.updateProjectList);
            //this.changeWorkspaceBtn.bind('click', this.changeWorkspace);

            this.reload();
        },

        addProject: function () {
            //console.log('add project');
        },

        getProjectList: function () {
            console.log('get project list');

            var data = {
                "method" :  "manager.getProjectLIst",
                "params" :  [],
                "id" :      0
            };

            var success = function (result) {
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
            //var dialog = new ChangeWorkspaceDialog(this);
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
