define([
    'jquery',
    'underscore',
    'backbone',
    'models/index/statistics',
    'text!../../../templates/index/statistics_dialog.html'
], function($, _, Backbone, StatisticsModel, dialogTemplate){

    var StatisticsDialog = Backbone.View.extend({

        events: {
            'click button#submit': 'submit',
        },

        initialize: function () {

            _.bindAll(this, 'render');
            this.model = new StatisticsModel;
            this.compiledTemplate = _.template( dialogTemplate, {} );
            this.$el = $(this.compiledTemplate);
        },

        submit: function () {
            
            var statsValue = undefined,
                options    = {};

            if ($('#statsCheckbox').is(":checked")) {
                statsValue = true;
            }
            else {
                statsValue = false;
            }

            options.url     = 'http://localhost:8283';
            options.rpcMsg  = {
                method: 'manager.setConfig',
                params: ["statistics", statsValue],
                id: 0
            };

            options.success = function (resp) {
                console.log('reload');
                console.log(resp.result);
            };

            options.error   = function (resp) {
                console.log('could not remove project folder');
                console.log(resp);
            };

            this.model.rpc(options);

            this.close();
        },

        close: function () {

            // Don't remove until transition is complete.
            this.$el.on('hidden', function () {
                this.remove();
            });

            this.$el.modal('hide');
        },

        render: function () {
            this.$el.modal('show');
        }

    });

    return StatisticsDialog;
});
