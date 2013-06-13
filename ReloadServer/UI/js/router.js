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
    'views/feedback/main',
    'views/aardwolf/main',
    'collections/projects'
], function ($, _, Backbone,
             ViewHandler,
             IndexView,
             ExamplesView,
             EditorView,
             DebugView,
             LogView,
             WorkbenchView,
             DocsView,
             FeedbackView,
             AardwolfView,
             ProjectCollection
            ) {

    var ReloadRouter = Backbone.Router.extend({
        initialize: function () {
        },

        startAt: function(callback) {
            // Get initial path
            var options     = {};
            options.rpcMsg  = {
                method: 'manager.getConfig',
                params: ['state'],
                id:     null
            };

            var self = this;
            options.success = function (resp) {
                callback(false, resp.result);
            };

            options.error   = function (resp) {
                callback('could not get config '+resp , false);
            };

            this.rpc(options);
        },

        routes: {
            // Define URL routes
            '':           'index',
            'examples':   'showExamples',
            'editor':     'showEditor',
            'weinre':     'showDebug',
            'devices':    'showDevices',
            'log':        'showLog',
            'workbench':  'showWorkbench',
            'docs':       'showDocs',
            'feedback':   'showFeedback',
            'aardwolf':   'showAardwolf', 

            // Default
            '*actions':   'defaultAction'
        }
    });

    var views = {};

    var initialize = function () {
        var projectCollection = new ProjectCollection();

        views.indexView     = new IndexView();
        views.examplesView  = new ExamplesView({
            projectCollection: projectCollection
        });
        views.editorView    = new EditorView();
        views.debugView     = new DebugView();
        views.workbenchView = new WorkbenchView();
        views.docsView      = new DocsView();
        views.feedbackView  = new FeedbackView();
        views.aardwolfView  = new AardwolfView();

        var viewHandler = new ViewHandler({
            views: views,
            projectCollection: projectCollection
        });
        var router = new ReloadRouter();
        router.startAt(function(err, state){
            if (err) {
                console.log('Error in router.startAt()');
            } else {
                if (state !== 'index') {
                    router.navigate('#/' + state);
                }
            }
        });

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
        router.on('route:showAardwolf', function () {
            viewHandler.show(views.aardwolfView);
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
