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

            this.model = new SidebarDebugSwitchModel();

            var data = {};
            this.compiledTemplate = _.template( switchTemplate, data );
        },

        render: function () {
            console.log('rendering debug switch');

            this.$el.append( this.compiledTemplate );
        },

        switchDebug: function () {
            var debug = this.$(this.debugSwitch).is(':checked');

            this.model.set({ debug: debug });
            this.parent.debug = debug;

            console.log(this.model.get('debug'));
        }

    });

    return SidebarDebugSwitchView;
});

