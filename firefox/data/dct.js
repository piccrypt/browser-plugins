DCT = function(){

var BLOCK_SIZE = 8;
var coefficients = 8;


var _dct_matrix = [];
(function init_dct_matrix() {
    for (var k = 0; k < BLOCK_SIZE; k++) {
        var tk = k * Math.PI / BLOCK_SIZE;
        _dct_matrix[k] = [];
        for (var x = 0; x < BLOCK_SIZE; x++) {
            _dct_matrix[k][x] = Math.cos(tk * (x + 0.5));
        }    
    }
})();

/****************************************************************************/

function fdct(src, dst, dct_matrix, temp, acc){
    var dst_offset, src_offset, uk;

    var width = BLOCK_SIZE, height = BLOCK_SIZE;

    // src and dst buffer have block aligned size
    for (var y = 0; y < BLOCK_SIZE; y++) {
        for (var k = 0; k < BLOCK_SIZE; k++) {
            dst_offset = (y * width + k) * 4;
            temp[dst_offset + 0] = 0;
            temp[dst_offset + 1] = 0;
            temp[dst_offset + 2] = 0;

            for (var x = 0; x < BLOCK_SIZE; x++) {
                src_offset = (y * width + x) * 4;
                temp[dst_offset + 0] += (src[src_offset + 0] - 128) * dct_matrix[k][x];
                temp[dst_offset + 1] += (src[src_offset + 1] - 128) * dct_matrix[k][x];
                temp[dst_offset + 2] += (src[src_offset + 2] - 128) * dct_matrix[k][x];
            }

            uk = (k == 0 ? 1 : 2) / BLOCK_SIZE;
            temp[dst_offset + 0] *= uk;
            temp[dst_offset + 1] *= uk;
            temp[dst_offset + 2] *= uk;
        }
    }

    for (var x = 0; x < BLOCK_SIZE; x++) {
        for (var k = 0; k < BLOCK_SIZE; k++) {
            dst_offset = (k * width + x) * 4;
            acc[0] = 0;
            acc[1] = 0;
            acc[2] = 0;

            for (var y = 0; y < BLOCK_SIZE; y++) {
                src_offset = (y * width + x) * 4;
                acc[0] += temp[src_offset + 0] * dct_matrix[k][y];
                acc[1] += temp[src_offset + 1] * dct_matrix[k][y];
                acc[2] += temp[src_offset + 2] * dct_matrix[k][y];
            }

            uk = (k == 0 ? 1 : 2) / BLOCK_SIZE;
            acc[0] = acc[0] * uk;
            acc[1] = acc[1] * uk;
            acc[2] = acc[2] * uk;

            dst[dst_offset + 0] = acc[0] + 128;
            dst[dst_offset + 1] = acc[1] + 128;
            dst[dst_offset + 2] = acc[2] + 128;
            dst[dst_offset + 3] = 255;
        }
    }
}

function idct(src, dst, num_coeff, dct_matrix, temp, acc) {
    var width = BLOCK_SIZE, height = BLOCK_SIZE;

    for (var x = 0; x < BLOCK_SIZE; x++) {
        for (var k = 0; k < BLOCK_SIZE; k++) {
            var dst_offset = (k * width + x) * 4;
            temp[dst_offset + 0] = 0;
            temp[dst_offset + 1] = 0;
            temp[dst_offset + 2] = 0;

            for (var y = 0; y < num_coeff; y++) {
                var src_offset = (y * width + x) * 4;
                temp[dst_offset + 0] += (src[src_offset + 0] - 128) * dct_matrix[y][k];
                temp[dst_offset + 1] += (src[src_offset + 1] - 128) * dct_matrix[y][k];
                temp[dst_offset + 2] += (src[src_offset + 2] - 128) * dct_matrix[y][k];
            }
        }
    }

    for (var y = 0; y < BLOCK_SIZE; y++) {
        for (var k = 0; k < BLOCK_SIZE; k++) {
            var dst_offset = (y * width + k) * 4;
            acc[0] = 0;
            acc[1] = 0;
            acc[2] = 0;

            for (var x = 0; x < num_coeff; x++) {
                var src_offset = (y * width + x) * 4;
                acc[0] += temp[src_offset + 0] * dct_matrix[x][k];
                acc[1] += temp[src_offset + 1] * dct_matrix[x][k];
                acc[2] += temp[src_offset + 2] * dct_matrix[x][k];
            }

            dst[dst_offset + 0] = acc[0] + 128;
            dst[dst_offset + 1] = acc[1] + 128;
            dst[dst_offset + 2] = acc[2] + 128;
            dst[dst_offset + 3] = 255;
        }
    }
}

//////////////////////////////////////////////////////////////////////////////

function DCT(){
    var self = this;

    var temp = new Array(BLOCK_SIZE * BLOCK_SIZE * 4),
        acc = new Array(3);

    this.transform = function(src, dst){
        fdct(src, dst, _dct_matrix, temp, acc);
    };

    this.inverse = function(src, dst, coef){
        if(!coef) coef = 8;
        idct(src, dst, coef, _dct_matrix, temp, acc);
    };

    return this;
};


return function(){ return new DCT(); };

}();
