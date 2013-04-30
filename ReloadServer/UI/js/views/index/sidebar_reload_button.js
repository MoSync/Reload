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
            'click #reload-button': 'doReload',
            'click #debug-button':  'doDebug'
        },

        initialize: function (options) {

            this.parent = options.parent;

            _.bindAll(this,
                      'render',
                      'reload',
                      'doReload',
                      'doDebug'
                     );

            this.model = new SidebarReloadButtonModel();

            this.compiledTemplate = _.template( reloadButtonTemplate, {} );
            this.$el.html( this.compiledTemplate );
        },

        render: function () {
            return this.$el;
        },

        doDebug: function() {
            $('#reload-button').removeClass('btn-primary');
            $('#debug-button').addClass('btn-primary');
            this.debugFlag = true;
            this.reload();
        },

        doReload: function () {
            $('#reload-button').addClass('btn-primary');
            $('#debug-button').removeClass('btn-primary');
            this.debugFlag = false;
            this.reload();
        },

        reload: function () {
            var self = this;

            // Check if a project is selected.
            if (this.parent.selectedProject === null) {
                var btn = $('ul#projects');
                btn.children().css('background', 'rgb(216, 221, 228)');
                btn.attr('data-intro', 'Please select a project.');
                btn.attr('data-position', 'right');
                $('body').on('chardinJs:stop', function() {
                    btn.removeAttr('data-intro');
                    btn.removeAttr('data-position');
                });
                $('body').chardinJs('start');

                return;
            }

            // Check if any device is connected.
            if (this.parent.deviceCount === 0) {
                var btn = $('#devices');
                btn.children().css('background', 'rgb(216, 221, 228)');
                btn.attr('data-intro', 'Please connect a device.');
                btn.attr('data-position', 'right');
                $('body').on('chardinJs:stop', function() {
                    btn.removeAttr('data-intro');
                    btn.removeAttr('data-position');
                });
                $('body').chardinJs('start');

                return;
            }

            this.parent.selectedProject.on('reloaded', function(){
                self.parent.views.logView.clear();
            });
            this.parent.selectedProject.reload(this.debugFlag);

            this.debugFlag = false;
        }

    });

    return SidebarReloadButtonView;
});
