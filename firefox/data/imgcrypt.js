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

    this.add = function(sid, hflip, vflip, invert, oid){
        getArrayFromSrc(sid, srcTempAry);

        // do convert from srcTempAry to outTempAry

        var i=0, j, p, ox, oy;
        for(var y=0; y<gridsize; y++){
            if(vflip) oy = gridsize - 1 - y; else oy = y;
            for(var x=0; x<gridsize; x++){
                if(hflip) ox = gridsize - 1 - x; else ox = x;
                j = oy * gridsize * 4 + ox * 4;
                for(var p=0; p<4; p++){
                    if(p > 3) break;
                    if(invert & (1 << p))
                        outTempAry[j++] = 255 - srcTempAry[i++];
                    else
                        outTempAry[j++] = srcTempAry[i++];
                };
            };
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
                    transformation[i] & 1, // hflip
                    transformation[i] & 2, // vflip
                    (transformation[i] & 28) >> 2, // inverted color, 3bits
                    i
                );
            };
        } else {
            for(var i=0; i<permL; i++){
                mapper.add(
                    i,
                    transformation[i] & 1, // hflip
                    transformation[i] & 2, // vflip
                    (transformation[i] & 28) >> 2, // inverted color, 3bits
                    permutation[i]
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
