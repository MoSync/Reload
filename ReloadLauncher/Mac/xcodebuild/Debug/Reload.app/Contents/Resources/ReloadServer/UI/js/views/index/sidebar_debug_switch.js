define([
    'jquery',
    'underscore',
    'backbone',
    'models/index/sidebar_debug_switch',
    'text!../../../templates/index/sidebar_debug_switch.html'
], function($, _, Backbone, SidebarDebugSwitchModel, switchTemplate){

    var SidebarDebugSwitchView = Backbone.View.extend({

        debugSwitch: '#debug-switch',

        events: {
            'click #debug-switch':  'switchDebug'
        },

        initialize: function (options) {

            this.parent = options.parent;

            _.bindAll(this, 'render', 'switchDebug');

            this.compiledTemplate = _.template( switchTemplate, {} );
        },

        render: function () {
            return this.$el.html( this.compiledTemplate );
        },

        switchDebug: function () {
            var debug = this.$(this.debugSwitch).is(':checked');
            this.parent.debug = debug;
        }

    });

    return SidebarDebugSwitchView;
});

