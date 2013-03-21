require(['codemirror.mode.javascript', 'jquery.draggable']);
define([
    'jquery',
    'underscore',
    'backbone',
    'codemirror',
    'models/workbench/workbench',
    'views/log/main',
    'text!../../../templates/workbench/main.html',
    'text!../../../templates/workbench/controls.html'
], function($, _, Backbone, CodeMirror,  WorkbenchModel, LogView, workbenchTemplate, controlsTemplate){

    var WorkbenchView = Backbone.View.extend({

        name: 'workbench',

        tagName: 'div',
        className: 'workbenchView',

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

            var compiledTemplate = _.template(workbenchTemplate, {});
            var codeContainer = $('<div id="code"></div>');
            codeContainer.append(compiledTemplate);
            this.$el.append(codeContainer);

            // Render controls.
            compiledTemplate = _.template(controlsTemplate, {});
            self.$el.append(compiledTemplate);

            this.logView = new LogView();
            this.logView.render();
            self.$el.append(this.logView.el);

            var editorHolder = codeContainer.find("textarea");
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
            //self.editor.on("change", self.saveData);

            // Create a global object that can be referenced from the UI buttons.
            // TODO: What is the best way of doing this?
/*
 *            window.reload_workbench = {};
 *
 *            // Add function to be called from the UI.
 *            window.reload_workbench.doit = function(code)
 *            {
 *                if (self.editor.somethingSelected())
 *                {
 *                    var script = self.editor.getSelection();
 *                    self.model.doit(script);
 *                }
 *            };
 */
        },

        doit: function (e) {
            e.preventDefault();
            if (this.editor.somethingSelected()) {
                var script = this.editor.getSelection();
                this.model.doit(script);
            }
        },

        saveData: function(instance, changeObj) {
            this.model.setData(this.editor.getValue());
        },

        render: function() {
            this.delegateEvents();

            this.logView.render();
            this.$el.append(this.logView.el);

            var self = this;

            var handleBar = self.$el.find('#controls-workbench');
            handleBar.css('position','absolute');
            handleBar.draggable({
                axis: 'y',
                containment: 'parent',
                start: function () {
                },
                stop: function () {
                },
                drag: function () {
                    var wbH =      $('.workbenchView').height(),
                        dragPos =  $('#controls-workbench').position().top,
                        ctrlH =    $('#controls-workbench').height();

                    // Update Log view.
                    $('.logView').css('height', wbH - dragPos - ctrlH);
                    // Update CodeMirror view.
                    $('#code').css('height', dragPos);
                }
            });

            // Remove chanhe handler to avoid model update.
            //self.editor.off("change", self.saveData);

            self.model.getData(function(data) {
                if (data) {
                    self.editor.setValue(data);
                }
            });

            setTimeout(function() {
                self.editor.refresh();
                self.editor.focus();
                 //Reinstall change handler again.
                self.editor.on("change", self.saveData);
                }, 1);
        },

        close: function () {
            this.logView.close();

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
