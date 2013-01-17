define([
    'jquery',
    'underscore',
    'backbone',
    'views/index/serverip',
    'views/index/serverinfo',
    'views/index/content'
], function($, _, Backbone, ServerIpView, ServerInfoView, ContentView){

    var IndexView = Backbone.View.extend({

        name: 'index',

        initialize: function () {
            _.bindAll(this, 'render', 'close');
            this.contentView = new ContentView();
        },

        render: function () {


            // Populate current container with a subview.
            return this.$el.html( this.contentView.render() );
        },

        close: function () {
            this.contentView.close();
        }
    });

    return IndexView;
});

