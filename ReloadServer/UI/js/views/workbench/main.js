define([
    'jquery',
    'underscore',
    'backbone',
    'models/workbench/workbench',
    'text!../../../templates/workbench/main.html',
    'text!../../../templates/workbench/controls.html'
], function($, _, Backbone, WorkbenchModel, workbenchTemplate, controlsTemplate){

    var WorkbenchView = Backbone.View.extend({

        name: 'workbench',

        events: {
            'click #do-selection': 'doit'
        },

        initialize: function() {

            _.bindAll(this,
                'render',
                'close',
                'createUI',
                'saveData',
                'doit');

            this.model = new WorkbenchModel();

            this.createUI();
        },

        createUI: function() {

            var self = this;

            // Render controls.
            var compiledTemplate = _.template(controlsTemplate, {});
            self.$el.append(compiledTemplate);

            compiledTemplate = _.template(workbenchTemplate, {});
            self.$el.append(compiledTemplate);

            var editorHolder = self.$el.find("textarea");

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

        doit: function (e) {
            if (e) { e.preventDefault(); }
            if (this.editor.somethingSelected()) {
                var script = this.editor.getSelection();
                this.model.doit(script);
                console.log('doit');
            }
        },

        saveData: function(instance, changeObj) {
            this.model.setData(this.editor.getValue());
        },

        render: function() {
            this.delegateEvents();

            var self = this;

            // Remove chanhe handler to avoid model update.
            self.editor.off("change", self.saveData);

            self.model.getData(function(data) {
                if (data) {
                    self.editor.setValue(data);
                }
            });

            // Detect CTRL+r key combination.
            this.keyHandler = function (e) {
                console.log(e.which);
                if(e.ctrlKey && e.which === 69) { // CTRL+E
                    e.preventDefault();
                    self.doit();
                    return false;
                }
            };
            $(document).keydown(this.keyHandler);

            setTimeout(function() {
                self.editor.refresh();
                self.editor.focus();
                // Reinstall change handler again.
                self.editor.on("change", self.saveData);
                }, 1);
        },

        close: function () {

            console.log('close workbench');
            //COMPLETELY UNBIND THE VIEW
            this.undelegateEvents();
            this.$el.removeData().unbind();
            // Unbind keydown event from document object.
            $(document).unbind('keydown', this.keyHandler);

            //Remove view from DOM
            this.remove();
            Backbone.View.prototype.remove.call(this);

            // TODO: Save data to file.
        }
    });

    // Our module now returns our view
    return WorkbenchView;
});
