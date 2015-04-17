/*! TiledGameEngine v0.0.6 - 17th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
    /**
    * Perform an A* Search on a graph given a start and end node.
    * @param {Graph} graph
    * @param {GridNode} start
    * @param {GridNode} end
    * @param {Object} [options]
    * @param {bool} [options.closest] Specifies whether to return the
               path to the closest node if the target is unreachable.
    * @param {Function} [options.heuristic] Heuristic function (see
    *          astar.heuristics).
    */
    function AStar() {
        this.f = undefined; // 0;
        this.g = undefined; // 0;
        this.h = undefined; // 0;
        this.visited = undefined; // false;
        this.closed = undefined; // false;
        this.parent = undefined; // null;
    };
    
    AStar.prototype.init = function(graph) {
        graph.clean();

        var l = graph.width * graph.height;
        
        this.f = new Float32Array(l);
        this.g = new Float32Array(l);
        this.h = new Float32Array(l);
        this.visited = new Uint8Array(l);
        this.closed = new Uint8Array(l);
        this.parent = new Uint32Array(l);
    };
    
    AStar.prototype.deinit = function(graph) {
        graph.clean();
        
//        return;
        
        delete this.f;
        delete this.g;
        delete this.h;
        delete this.visited;
        delete this.closed;
        delete this.parent;
    };

    var _heap = undefined;
    AStar.prototype.getHeap = function() {
        if (_heap) return _heap;
        
        _heap = new binaryHeap((function(a, b) { 
//                return graph.nodes[a].f < graph.nodes[b].f; 
            return this.f[a] < this.f[b];
        }).bind(this));
        
        return _heap;
    };
    
    AStar.prototype._pathTo = function(node, graph){
        var curr = node,
            path = [];

//            while(curr.parent) {
        while(this.parent[curr.x + curr.y * graph.width]) {
            path.push({x: curr.x, y: curr.y});
            curr = graph.nodes[this.parent[curr.x + curr.y * graph.width]-1];
        }
        
//        console.log('steps', path.length, 'cells', graph.dirtyNodes.length, 'ratio', path.length / graph.dirtyNodes.length);
        
        return path.reverse();
    };

    AStar.prototype.search = function(graph, startIdx, endIdx, options) {

        this.init(graph);

        options = options || {};
        var heuristic = options.heuristic || options.diagonal ? this.heuristics.diagonal : this.heuristics.manhattan,
            closest = options.closest || options.units || false,
            units = options.units || false,
            
            start = graph.nodes[startIdx],
            end = graph.nodes[endIdx],
            processed = 0,

            openHeap = this.getHeap(),
//            closestNode = start, // set the start node to be the closest if required
            closestNode = startIdx, // set the start node to be the closest if required
            idx = startIdx;
        
//        console.log('search', closest, units);
        
//        start.h = heuristic(start, end);
        this.h[idx] = heuristic(start, end);

        openHeap.push(start.x + start.y*graph.width);

        var currentNode;
        
        while(openHeap.size() > 0) {

            // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
            idx = openHeap.pop();
            currentNode = graph.nodes[idx];

            // End case -- result has been found, return the traced path.
            if(currentNode === end) {
                openHeap.clear();
                // end.closed = false;
                // end.visited = false;
                // start.closed  = false;
                // start.visited = false;
                
                var res = this._pathTo(currentNode, graph);
                
                this.deinit(graph);
                
                return res;
            }
            
            processed++;

            // Normal case -- move currentNode from open to closed, process each of its neighbors.
//            currentNode.closed = true;
            this.closed[idx] = 1;

            // Find all neighbors for the current node.
            var neighbors = graph.neighbors(currentNode),
                dx = end.x - currentNode.x,
                dy = end.y - currentNode.y,
                dir = 0;

                 if (dx === 0 && dy < 0) dir = 3; // faceDirection.N;
            else if (dx === 0 && dy > 0) dir = 7; // faceDirection.S;
            else if (dy === 0 && dx < 0) dir = 1; // faceDirection.W;
            else if (dy === 0 && dx > 0) dir = 5; // faceDirection.E;
            else if (dx > 0   && dy > 0) dir = 6; // faceDirection.SE;
            else if (dx < 0   && dy < 0) dir = 2; // faceDirection.NW;
            else if (dx > 0   && dy < 0) dir = 4; // faceDirection.NE;
            else dir = 0; // faceDirection.SW;
            

            for (var i = 0, il = neighbors.length; i < il; ++i) {
                var si = (i + dir) % 8;
                
                var nidx = neighbors[si];
                
                if (nidx < 0) continue;
                
                var neighbor = graph.nodes[nidx];

//                if (neighbor.closed || (units ? graph.isWall(neighbor.x, neighbor.y) : neighbor.isWall())) {
                if (this.closed[nidx] || (units && graph.isWall(neighbor.x, neighbor.y)) || neighbor.isWall()) {
                    // Not a valid node to process, skip to next neighbor.
                    continue;
                }

                // The g score is the shortest distance from start to current node.
                // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
//                var gScore = currentNode.g + neighbor.getCost(currentNode),
//                    beenVisited = neighbor.visited;
                var gScore = this.g[idx] + neighbor.getCost(currentNode),
                    beenVisited = this.visited[nidx];

//                if (!beenVisited || gScore < neighbor.g) {
                if (!beenVisited || gScore < this.g[nidx]) {

                    // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
//                    neighbor.visited = true;
                    this.visited[nidx] = 1;

//                    neighbor.parent = currentNode.x + currentNode.y * graph.width + 1; // magical nubmer 1 used to treat index as boolean. 0 means no parent
                    this.parent[nidx] = currentNode.x + currentNode.y * graph.width + 1; // magical nubmer 1 used to treat index as boolean. 0 means no parent

//                    neighbor.h = neighbor.h || heuristic(neighbor, end);
                    this.h[nidx] = this.h[nidx] || heuristic(neighbor, end);

//                    neighbor.g = gScore;
                    this.g[nidx] = gScore;

//                    neighbor.f = neighbor.g + neighbor.h;
                    this.f[nidx] = this.g[nidx] + this.h[nidx];
                    
                    graph.markDirty(neighbor);
                    
                    if (closest) {
                        // If the neighbour is closer than the current closestNode or if it's equally close but has
                        // a cheaper path than the current closest node then it becomes the closest node
//                        if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
                        if (this.h[nidx] < this.h[closestNode] || (this.h[nidx] === this.h[closestNode] && this.h[nidx] < this.h[closestNode])) {
                            closestNode = nidx;
                        }
                    }

                    if (!beenVisited) {
                        // Pushing to heap will put it in proper place based on the 'f' value.
                        openHeap.push(neighbor.x + neighbor.y*graph.width);
                        // End case -- result has been found, return the traced path.
                        if(neighbor === end) {
                            break;
                        }
                    }
                    else {
                        // Already seen the node, but since it has been rescored we need to reorder it in the heap
                        openHeap.rescoreElement(neighbor.x + neighbor.y*graph.width);
                    }
                }
            }
        }

        
        end.closed = false; end.visited = false;
        start.closed  = false; start.visited = false;

        if (closest) {
            openHeap.clear();
//            var res = _pathTo(closestNode, graph);
            var res = this._pathTo(graph.nodes[closestNode], graph);
            this.deinit(graph);
            
            return res;
        }

        openHeap.clear();
        
        this.deinit(graph);

        // No result was found - empty array signifies failure to find path.
        return [];
    };
    
    // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
    AStar.prototype.heuristics = {
        manhattan: function(pos0, pos1) {
            var d1 = Math.abs(pos1.x - pos0.x);
            var d2 = Math.abs(pos1.y - pos0.y);
            return d1 + d2;
        },
        diagonal: function(pos0, pos1) {
            var D = 1;
            var D2 = Math.sqrt(2);
            var d1 = Math.abs(pos1.x - pos0.x);
            var d2 = Math.abs(pos1.y - pos0.y);
            return (D * (d1 + d2)) + ((D2 - (2 * D)) * Math.min(d1, d2));
        }
    };

    AStar.cleanNode = function(node){
        throw 'Deprecated';
        node.f = 0;
        node.g = 0;
        node.h = 0;
        node.visited = false;
        node.closed = false;
        node.parent = null;
    };

