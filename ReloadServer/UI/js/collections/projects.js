define([
   'underscore',
   'backbone',
   'models/project/project'
], function(_, Backbone, ProjectModel){

    var ProjectCollection = Backbone.Collection.extend({
        model: ProjectModel,
        path: null,

        initialize: function () {
            _.bindAll(this, 'populate', 'rePopulate', 'setpath');
            this.populate();
            this.setpath();
        },

        populate: function () {
            // Populate with records.
            var options     = {};
            options.rpcMsg  = {
                method: 'manager.getProjectList',
                params: [''],
                id:     null
            };

            var self = this;
            options.success = function (resp) {
                _.map(resp.result, function (p) {
                    self.push(new ProjectModel(p));
                });
            };

            options.error   = function (resp) {
                console.log('could not get project list');
                console.log(resp);
            };

            this.rpc(options);

        },

        rePopulate: function () {
            this.reset();
            this.populate();
        },

        setpath: function (callback) {
            // Set current workspace path.
            var options     = {};
            options.rpcMsg  = {
                method: 'manager.getWorkspacePath',
                params: [''],
                id:     null
            };

            var self = this;
            options.success = function (resp) {
                console.log('!!!!! setpath');
                console.log(resp);
                self.path = resp.result.path;
                if(typeof callback !== 'undefined') {
                    callback();
                }
            };

            options.error   = function (resp) {
                console.log('could not get workspace path');
                console.log(resp);
            };

            this.rpc(options);
        }

    });

    return ProjectCollection;
});
