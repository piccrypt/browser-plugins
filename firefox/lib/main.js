var loadDataURL = require('./loadDataURL.js'),
    showProcessor = require('./showProcessor.js');

var _ = require('sdk/l10n').get;

var data = require("sdk/self").data;
var buttons = require('sdk/ui/button/action');
var cm = require("sdk/context-menu");
var tabs = require("sdk/tabs");

var reportSrcJS = 'self.on("click", function(n){self.postMessage(n.src);});';

cm.Item({
    label: _("menu-label-encrypt"),
    context: cm.SelectorContext("img"),
    contentScript: reportSrcJS,
    onMessage: function(imgsrc){
        loadDataURL(imgsrc, function(u){
            showProcessor({
                command: 'encrypt',
                dataURL: u,
                password: 'test',
            });
        });
    },
});

cm.Item({
    label: _("menu-label-decrypt"),
    context: cm.SelectorContext("img"),
    contentScript: reportSrcJS,
    onMessage: function(imgsrc){
        loadDataURL(imgsrc, function(u){
            showProcessor({
                command: 'decrypt',
                dataURL: u,
            });
        });
    },
});


console.log('***** ADDON PICCRYPT IS LOADED *****')
