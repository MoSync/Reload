define([
    'jquery',
    'underscore',
    'backbone',
    'views/index/main',
    'views/editor/main',
    'views/debug/main',
    'models/devices/devices',
    'views/devices/main',
    'views/log/main',
    'views/docs/main'
], function ($, _, Backbone, IndexView, EditorView, DebugView, DevicesModel, DevicesView, LogView, DocsView) {

    var ReloadRouter = Backbone.Router.extend({
        initialize: function () {
            // TODO General view handler.
            //this.appView = options.appView;
        },

        routes: {
            // Define URL routes
            '':         'index',
            'editor':   'showEditor',
            'debug':    'showDebug',
            'devices':  'showDevices',
            'log':      'showLog',
            'docs':     'showDocs',

            // Default
            '*actions': 'defaultAction'
        }
    });


    var views = {};

    var toggleView = function (target) {
        _(_.keys(views)).each(function (key) {
            if (target === key) {
                views[key].render();
                console.log('rendered: ' + key);
            } else {
                if (typeof(views[key].close) === 'function') {
                    views[key].close();
                    console.log('closed: ' + key);
                }
            }
        });
    };

    var initialize = function () {

        // TODO Check if index view is already rendered and draw it
        // only if it's not initialized.

        views.indexView = new IndexView();
        views.editorView = new EditorView();
        views.debugView = new DebugView();
        views.devicesView = new DevicesView();
        views.logView = new LogView();
        views.docsView = new DocsView();

        var router = new ReloadRouter();

        // Listen to router events.
        router.on('route:index', function () {
            toggleView('indexView');
        });

        router.on('route:showEditor', function () {
            toggleView('editorView');
        });

        router.on('route:showDebug', function () {
            toggleView('debugView');
        });

        router.on('route:showDevices', function () {
            toggleView('devicesView');
        });

        router.on('route:showLog', function () {
            toggleView('logView');
        });
        router.on('route:showDocs', function () {
            toggleView('docsView');
        });
        router.on('route:defaultAction', function (actions) {
            // We have no matching route, lets just log what the URL was
            console.log('No route:', actions);
        });

        Backbone.history.start();
    };

    return {
        initialize: initialize
    };
});
