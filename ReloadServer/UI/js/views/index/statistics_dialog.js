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

            _.bindAll(this, 'render', 'close', 'submit');
            this.model = new StatisticsModel();
            this.compiledTemplate = _.template( dialogTemplate, {} );
            this.$el = $(this.compiledTemplate);
        },

        submit: function () {

            console.log('submit');
            var statsValue,
                options    = {};

            if ($('#statsCheckbox').is(":checked")) {
                statsValue = true;
            }
            else {
                statsValue = false;
            }

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
            var self = this;
            
            // Don't remove until transition is complete.
            this.$el.on('hidden', function () {
                self.remove();
            });

            this.$el.modal('hide');
        },

        render: function () {
            // Check if statistics gathering is already confirmed by
            // the user.
            var options = {};
            options.rpcMsg  = {
                method: "manager.getConfig",
                params: ["statistics"],
                id: 0
            };

            var self = this;
            options.success = function (resp) {
                // Display stats confirmation dialog if config is not
                // yet created.
                if(resp.result === "undefined") {
                    console.log('--- render popup ---');
                    self.$el.modal('show');
                }
                //console.log(resp);
            };

            options.error = function (resp) {
                console.log("resp");
                console.log(resp);
            };

            this.model.rpc(options);

        }

    });

    return StatisticsDialog;
});
