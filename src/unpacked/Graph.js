/*! TiledGameEngine v0.0.6 - 17th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
/**
 *  A graph memory structure
 *  @param  {Array}     gridIn              1D array (from TMX file) of input weights
 *  @param  {number}    width               grid width
 *  @param  {number}    height              grid height
 *  @param  {Object}    [options]
 *  @param  {Boolean}   [options.diagonal]  Specifies whether diagonal moves are allowed
 */
function Graph(grid, width, height, options, map) {
    options = options || {};
    this.nodes = new Array(width*height);
    this.grid = new Array(width);
    this.width = width;
    this.height = height;
    this.dirtyNodes = [];
    this.diagonal = !!options.diagonal;
    this.map = map;

    for (var x = 0; x < width; ++x) {
        this.grid[x] = new Array(height);

        for (var y = 0; y < height; ++y) {
            var node = new GridNode(x, y, grid[x + y*width]);
            this.grid[x][y] = 1;//node;
            this.nodes[x + y*width] = node;
        }
    }
    this.init();
};

Graph.prototype.init = function() {
    this.dirtyNodes.length = 0;
/*
    for (var i = 0, l = this.nodes.length; i < l; ++i) {
        AStar.cleanNode(this.nodes[i]);
    }
*/
};

Graph.prototype.clean = function() {
/*
    for (var i = 0, l = this.dirtyNodes.length; i < l; ++i) {
        AStar.cleanNode(this.nodes[this.dirtyNodes[i]]);
    }
*/
    this.dirtyNodes.length = 0;
};

Graph.prototype.markDirty = function(node) {
    this.dirtyNodes.push(node.x + node.y*this.width);
};

Graph.prototype.isWall = function(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return true;

    var r = this.nodes[x + y * this.width].isWall();
    if (this.map) {
//        console.log(x, y, 'isFree', this.map.isFree(x, y), 'isWall', this.nodes[x + y * this.width].isWall());
        if (!r) {
            r |= !this.map.isFree(x, y);
        }
    }
    
    return r;
};

Graph.prototype.neighbors = function(node, target) {
    var ret = [],
        x = node.x,
        y = node.y,
        grid = this.grid;
    
    if (this.diagonal) {
        // Southwest - 0
        if(grid[x-1] && grid[x-1][y+1]) {
//            ret.push(grid[x-1][y+1]);
            ret.push(x-1 + (y+1)*this.width);
        } else ret.push(-1);
    } else ret.push(-1);

    // West - 1
    if(grid[x-1] && grid[x-1][y]) {
//        ret.push(grid[x-1][y]);
        ret.push(x-1 + y*this.width);
    } else ret.push(-1);

    if (this.diagonal) {
        // Northwest - 2
        if(grid[x-1] && grid[x-1][y-1]) {
//            ret.push(grid[x-1][y-1]);
            ret.push(x-1 + (y-1)*this.width);
        } else ret.push(-1);
    } else ret.push(-1);

    // North - 3
    if(grid[x] && grid[x][y-1]) {
//        ret.push(grid[x][y-1]);
        ret.push(x + (y-1)*this.width);
    } else ret.push(-1);

    if (this.diagonal) {
        // Northeast - 4
        if(grid[x+1] && grid[x+1][y-1]) {
//            ret.push(grid[x+1][y-1]);
            ret.push(x+1 + (y-1)*this.width);
        } else ret.push(-1);
    } else ret.push(-1);

    // East - 5
    if(grid[x+1] && grid[x+1][y]) {
//        ret.push(grid[x+1][y]);
        ret.push(x+1 + y*this.width);
    } else ret.push(-1);

    if (this.diagonal) {
        // Southeast - 6
        if(grid[x+1] && grid[x+1][y+1]) {
//            ret.push(grid[x+1][y+1]);
            ret.push(x+1 + (y+1)*this.width);
        } else ret.push(-1);
    } else ret.push(-1);

    // South - 7
    if(grid[x] && grid[x][y+1]) {
//        ret.push(grid[x][y+1]);
        ret.push(x + (y+1)*this.width);
    } else ret.push(-1);

    return ret;
};

/*
Graph.prototype.toString = function() {
    var graphString = [],
        nodes = this.grid, // when using grid
        rowDebug, row, y, l;
    for (var x = 0, len = nodes.length; x < len; x++) {
        rowDebug = [];
        row = nodes[x];
        for (y = 0, l = row.length; y < l; y++) {
            rowDebug.push(row[y].weight);
        }
        graphString.push(rowDebug.join(" "));
    }
    return graphString.join("\n");
};

*/

function GridNode(x, y, weight) {
    this.x = x;
    this.y = y;
    this.weight = weight;
}
/*
GridNode.prototype.toString = function() {
    return "[" + this.x + " " + this.y + "]";
};
*/

GridNode.prototype.getCost = function(fromNeighbor) {
    // Take diagonal weight into consideration.
    if (fromNeighbor && fromNeighbor.x != this.x && fromNeighbor.y != this.y) {
        return this.weight * 1.41421;
    }
    return this.weight;
};

GridNode.prototype.isWall = function() {
//    console.trace();
    return this.weight !== 0;
};
