define([
    'jquery',
    'underscore',
    'backbone',
    'viewhandler',
    'views/index/main',
    'views/examples/main',
    'views/editor/main',
    'views/debug/main',
    'views/log/main',
    'views/workbench/main',
    'views/docs/main',
    'views/feedback/main'
], function ($, _, Backbone,
             ViewHandler,
             IndexView,
             ExamplesView,
             EditorView,
             DebugView,
             LogView,
             WorkbenchView,
             DocsView,
             FeedbackView) {

    var ReloadRouter = Backbone.Router.extend({
        initialize: function () {
        },

        routes: {
            // Define URL routes
            '':           'index',
            'examples':   'showExamples',
            'editor':     'showEditor',
            'debug':      'showDebug',
            'devices':    'showDevices',
            'log':        'showLog',
            'workbench':  'showWorkbench',
            'docs':       'showDocs',
            'feedback':   'showFeedback',

            // Default
            '*actions':   'defaultAction'
        }
    });

    var views = {};

    var initialize = function () {
        views.indexView     = new IndexView();
        views.examplesView  = new ExamplesView();
        views.editorView    = new EditorView();
        views.debugView     = new DebugView();
        views.logView       = new LogView();
        views.workbenchView = new WorkbenchView();
        views.docsView      = new DocsView();
        views.feedbackView  = new FeedbackView();

        var viewHandler = new ViewHandler( {views: views} );
        var router = new ReloadRouter();

        // Listen to router events.
        router.on('route:index', function () {
            viewHandler.show(views.indexView);
        });
        router.on('route:showExamples', function () {
            viewHandler.show(views.examplesView);
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
        router.on('route:showWorkbench', function () {
            viewHandler.show(views.workbenchView);
        });
        router.on('route:showDocs', function () {
            viewHandler.show(views.docsView);
        });
        router.on('route:showFeedback', function () {
            viewHandler.show(views.feedbackView);
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
