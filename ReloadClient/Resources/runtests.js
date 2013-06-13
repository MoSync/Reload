(function(appPath){
    mosync.rlog('run dem tests! ' + appPath);
    var el=document.createElement('script');
    el.src='tests/test.js';
    document.getElementsByTagName('head')[0].appendChild(el);
})
