(function($){
    var Project = Backbone.Model.extend({
        initialize: function() {
            console.log('p');
        },

        defaults: {
            part1: 'Project',
            part2: 'world'
        }
    });

    var Workspace = Backbone.Collection.extend({
        initialize: function() {
            console.log('collection');
        },
        model: Project
    });

    var WorkspaceView = Backbone.View.extend({
        events: {
            'click #add': 'addProject'
        },

        initialize: function() {
            _.bindAll(this, 'render', 'addProject', 'appendProject');

            this.collection = new Workspace();
            this.collection.bind('add', this.appendProject);
            this.render();
        },

        render: function() {
            var self = this;
            $('#project-list-container').append("<button id='add'>Add list item</button>");
            this.appendProject(new Project());
            _(this.collection.models).each(function(project){
                self.appendProject(project);
            }, this);
        },

        addProject: function () {
            console.log('addproj');
            var project = new Project();
            project.set({part1: 'mynewName'});
            this.collection.add(project);
        },

        appendProject: function(project) {
            console.log('appended');
            $('#project-list-container').append(project.get('part1') + '<br />');
        }
    });
    var w = new WorkspaceView();


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
            console.log('add project');
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
