define([
    'jquery',
    'underscore',
    'backbone',
    'models/workbench/workbench',
    'text!../../../templates/workbench/main.html'
], function($, _, Backbone, WorkbenchModel, workbenchTemplate){

    var WorkbenchView = Backbone.View.extend({

        name: 'workbench',

        initialize: function() {

            _.bindAll(this,
                'render',
                'close',
                'createUI',
                'saveData');

            this.model = new WorkbenchModel();

            this.createUI();
        },

        createUI: function() {

            var self = this;

            var compiledTemplate = _.template(workbenchTemplate, {});
            self.$el.html(compiledTemplate);

            var editorHolder = self.$el.find("div > textarea");

            self.editor = CodeMirror.fromTextArea(
                editorHolder.get(0),
                {
                    mode: "javascript",
                    indentUnit: 4,
                    lineNumbers: true,
                });

            // Install change handler, beause we are
            // removing it later on. This is to avoid
            // an extra model update on refresh.
            self.editor.on("change", self.saveData);

            // Create a global object that can be referenced from the UI buttons.
            // TODO: What is the best way of doing this?
            window.reload_workbench = {};

            // Add function to be called from the UI.
            window.reload_workbench.doit = function(code)
            {
                if (self.editor.somethingSelected())
                {
                    var script = self.editor.getSelection();
                    self.model.doit(script);
                }
            };
        },

        saveData: function(instance, changeObj) {
            this.model.setData(this.editor.getValue());
        },

        render: function() {

            var self = this;

            // Remove chanhe handler to avoid model update.
            self.editor.off("change", self.saveData);

            self.model.getData(function(data) {
                if (data) {
                    self.editor.setValue(data);
                }
            });

            setTimeout(function() {
                self.editor.refresh();
                self.editor.focus();
                // Reinstall change handler again.
                self.editor.on("change", self.saveData);
                }, 1);
        },

        close: function () {

            //COMPLETELY UNBIND THE VIEW
            this.undelegateEvents();
            this.$el.removeData().unbind();

            //Remove view from DOM
            this.remove();
            Backbone.View.prototype.remove.call(this);

            // TODO: Save data to file.
        }
    });

    // Our module now returns our view
    return WorkbenchView;
});
