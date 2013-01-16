define([
   'underscore',
   'backbone'
], function(_, Backbone){

    var WorkbenchModel = Backbone.Model.extend({

        // Stores the text in the editor.
        data: null,

        initialize: function () {
            _.bindAll(this, 'getData', 'setData');
        },

        getData: function (callback) {
            if (typeof(callback) === 'function') {
                callback(this.data);
            }
        },

        setData: function (data) {
            this.data = data;
        }
    });

    return WorkbenchModel;
});
