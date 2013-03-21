require.config({
    paths: {
        'jquery':      'vendor/jquery-1.7.2.min',
        'underscore':  'vendor/underscore-1.4.3.min',
        'backbone':    'vendor/backbone-0.9.2.min',
        'bootstrap':   'vendor/bootstrap.min',
        'stacktrace':  'vendor/stacktrace',
        'socket.io':   '/socket.io/socket.io.js',
        'codemirror':  'vendor/codemirror/lib/codemirror',
        'codemirror.mode.javascript':  'vendor/codemirror/mode/javascript/javascript',
        'jquery.draggable':      'vendor/jquery-ui-1.10.1.custom.min',
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
        stacktrace: {
            exports: 'printStackTrace'
        },
        'bootstrap': {
            deps: ["jquery"],
            exports: "$.fn.popover"
        },
        'codemirror': {
            exports: 'CodeMirror'
        },
        'codemirror.mode.javascript': {
            deps: ['codemirror']
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
