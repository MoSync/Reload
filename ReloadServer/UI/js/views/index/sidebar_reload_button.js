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
            console.log('debug');
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

            var options     = {};
            options.url     = 'http://localhost:8283';

            options.rpcMsg  = {
                method: 'manager.reloadProject',
                params: [this.parent.selectedProject.get('name'), this.debugFlag],
                id: 0
            };

            options.success = function (resp) {
                console.log('reload');
                console.log(resp.result);
                self.parent.views.logView.clear();
            };

            options.error   = function (resp) {
                console.log('could not reload');
                console.log(resp);
            };
            this.model.rpc(options);
        }

    });

    return SidebarReloadButtonView;
});
