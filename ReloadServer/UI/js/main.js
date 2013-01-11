require.config({
    paths: {
        'jquery':     'vendor/jquery-1.7.2.min',
        'underscore': 'vendor/underscore-1.4.3.min',
        'backbone':   'vendor/backbone-0.9.2.min'
    },
    // Define non AMD modules
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: ["underscore", "jquery"],
            exports: "Backbone"
        }
    }
});

require([
        // Load our app module and pass it to our definition function
        'reload'
    ], function (Reload) {
        // The "reload" dependency is passed in as "Reload"
        Reload.initialize();
    });
