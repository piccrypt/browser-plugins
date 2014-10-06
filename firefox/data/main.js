MAX_WIDTH = 800;
PANEL_MIN_WIDTH = 400;
PANEL_MIN_HEIGHT = 300;

function panelResize(picWidth, picHeight){
    var w = PANEL_MIN_WIDTH, h = PANEL_MIN_HEIGHT;
    if(picWidth > w) w = picWidth;
    if(picHeight > h) h = picHeight;
    w += 10;
    h += 50;
    addon.port.emit('resize', {width: w, height: h});
};

$(function(){
    $('#copy-to-clipboard').click(function(){
        var dataURL = $('#outCanvas')[0].toDataURL('image/png');
        addon.port.emit('copy-to-clipboard', dataURL);
    });
});

var defaultPassword = '';
addon.port.on('command', function(command){ $(function(){
//////////////////////////////////////////////////////////////////////////////
console.log('new command', command.command);

// load image
var img = new Image();

// initialize src/outCanvas
img.onload = function(){
    var srcCanvas = $('#srcCanvas')[0], outCanvas = $('#outCanvas')[0];
    var srcctx = srcCanvas.getContext('2d'), 
        outctx = outCanvas.getContext('2d');

    // resize image to max width and round the size into multiples of 8.

    if(this.width > MAX_WIDTH) {
        this.height *= MAX_WIDTH / this.width;
        this.width = MAX_WIDTH;
    };
    this.height = Math.floor(this.height / 8) * 8;
    this.width = Math.floor(this.width / 8) * 8;

    // copy the size to canvas
    var width = this.width, height = this.height;
    srcctx.canvas.width = width; srcctx.canvas.height = height;
    outctx.canvas.width = width; outctx.canvas.height = height;
/*    srcCanvas.width = width; srcCanvas.height = height;*/

    // copy the data to srcctx
    srcctx.clearRect(0, 0, srcCanvas.width, srcCanvas.height);
    srcctx.drawImage(this, 0, 0, width, height);

    // call IMGCRYPT to manipulate the picture
    var data = srcctx.getImageData(0, 0, width, height).data,
        imgcrypt = IMGCRYPT();

    imgcrypt.key(command.password);
    if('encrypt' == command.command)
        var ret = imgcrypt.encrypt(width, height, data);
    else
        var ret = imgcrypt.decrypt(width, height, data);

    var outdata = outctx.getImageData(0, 0, width, height);
    for(var i=0; i<ret.length; i++) outdata.data[i] = ret[i];

    outctx.putImageData(outdata, 0, 0);

    panelResize(width, height);
};


img.src = command.dataURL;

//////////////////////////////////////////////////////////////////////////////
}); });
