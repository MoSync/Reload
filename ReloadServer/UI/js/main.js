require.config({
    paths: {
        'jquery':                      'vendor/jquery-1.8.3.min',
        'underscore':                  'vendor/underscore-1.4.3.min',
        'backbone':                    'vendor/backbone-0.9.2.min',
        'bootstrap':                   'vendor/bootstrap.min',
        'stacktrace':                  'vendor/stacktrace',
        'socket.io':                   '/socket.io/socket.io.js',
        'codemirror':                  'vendor/codemirror/lib/codemirror',
        'codemirror.mode.javascript':  'vendor/codemirror/mode/javascript/javascript',
        'gridalicious':                'vendor/jquery.grid-a-licious.min',
        'jquery.draggable':            'vendor/jquery-ui-1.10.1.custom.min',
        'chardinjs':                   'vendor/chardinjs.min'
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

// Include CSS files programmatically.
// Something requirejs doesn't support.
function loadCss(url) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = url;
    document.getElementsByTagName("head")[0].appendChild(link);
}

require([ 'reload' ], function (Reload) {
    // The "reload" dependency is passed in as "Reload"
    Reload.initialize();
    loadCss('js/vendor/chardinjs.css');
});
