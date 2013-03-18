define([
    'jquery',
    'underscore',
    'backbone',
    'models/index/sidebar_reload_button',
    'text!../../../templates/index/sidebar_reload_button.html'
], function($, _, Backbone, SidebarReloadButtonModel, reloadButtonTemplate){

    var SidebarReloadButtonView = Backbone.View.extend({

        reloadButton: '#reload-button',

        debugFlag: false,

        events: {
            'click #reload-button': 'nodebug',
            'click #debug-button':  'debug'
        },

        initialize: function (options) {

            this.parent = options.parent;

            _.bindAll(this,
                      'render',
                      'nodebug',
                      'debug');

            this.model = new SidebarReloadButtonModel();

            this.compiledTemplate = _.template( reloadButtonTemplate, {} );
            this.$el.html( this.compiledTemplate );
        },

        render: function () {
            return this.$el;
        },

        debug: function() {
            this.debugFlag = true;
            this.reload();
        },

        nodebug: function() {
            this.debugFlag = false;
            this.reload();
        },

        reload: function () {

            var self = this;

            // Check if a project is selected.
            if (this.parent.selectedProject === null) {
                alert ('Please select a project.');
                return;
            }

            // Check if any device is connected.
            if (this.parent.deviceCount === 0) {
                alert ('Please connect a device.');
                return;
            }

            this.parent.selectedProject.on('reloaded', function(){
                self.parent.views.logView.clear();
            });
            this.parent.selectedProject.reload(this.debugFlag);
        }

    });

    return SidebarReloadButtonView;
});
