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

    var indexView = new IndexView();

    var initialize = function () {
        var router = new ReloadRouter();

        // Listen to router events.
        router.on('route:index', function () {
            indexView.render();
        });

        router.on('route:showEditor', function () {
            console.log('show editor route');
            var editorView = new EditorView();
            editorView.render();
        });

        router.on('route:showDebug', function () {
            console.log('show debug route');
            var debugView = new DebugView();
            debugView.render();
        });

        var devicesModel = new DevicesModel();
        router.on('route:showDevices', function () {
            console.log('show devices route');
            console.log(devicesModel.devices);
            var devicesView = new DevicesView({ model: devicesModel });
            devicesView.render();
        });
        router.on('route:showLog', function () {
            console.log('show Log route');
            var logView = new LogView();
            logView.render();
        });
        router.on('route:showDocs', function () {
            console.log('show docs route');
            var docsView = new DocsView();
            docsView.render();
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
