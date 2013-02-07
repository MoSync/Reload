define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/index/change_workspace_dialog.html'
], function($, _, Backbone, dialogTemplate){

    var ChangeWorkspaceDialog = Backbone.View.extend({

        events: {
            'click button#submit': 'submit',
            'click button#close': 'close',
            'keypress input#workspace-path': 'captureKeys'
        },

        initialize: function (options) {
            _.bindAll(this, 'render', 'submit', 'close');

            this.projectList = options.projectList;

            var compiledTemplate = _.template( dialogTemplate, { path: this.projectList.path } );
            this.$el = $(compiledTemplate);
        },

        captureKeys: function (e) {
            e.preventDefault();

            if (e.keyCode !== 13) {
                $('#workspace-path').val($('#workspace-path').val() + String.fromCharCode(e.keyCode));
                return;
            }

            this.submit();
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
            var self = this;

            // Don't remove until transition is complete.
            this.$el.on('hidden', function () {
                self.remove();
            });

            this.$el.modal('hide');
        },

        render: function () {
            this.$el.modal('show');
        }

    });

    return ChangeWorkspaceDialog;
});
