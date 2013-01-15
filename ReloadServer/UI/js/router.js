define([
    'jquery',
    'underscore',
    'backbone',
    'viewhandler',
    'views/index/main',
    'views/editor/main',
    'views/debug/main',
    'views/log/main',
    'views/docs/main'
], function ($, _, Backbone, ViewHandler, IndexView, EditorView, DebugView, LogView, DocsView) {

    var ReloadRouter = Backbone.Router.extend({
        initialize: function () {
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

    var initialize = function () {

        // TODO Check if index view is already rendered and draw it
        // only if it's not initialized.

        views.indexView = new IndexView();
        views.editorView = new EditorView();
        views.debugView = new DebugView();
        views.logView = new LogView();
        views.docsView = new DocsView();

        var viewHandler = new ViewHandler();
        var router = new ReloadRouter();

        // Listen to router events.
        router.on('route:index', function () {
            viewHandler.show(views.indexView);
        });

        router.on('route:showEditor', function () {
            viewHandler.show(views.editorView);
        });

        router.on('route:showDebug', function () {
            viewHandler.show(views.debugView);
        });

        router.on('route:showLog', function () {
            viewHandler.show(views.logView);
        });
        router.on('route:showDocs', function () {
            viewHandler.show(views.docsView);
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
