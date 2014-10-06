var Panel = require('sdk/panel').Panel;
var data = require("sdk/self").data;
var clipboard = require("sdk/clipboard");

var panel = Panel({
    contentURL: data.url('processor.html'),
});

module.exports = function(command){
    panel.show({
        position: {
            'top': 0,
            'left': 0,
        },
    });

    panel.port.emit('command', command);
   

    panel.port.on('resize', function(size){
        panel.resize(size.width, size.height);
    });

    panel.port.on('copy-to-clipboard', function(dataURL){
        console.log('Paste to clipboard: ' + dataURL.slice(0, 100));
        clipboard.set(dataURL, 'image');
    });
};
