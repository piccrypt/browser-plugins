(function(){
//////////////////////////////////////////////////////////////////////////////

// Permutation generator
function genPermutation(n, srcBytes){
    var ret = new Array(n), byteRead = 0, pos, t;
    for(var i=0; i<n; i++) ret[i] = i;
    for(var i=0; i<n; i++){ // i: 0, 1, 2, 3,..., n-1
        pos = (
            srcBytes[byteRead++] *
            srcBytes[byteRead++] *
            srcBytes[byteRead++]
        ) % n;

        t = ret[pos];
        ret[pos] = ret[i];
        ret[i] = t;
    };
    return ret;
};

// color hue rotator
/*function hueRotator(r,g,b,rotation, output){
    var h, s, v, max=0, min=255, hi, f, p, q, t;
    if(r > max) max = r;
    if(g > max) max = g;
    if(b > max) max = b;
    if(r < min) min = r;
    if(g < min) min = g;
    if(b < min) min = b;

    if(max == min)
        h = 0;
    else if(r == max)
        if(g >= b)
            h = 60 * (g-b) / (max - min);
        else
            h = 60 * (g-b) / (max - min) + 360;
    else if(g == max)
        h = 60 * (b-r) / (max - min) + 120;
    else if(b == max)
        h = 60 * (r-g) / (max - min) + 240;
    s = ((0 == max)?0:(1-min/max));
    v = max;

    h += rotation;
    if(h < 0) h += 360;
    if(h >= 360) h -= 360;

    f = h / 60;
    hi = f & f;
    f -= hi;

    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);

    if(0 == hi){
        output[0] = v; output[1] = t; output[2] = p;
    } else if(1 == hi){
        output[0] = q; output[1] = v; output[2] = p;
    } else if(2 == hi){
        output[0] = p; output[1] = v; output[2] = t;
    } else if(3 == hi){
        output[0] = p; output[1] = q; output[2] = v;
    } else if(4 == hi){
        output[0] = t; output[1] = p; output[2] = v;
    } else if(5 == hi){
        output[0] = v; output[1] = p; output[2] = q;
    };
};*/

var dct = DCT();

/****************************************************************************/
function massMapper(width, height, data){
    var self = this;
    var gridsize = 8;

    var w = Math.floor(width / gridsize),
        h = Math.floor(height / gridsize);

    // generate cellID->(x,y) table
    var table = {}, cellID = 0;
    for(var y=0; y<h; y++)
        for(var x=0; x<w; x++)
            table[cellID++] = [x, y];

    // prepare task
    var task = [];

    this.getPermutationRequirement = function(){
        return h * w;
    };

    this.getBytesRequirement = function(){
        return h * w * 3;
    };

    this.getTransformRequirement = function(){
        return h * w;
    };

    /********************************************************************/
    /* switch and process the grid.
     *
     * data from src is copied to a 256-byte array, and will be processed.
     * then it will be applied to the output canvas.
     */

    var canvasSrcData = data,
        canvasOutData = new Uint8Array(canvasSrcData.length),
        gridDataLen = 4 * gridsize * gridsize;
        srcTempAry = new Uint8Array(gridDataLen),
        outTempAry = new Uint8Array(gridDataLen);

    function getArrayFromSrc(sid, resultAry){
        /*
         * +++++++++++++++++++++++++++++++++++++++++++++++++++++
         * +++++++++++++++++++++++++++++++++++++++++++++++++++++
         * +++++++++++++++++++++++++++++++++++++++++++++++++++++
         * ++++++++AXXXXX  <-- position of A: decided by pixels above and left
         * ++++++++BXXXXX  <-- position of B: equals A's index plus row length
         * ++++++++XXXXXX
         */
        var rowDataLen = width * 4,
            start = table[sid][1] * gridsize * rowDataLen
                  + table[sid][0] * gridsize * 4,
            i = 0, t, x, y, p;
        for(y=0; y<gridsize; y++){
            t = start;
            for(x=0; x<gridsize; x++){
                for(p=0; p<4; p++){
                    resultAry[i++] = canvasSrcData[t++];
                };
            };
            start += rowDataLen; // move to begin of the next row
        };
    };

    function applyArrayToOut(oid, sourceAry){
        var rowDataLen = width * 4,
            start = table[oid][1] * gridsize * rowDataLen
                  + table[oid][0] * gridsize * 4,
            i = 0, t, x, y, p;
        for(y=0; y<gridsize; y++){
            t = start;
            for(x=0; x<gridsize; x++){
                for(p=0; p<4; p++){
                    canvasOutData[t++] = sourceAry[i++];
                };
            };
            start += rowDataLen; // move to begin of the next row
        };
    };

    this.add = function(sid, randomByte, oid, direction){
        getArrayFromSrc(sid, srcTempAry);

        // do convert from srcTempAry to outTempAry
        //  bit 0: vertical mirroring
        //  bit 1: horizontal mirroring
        //  bit 2, bit 3, bit 4: hue rotation
        //  bit 5, bit 6, bit 7: reserved

        var hueRotCache = new Uint8Array(3);
        var cache1 = new Array(srcTempAry.length),
            cache2 = new Array(srcTempAry.length);

        function moveCache(from, to){
            for(var i=0; i<from.length; i++) to[i] = from[i];
        };

        // perform dct transform on the cache
        function imageToDCT(input, output){
            dct.transform(input, output);
            for(var i=0; i<output.length; i++){
                if(output[i] > 255) output[i] = 255;
                if(output[i] < 0) output[i] = 0;
            };
        };

        // manipulate the dct cache
        function inverseLayerColor(input){
            var i=0;
            for(var y=0; y<gridsize; y++){
                for(var x=0; x<gridsize; x++){
                    for(var p=0; p<3; p++){
                        if(randomByte & (1 << (p+2)))
                            input[i] = 255 - input[i];
                        i++;
                    };
                    i++;
                };
            };
        };

        // mirror grids
        function mirrorGrids(input, output){
            var i=0, j, ox, oy;
            for(var y=0; y<gridsize; y++){
                if(randomByte & 0x01) oy = gridsize - 1 - y; else oy = y;
                for(var x=0; x<gridsize; x++){
                    if(randomByte & 0x02) ox = gridsize - 1 - x; else ox = x;
                    j = oy * gridsize * 4 + ox * 4;

                    for(var p=0; p<3; p++){
                        output[j++] = input[i++];
                    };
                    output[j++] = 255; // the alpha channel
                    i++;
                };
            };
        };

        // inverse DCT
        function dctToImage(input, output){
            dct.inverse(input, output);
        };

        
        // DCT matrix modification
        function modifyDCTMatrix(input, direction){
            return;
            var i=0, inc = ((randomByte >> 5) & 3) * 85, t;
            for(var x=0; x<gridsize; x++){
                for(var y=0; y<gridsize; y++){
                    if(x < 2 && y < 2){
                        for(var p=0; p<3; p++){
                            if(direction)
                                t = input[i+p] + inc;
                            else
                                t = input[i+p] - inc;
                            if(t > 255) t -= 255;
                            if(t < 0) t += 255;
                            input[i+p] = t;
                        };
                    };
                    i+=4;
                };
            };
        };



        // do encryption or decryption
        if(direction){ // encrypt
            // 1. do random mirroring
            mirrorGrids(srcTempAry, cache1);
            // 2. do Image->DCT transform
            //imageToDCT(cache1, cache2);
            // 3. manipulate DCT results' color
            inverseLayerColor(cache1);
            //modifyDCTMatrix(cache2, direction);
            // 4. do DCT->Image transform
            //dctToImage(cache2, outTempAry);
            moveCache(cache1, outTempAry);
        } else {
            moveCache(srcTempAry, cache1);
            // 1. do Image->DCT transform
            //imageToDCT(srcTempAry, cache1);
            // 2. resume DCT results' color
            inverseLayerColor(cache1);
            //modifyDCTMatrix(cache1, direction);
            // 3. do DCT->Image transform
            //dctToImage(cache1, cache2);
            // 4. resume mirroring
            mirrorGrids(cache1, outTempAry);
        };



        applyArrayToOut(oid, outTempAry);
    };

    this.end = function(){
        return canvasOutData;
    };
    

    return this;
};

/****************************************************************************/
var pbkdf2 = PBKDF2_WHIRLPOOL;
function imgcrypt(){
    var self = this;

    var key = null;

    function ASCII2ArrayBuffer(src){
        var ret = new Uint8Array(src.length);
        for(var i=0; i<src.length; i++) ret[i] = src.charCodeAt(i) & 0xFF;
        return ret.buffer;
    }

    function getBytes(l, s){
        var salt ={
            0: ASCII2ArrayBuffer('permutation'),
            1: ASCII2ArrayBuffer('transformation'),
        }[s];
        var ret = pbkdf2(
            key,
            salt,
            1,
            l
        );
        return new Uint8Array(ret);
    };


    function _crypt(width, height, srcdata, reverse){
        var mapper = new massMapper(width, height, srcdata);
        var byteL = mapper.getBytesRequirement(),
            permL = mapper.getPermutationRequirement();
        var ary = getBytes(byteL, 0);
        var permutation = genPermutation(permL, ary);
        var transformation = getBytes(mapper.getTransformRequirement(), 1);

        // permutation is regarded as so:
        // 
        // source:  1....2....3....4....5
        // permu.:  5....3....2....1....4
        //
        // so 1->5, 2->3, 3->2, 4->1, 5->4 for encryption
        //    5->1, 3->2, 2->3, 1->4, 4->5 for decryption
        //
        // mapper accepts a hflip option, which, when given, will read in a
        // horizontal flipped image.
        if(reverse){
            for(var i=0; i<permL; i++){
                mapper.add(
                    permutation[i],
                    transformation[i],
                    i,
                    false
                );
            };
        } else {
            for(var i=0; i<permL; i++){
                mapper.add(
                    i,
                    transformation[i], 
                    permutation[i],
                    true
                );
            };
        };

        return mapper.end();
    };

    function encrypt(width, height, srcdata){
        return _crypt(width, height, srcdata, false);
    };

    function decrypt(width, height, srcdata){
        return _crypt(width, height, srcdata, true);
    };

    this.key = function(k){
        key = ASCII2ArrayBuffer(k);
        delete self.key;
        self.encrypt = encrypt;
        self.decrypt = decrypt;
        return self;
    };

    return this;
};


/****************************************************************************/
IMGCRYPT = function(a,b,c){ return new imgcrypt(a,b,c); };
//////////////////////////////////////////////////////////////////////////////
})();
