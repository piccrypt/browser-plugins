var XMLHttpRequest = require('sdk/net/xhr').XMLHttpRequest;

function toBase64(buffer){
    var tableB64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var view = new Uint8Array(buffer);
    var i=0, j=0, k=0, len=view.length / 3;
    var b64 = '';

    var a, b, c;
    for(i=0; i<len; ++i) {
        a = view[j++];
        b = view[j++];
        c = view[j++];
        b64 += tableB64[a >> 2] + tableB64[((a << 4) & 63) | (b >> 4)]
             + (isNaN(b) ? "=" : tableB64[((b << 2) & 63) | (c >> 6)])
             + (isNaN(b + c) ? "=" : tableB64[c & 63]);
    };
    return b64;
};


module.exports = function(src, successCallback){
    var xhr = new XMLHttpRequest();
    if(!/^https?:\/\//i.test(src)) return;
    xhr.open('GET', src, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(){
        if(!(4 == xhr.readyState && 200 == xhr.status)) return;
        var headerContentType = xhr.getResponseHeader('content-type');

        var dataurl = 'data:' + headerContentType + ';base64,';
        dataurl += toBase64(xhr.response);

        console.log('GOT: ' + dataurl.slice(0, 100))
        successCallback(dataurl);
    };
    xhr.send();
    console.log('GET: ', src);
};