/*
  tree implementation of a binary heap, example usage:

  // can optionally provide a comparison function, a function for a max
  // heap is the default if no comparison function is provided
  var bh = binaryHeap();
  bh.push(5);
  bh.push(34);
  bh.push(16);
  var max = bh.pop(); // 34
  print("number in heap: " + bh.size()) // 2
 */
var binaryHeap = function(comp) {

  // default to max heap if comparator not provided
  comp = comp || function(a, b) {
    return a > b;
  };

  var node = function(value, parent, left, right) {
    var that = {};
    that.value = value;
    that.parent = parent;
    that.left = left;
    that.right = right;
    return that;
  };

  var that = {};
  var root = null;
  var last = null;
  var size = 0;

  var bubbleUp = function(node) {
    if (node === root) {
      return;
    }
    if (comp(node.value, node.parent.value)) {
      var temp = node.parent.value;
      node.parent.value = node.value;
      node.value = temp;
      node = node.parent;
      bubbleUp(node);
    }
  };

  var bubbleDown = function(node) {
    if (!node) {
      return;
    }
    var largest = node;
    if (node.left && comp(node.left.value, largest.value)) {
      largest = node.left;
    }
    if (node.right && comp(node.right.value, largest.value)) {
      largest = node.right;
    }
    if (largest !== node) {
      var temp = node.value;
      node.value = largest.value;
      largest.value = temp;
      bubbleDown(largest);
    }
  };

  that.push = function(value) {
    if (!root) {
      root = last = node(value, null, null, null);
    } else if (root === last) {
      root.left = node(value, root, null, null);
      last = root.left;
    } else if (last.parent.left === last) {
      last.parent.right = node(value, last.parent, null, null);
      last = last.parent.right;
    } else {
      var hops = 0;
      var temp = last;
      while (temp.parent && temp.parent.right === temp) {
        temp = temp.parent;
        hops++;
      }
      if (temp !== root) {
        temp = temp.parent.right;
        hops--;
      }
      while (hops-- > 0) {
        temp = temp.left;
      }
      temp.left = node(value, temp, null, null);
      last = temp.left;
    }
    size++;
    bubbleUp(last);
  };

  that.pop = function() {
    if (size === 0) {
      throw new Error("binary heap empty");
    }
    var value = root.value;
    root.value = last.value;
    if (root === last) {
      root = last = null;
    } else if (last.parent.right === last) {
      last.parent.right = null;
      last = last.parent.left;
    } else {
      var hops = 0;
      var temp = last;
      while (temp.parent && temp.parent.left === temp) {
        temp = temp.parent;
        hops++;
      }
      if (temp !== root) {
        temp = temp.parent.left;
      } else {
        hops--;
      }
      while (hops-- > 0) {
        temp = temp.right;
      }
      last.parent.left = null;
      last = temp;
    }
    size--;
    bubbleDown(root);
    return value;
  };

  that.size = function() {
    return size;
  };
  
  that.rescoreElement = function(value) {
      console.warn('rescoring required');
  };
  
  var _clear = function(nd) {
      if (!nd) return;
      if (nd.right) _clear(nd.right);
      if (nd.left) _clear(nd.left);
      delete nd.value;
      delete nd.parent;
      delete nd.left;
      delete nd.right;
      --size;
  };
  
  that.clear = function() {
      _clear(root);
      
      root = null;
      last = null;
//      size = 0;
  };

  return that;
};