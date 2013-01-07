define([
   'underscore',
   'backbone'
], function(_, Backbone){
    var SidebarDebugSwitchModel = Backbone.Model.extend({
        defaults: {
            'debug': false
        }
    });

    return SidebarDebugSwitchModel;
});
