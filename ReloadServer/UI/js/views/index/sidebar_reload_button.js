define([
    'jquery',
    'underscore',
    'backbone',
    'models/index/sidebar_reload_button',
    'text!../../../templates/index/sidebar_reload_button.html'
], function($, _, Backbone, SidebarReloadButtonModel, reloadButtonTemplate){

    var SidebarReloadButtonView = Backbone.View.extend({

        reloadButton: '#reload-button',

        events: {
            'click #reload-button':  'reload'
        },

        initialize: function (options) {
            this.parent = options.parent;

            _.bindAll(this, 'render', 'reload');

            this.model = new SidebarReloadButtonModel();

            var data = {};
            this.compiledTemplate = _.template( reloadButtonTemplate, data );
        },

        render: function () {
            console.log('rendering jumbo button');

            this.$el.append( this.compiledTemplate );
        },

        reload: function () {
            var options     = {};
            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.reloadProject',
                params: [this.parent.selectedProject.get('name'), this.parent.debug],
                id: 0
            };

            options.success = function (resp) {
                console.log('reload');
                console.log(resp.result);
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
