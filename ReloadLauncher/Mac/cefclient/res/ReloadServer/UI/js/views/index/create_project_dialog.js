define([
    'jquery',
    'underscore',
    'backbone',
    'models/project/project',
    'text!../../../templates/index/create_project_dialog.html'
], function($, _, Backbone, ProjectModel, dialogTemplate){

    var CreateProjectDialog = Backbone.View.extend({

        initialize: function (options) {

            _.bindAll(this, 'render');

            this.project = options.project;

            this.compiledTemplate = _.template( dialogTemplate, {} );
        },

        render: function () {

            var self = this;

            $(this.compiledTemplate).dialog({
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

                            self.project.set({
                                name: newProjectName.value,
                                type: type
                            });

                            $(this).dialog("close");
                            $(this).remove();

                        } else {
                            alert("Please enter A Project Name!");
                        }
                    },
                    "Cancel" : function () {
                        $(this).dialog("close");
                        $(this).remove();
                    }
                },
                close : function (event, ui) {
                }
            }).dialog('open');
        }

    });

    return CreateProjectDialog;
});
