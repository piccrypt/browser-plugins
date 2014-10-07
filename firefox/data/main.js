MAX_WIDTH = 640;
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


// handler for confirming the password and do actual encryption
var passwordEnterCallback;
$(function(){
    $('#password').on('keyup', function(e){
        $(this).removeClass('input-error');
        if(13 != e.keyCode) return;
        
        var password = $('#password').val();
        if(!/^[\x20-\xFD]+$/i.test(password))
            return $('#password').addClass('input-error');

        if(!passwordEnterCallback) return;
        passwordEnterCallback(password);
        $('#passwordRequest').hide();
    });
});



// followings listens for the command, shows the image being resized, and
// asks the user for password
addon.port.on('command', function(command){ $(function(){
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


        // Resize the window before processing
        panelResize(width, height);

        // add callback for password entering
        function onPasswordEnter(password){
            var srcCanvas = $('#srcCanvas')[0], outCanvas = $('#outCanvas')[0];
            var srcctx = srcCanvas.getContext('2d'), 
                outctx = outCanvas.getContext('2d');

            // call IMGCRYPT to manipulate the picture
            var data = srcctx.getImageData(0, 0, width, height).data,
                imgcrypt = IMGCRYPT();

            imgcrypt.key(password);
            if('encrypt' == command.command)
                var ret = imgcrypt.encrypt(width, height, data);
            else
                var ret = imgcrypt.decrypt(width, height, data);

            var outdata = outctx.getImageData(0, 0, width, height);
            for(var i=0; i<ret.length; i++) outdata.data[i] = ret[i];

            outctx.putImageData(outdata, 0, 0);


            // take the outctx's dataURL to an image
            $('#imgDisplay').attr('src', outCanvas.toDataURL('image/png'));
        };

        passwordEnterCallback = onPasswordEnter;
        $('#passwordRequest').show();
        $('#imgDisplay').attr('src', srcCanvas.toDataURL());
    };


    img.src = command.dataURL;
}); });
