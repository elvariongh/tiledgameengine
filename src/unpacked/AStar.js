/*! TiledGameEngine v0.0.5 - 07th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
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

    function AStar() {};
    
    AStar.prototype.search = function(graph, startIdx, endIdx, options) {
        function pathTo(node){
            var curr = node,
                path = [];
            while(curr.parent) {
                path.push({x: curr.x, y: curr.y});
                curr = graph.nodes[curr.parent-1];
            }
            
//            console.log('steps', path.length);
//            console.log('cells', graph.dirtyNodes.length);
            
            return path.reverse();
        }
        
        function getHeap() {
            return new binaryHeap(function(a, b) { 
                return graph.nodes[a].f < graph.nodes[b].f; 
            });
        };
        
        graph.clean();
        options = options || {};
        var heuristic = options.heuristic || this.heuristics.manhattan,
            closest = options.closest || false,
            
            start = graph.nodes[startIdx],
            end = graph.nodes[endIdx],
            processed = 0,

            openHeap = getHeap(),
            closestNode = start; // set the start node to be the closest if required

        start.h = heuristic(start, end);

        openHeap.push(start.x + start.y*graph.width);

        while(openHeap.size() > 0) {

            // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
            var currentNode = graph.nodes[openHeap.pop()];

            // End case -- result has been found, return the traced path.
            if(currentNode === end) {
                openHeap.clear();
                end.closed = end.visited = false;
                start.closed  = start.visited = false;
                
//                console.log('processed', processed);
                
                return pathTo(currentNode);
            }
            
            processed++;

            // Normal case -- move currentNode from open to closed, process each of its neighbors.
            currentNode.closed = true;

            // Find all neighbors for the current node.
            var neighbors = graph.neighbors(currentNode);

            for (var i = 0, il = neighbors.length; i < il; ++i) {
                var neighbor = graph.nodes[neighbors[i]];

                if (neighbor.closed || neighbor.isWall()) {
                    // Not a valid node to process, skip to next neighbor.
                    continue;
                }

                // The g score is the shortest distance from start to current node.
                // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
                var gScore = currentNode.g + neighbor.getCost(currentNode),
                    beenVisited = neighbor.visited;

                if (!beenVisited || gScore < neighbor.g) {

                    // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
                    neighbor.visited = true;
                    neighbor.parent = currentNode.x + currentNode.y * graph.width + 1; // magical nubmer 1 used to treat index as boolean. 0 means no parent
                    neighbor.h = neighbor.h || heuristic(neighbor, end);
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;
                    graph.markDirty(neighbor);
                    if (closest) {
                        // If the neighbour is closer than the current closestNode or if it's equally close but has
                        // a cheaper path than the current closest node then it becomes the closest node
                        if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
                            closestNode = neighbor;
                        }
                    }

                    if (!beenVisited) {
                        // Pushing to heap will put it in proper place based on the 'f' value.
                        openHeap.push(neighbor.x + neighbor.y*graph.width);
                    }
                    else {
                        // Already seen the node, but since it has been rescored we need to reorder it in the heap
                        openHeap.rescoreElement(neighbor.x + neighbor.y*graph.width);
                    }
                }
            }
        }

        
        end.closed = end.visited = false;
        start.closed  = start.visited = false;

//        console.log('processed', processed);

        if (closest) {
            openHeap.clear();
            return pathTo(closestNode);
        }

        openHeap.clear();

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
//      console.log('clear', size);
      _clear(root);
      
      root = null;
      last = null;
//      size = 0;
  };

  return that;
};