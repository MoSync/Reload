define([
    'jquery'
], function ($) {

    var ViewHandler = function () {

        return {
            show: function(view) {

                if (this.currentView) {
                    this.currentView.close();
                }

                this.currentView = view;
                this.currentView.render();

                $('#content').html( this.currentView.el );
            }
        };
    };

    return ViewHandler;
});

