require.config({
    paths: {
        'jquery':     'vendor/jquery-1.7.2.min',
        'underscore': 'vendor/underscore-1.4.3.min',
        'backbone':   'vendor/backbone-0.9.2.min',
        'bootstrap':  'vendor/bootstrap.min',
        'socket.io':  '/socket.io/socket.io.js'
    },
    // Define non AMD modules
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: ["underscore", "jquery", "bootstrap"],
            exports: "Backbone"
        },
        'bootstrap': {
            deps: ["jquery"],
            exports: "$.fn.popover"
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
