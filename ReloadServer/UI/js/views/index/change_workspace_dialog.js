define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/index/change_workspace_dialog.html'
], function($, _, Backbone, dialogTemplate){

    var ChangeWorkspaceDialog = Backbone.View.extend({

        el: $('body'),
        initialize: function (options) {
            _.bindAll(this, 'render');

            this.projectList = options.projectList;

            this.compiledTemplate = _.template( dialogTemplate, { path: this.projectList.path } );
        },

        render: function () {

            var self = this;
            $(this.compiledTemplate).dialog({
                autoOpen : false,
                title : "Change Workspace Path",
                width : 400,
                modal : true,
                buttons : {
                    "Change" : function () {
                        var workspacePath = document.getElementById("workspacePath");
                        if (workspacePath.value !== "") {
                            self.projectList.path = workspacePath.value;
                            // Trigger 'change:path' evenet to execute RPC call
                            // in sidebar.js and persist changed path on server.
                            self.projectList.trigger('change:path');
                            $(this).dialog("close");
                            $(this).remove();
                        } else {
                            alert("Please enter a path!");
                        }
                    },
                    "Cancel" : function () {
                        $(this).dialog("close");
                        $(this).remove();
                    }
                },
                close : function (event, ui) {}
            }).dialog('open');

        }

    });

    return ChangeWorkspaceDialog;
});
