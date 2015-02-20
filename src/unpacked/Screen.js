(function(w, TGE) {
    /**
     * @constructor
     * @param {string|undefined}       tag          css query for screen HTML-element
     * @param {number|undefined}       height       screen height, 320px by default
     * @param {number|undefined}       width        screen width, 200px by default
     */
    function Screen(tag, width, height) {
        // set default values, if any
        if (!tag) tag = '#viewport';
        if (!height) height = 320;
        if (!width) width = 200;
        
        this.ctx = [];
        this.domViewport = undefined;
        
        this.boundingBox = new Int32Array([-width, -height, width, height]);

        // viewport data storage [left, top, width, height, visible]
        this['viewport'] = new Int32Array([0, 0, width, height, false]);
        
        // viewport DnD structure [startX, startY, dragging, dx, dy]
        this.dnd = new Int32Array([0, 0, 0, 0, 0]);
        
        this['layers'] = 0;

        // store viewport reference and set initial css styles
        this.domViewport = document.querySelector(tag);
        this.domViewport.style.cssText = 'position:fixed; left: 0px; top:0px; display:none;';
        
        // desktop only events: resize, mousedown, mouseup, mousemove
		window.addEventListener('resize', this.onResize.bind(this));
        this.domViewport.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.domViewport.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.domViewport.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.domViewport.addEventListener('mouseout', this.onMouseUp.bind(this));
        
        // create canvas elements inside container
        this['addLayer'](2);
    };
    
    // mouse down handler - start dragging
    Screen.prototype.onMouseDown = function(e) {
        // stop event propagation
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();

        // store initial mouse position
        this.dnd[0] = e.clientX;
        this.dnd[1] = e.clientY;
        this.dnd[2] = true;
    };
    
    // mouse up and mouse out handler - stop dragging
    Screen.prototype.onMouseUp = function(e) {
        // stop event propagation
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        
        // stop dragging
        if (this.dnd[2]) {
            this.dnd[2] = false;
            this.dnd[3] = e.clientX - this.dnd[0];
            this.dnd[4] = e.clientY - this.dnd[1];
            
            // if mouse didn't changed its position - stop processing
            if (!this.dnd[3] && !this.dnd[4]) return;

            // update viewport coordinates
            this['viewport'][0] += this.dnd[3];
            this['viewport'][1] += this.dnd[4];
            
            // notify all subscribers
            TGE['bus']['notify']('onviewportmove');
        }
    };
    
    // mouse move handler - drag
    Screen.prototype.onMouseMove = function(e) {
        if (this.dnd[2]) {
            // stop event propagation
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();

            // calculate mouse position difference
            this.dnd[3] = e.clientX - this.dnd[0];
            this.dnd[4] = e.clientY - this.dnd[1];
            
            // if mouse didn't changed its position - stop processing
            if (!this.dnd[3] && !this.dnd[4]) return;
            
            // update viewport coordinates
            if (this['viewport'][0] + this.dnd[3] > this.boundingBox[0] &&
                this['viewport'][0] + this['viewport'][2] + this.dnd[3] < this.boundingBox[2]) {
                this['viewport'][0] += this.dnd[3];
            } else this.dnd[3] = 0;
            
            if (this['viewport'][1] + this.dnd[4] > this.boundingBox[1] &&
                this['viewport'][1] + this['viewport'][3] + this.dnd[4] < this.boundingBox[3]) {
                this['viewport'][1] += this.dnd[4];
            } else this.dnd[4] = 0;

            // store new initial mouse position
            this.dnd[0] = e.clientX;
            this.dnd[1] = e.clientY;
            
            if (this.dnd[3] + this.dnd[4]) {
//                console.log(this.dnd[3], this.dnd[4]);
                // notify all subscribers
                TGE['bus']['notify']('onviewportmove');
            }
        }
    };
    
    // resize event handler
    Screen.prototype.onResize = function(e) {
        this['resize'](e.target.innerWidth, e.target.innerHeight);
    };
    
    // resize canvas and viewport
    Screen.prototype['resize'] = function(width, height) {
        for (var l = this.ctx.length; l--;) {
            this.ctx[l].canvas.width = this.ctx[l].width = width;
            this.ctx[l].canvas.height = this.ctx[l].height = height;
        }
        
        this['viewport'][2] = width;
        this['viewport'][3] = height;
        
        this.domViewport.style.width = width + 'px';
        this.domViewport.style.height = height + 'px';
        
        // this.boundingBox[0] = -width;
        // this.boundingBox[1] = -height;
        // this.boundingBox[2] = width;
        // this.boundingBox[3] = height;

        if (TGE['bus']) {
            TGE['bus']['notify']('onviewportresize');
        }
    };
    
    // move viewport
    Screen.prototype['move'] = function(x, y) {
        // update viewport coordinates
        this['viewport'][0] = x;
        this['viewport'][1] = y;
        
        // notify all subscribers
        TGE['bus']['notify']('onviewportmove');
    };

    // show/hide screen
    Screen.prototype['show'] = function(visible) {
        if (visible != this['viewport'][4]) {
            // make changes only if it differ from current state
            this.domViewport.style.display = visible ? 'block' : 'none';
        }
        
        this['viewport'][4] = visible;
    };
    
    // get canvas context for layer.
    // @param {number}  layer   Layer number (0 for bottom layer)
    Screen.prototype['getLayer'] = function(layer) {
        if (this.ctx.length > layer)
            return this.ctx[layer];

        return undefined;
    };
    
    // add new canvas layer
    Screen.prototype['addLayer'] = function(count) {
        count = count || 1;
        var t = this.domViewport.innerHTML, i = this['layers'];
        
        while(count--) {
            
            t += '<canvas style="position:fixed; left: 0px; top: 0px; z-index: '+(i)+';" id="_tgelr'+(i)+'"></canvas>';
            
            ++i;
        }

        this.domViewport.innerHTML = t;
        
        var l = i;//this.ctx.length;
        i = 0;
            
        for (; i < l; ++i) {
            this.ctx[i] = document.getElementById('_tgelr'+i);
            this.ctx[i] = this.ctx[i].getContext('2d')
            
        }
        
        this['layers'] = l;
        
        // set initial viewport size
        this['resize'](this['viewport'][2], this['viewport'][3]);
    };
    
    // remove canvas layer (-s)
    Screen.prototype['remLayer'] = function(count) {
        count = count || 1;

        var i = this['layers'],
            t = this.domViewport.innerHTML.split('</canvas>');

        for (i = t.length; i--;) {
            if (t[i].length === 0) {
                delete t[i];
                t.splice(i, 1)
//                ++i;
            }
        }
        
        i = this['layers'];
        
        for (;i--;) {
            delete this.ctx[i];
        }

        i = this['layers'];
        while (count--) {
            t.pop();
            --i;
        }
        
        t = t.join('</canvas>');
        
        this.domViewport.innerHTML = t;

        this.ctx.length = i;
        this['layers'] = i;

        for (i = 0; i < this['layers']; ++i) {
            this.ctx[i] = document.getElementById('_tgelr'+i);
            this.ctx[i] = this.ctx[i].getContext('2d')
            
        }
        
        // set initial viewport size
        this['resize'](this['viewport'][2], this['viewport'][3]);
    };

    // clear specified layer/all layers
    // @param {number|undefined}    layer   layer id
    Screen.prototype['clear'] = function(layer) {
        if (layer === undefined) {
            for (var l = this.ctx.length; l--;) {
                this.ctx[l].clearRect(0, 0, this['viewport'][2], this['viewport'][3]);
            }
        } else {
            var ctx = this['getLayer'](layer);
            if (ctx) {
                ctx.clearRect(0, 0, this['viewport'][2], this['viewport'][3]);
            }
        }
    };

    // set background color for whole scene
    Screen.prototype['setBGColor'] = function(color) {
        this.domViewport['style']['backgroundColor'] = color;
    };
    
    Screen.prototype['setBoundingBox'] = function(left, top, right, bottom) {
        this.boundingBox[0] = +left;
        this.boundingBox[1] = +top;
        this.boundingBox[2] = +right;
        this.boundingBox[3] = +bottom;
    };
    
    TGE['Screen'] = Screen;
})(window, TiledGameEngine);