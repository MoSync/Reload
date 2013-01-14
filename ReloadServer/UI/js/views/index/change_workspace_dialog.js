define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/index/change_workspace_dialog.html'
], function($, _, Backbone, dialogTemplate){

    var ChangeWorkspaceDialog = Backbone.View.extend({

        events: {
            'click button#submit': 'submit',
            'click button#close': 'close'
        },

        initialize: function (options) {
            _.bindAll(this, 'render', 'submit', 'close');

            this.projectList = options.projectList;

            this.compiledTemplate = _.template( dialogTemplate, { path: this.projectList.path } );
            this.$el = $(this.compiledTemplate);
        },

        submit: function () {
            var workspacePath = $('#workspace-path');
            console.log(workspacePath.val());

            if (workspacePath.val().length !== 0) {
                this.projectList.path = workspacePath.val();
                // trigger 'change:path' evenet to execute rpc call
                // in sidebar.js and persist changed path on server.
                this.projectList.trigger('change:path');

                this.close();

            } else {
                alert("Please enter a workspace path.");
            }
        },

        close: function () {

            // Don't remove until transition is complete.
            this.$el.on('hidden', function () {
                this.remove();
            });

            this.$el.modal('hide');
        },

        render: function () {


            //var self = this;
            this.$el.modal('show');
            //$(this.compiledTemplate).dialog({
                //autoOpen : false,
                //title : "Change Workspace Path",
                //width : 400,
                //modal : true,
                //buttons : {
                    //"Change" : function () {
                        //var workspacePath = document.getElementById("workspacePath");
                        //if (workspacepath.value !== "") {
                            //self.projectlist.path = workspacepath.value;
                            //// trigger 'change:path' evenet to execute rpc call
                            //// in sidebar.js and persist changed path on server.
                            //self.projectlist.trigger('change:path');
                            //$(this).dialog("close");
                            //$(this).remove();
                        //} else {
                            //alert("please enter a path!");
                        //}
                    //},
                    //"Cancel" : function () {
                        //$(this).dialog("close");
                        //$(this).remove();
                    //}
                //},
                //close : function (event, ui) {}
            //}).dialog('open');

        }

    });

    return ChangeWorkspaceDialog;
});
