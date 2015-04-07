/*! TiledGameEngine v0.0.5 - 07th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
/**
 *  A graph memory structure
 *  @param  {Array}     gridIn              1D array (from TMX file) of input weights
 *  @param  {number}    width               grid width
 *  @param  {number}    height              grid height
 *  @param  {Object}    [options]
 *  @param  {Boolean}   [options.diagonal]  Specifies whether diagonal moves are allowed
 */
function Graph(grid, width, height, options) {
    options = options || {};
    this.nodes = new Array(width*height);
    this.grid = new Array(width);
    this.width = width;
    this.height = height;
    this.dirtyNodes = [];
    this.diagonal = !!options.diagonal;

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
    for (var i = 0, l = this.nodes.length; i < l; ++i) {
        AStar.cleanNode(this.nodes[i]);
    }
};

Graph.prototype.clean = function() {
    for (var i = 0, l = this.dirtyNodes.length; i < l; ++i) {
        AStar.cleanNode(this.nodes[this.dirtyNodes[i]]);
    }

    this.dirtyNodes.length = 0;
};

Graph.prototype.markDirty = function(node) {
    this.dirtyNodes.push(node.x + node.y*this.width);
};

Graph.prototype.neighbors = function(node) {
    var ret = [],
        x = node.x,
        y = node.y,
        grid = this.grid;

    // West
    if(grid[x-1] && grid[x-1][y]) {
//        ret.push(grid[x-1][y]);
        ret.push(x-1 + y*this.width);
    }

    // East
    if(grid[x+1] && grid[x+1][y]) {
//        ret.push(grid[x+1][y]);
        ret.push(x+1 + y*this.width);
    }

    // South
    if(grid[x] && grid[x][y-1]) {
//        ret.push(grid[x][y-1]);
        ret.push(x + (y-1)*this.width);
    }

    // North
    if(grid[x] && grid[x][y+1]) {
//        ret.push(grid[x][y+1]);
        ret.push(x + (y+1)*this.width);
    }

    if (this.diagonal) {
        // Southwest
        if(grid[x-1] && grid[x-1][y-1]) {
//            ret.push(grid[x-1][y-1]);
            ret.push(x-1 + (y-1)*this.width);
        }

        // Southeast
        if(grid[x+1] && grid[x+1][y-1]) {
//            ret.push(grid[x+1][y-1]);
            ret.push(x+1 + (y-1)*this.width);
        }

        // Northwest
        if(grid[x-1] && grid[x-1][y+1]) {
//            ret.push(grid[x-1][y+1]);
            ret.push(x-1 + (y+1)*this.width);
        }

        // Northeast
        if(grid[x+1] && grid[x+1][y+1]) {
//            ret.push(grid[x+1][y+1]);
            ret.push(x+1 + (y+1)*this.width);
        }
    }

    return ret;
};

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

function GridNode(x, y, weight) {
    this.x = x;
    this.y = y;
    this.weight = weight;
}

GridNode.prototype.toString = function() {
    return "[" + this.x + " " + this.y + "]";
};

GridNode.prototype.getCost = function(fromNeighbor) {
    // Take diagonal weight into consideration.
    if (fromNeighbor && fromNeighbor.x != this.x && fromNeighbor.y != this.y) {
        return this.weight * 1.41421;
    }
    return this.weight;
};

GridNode.prototype.isWall = function() {
    return this.weight !== 0;
};
