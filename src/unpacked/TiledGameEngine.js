(function(w) {
    /**
     * TiledGameEngine main class
     * @constructor
     */
    function TGE() {
        this.rAF = 0;                   // reference for RequestAnimationFrame
        this.ttu = 0;                   // TimeToUpdate - time (in ms) till next update
        this.time = 0;                  // Last update time

        this.initialized = false;       // Flag to store init state
        this.running = false;           // Flag to store runloop state
        
        this.stages = {};               // key:value dictionary of game stages
        this.activeStage = undefined;   // Current active stage name
        this.forceRedraw = false;       // if set to TRUE - stage will be redrawn forcibly
    };

    /**
     * Initialize the TGE
     * @this {TGE}
     * @export
     */
    TGE.prototype.init = function() {
        this.initialized = true;
        this.frame = this.frame.bind(this);
        
        TGE.bus = new TGE.PubSub();
        
        TGE.bus.subscribe('invalidateStage', this.onInvalidateStage.bind(this));
    };
    
    TGE.prototype.onInvalidateStage = function(key, value) {
        if (this.activeStage) {
            if (this.activeStage.name === value) {
                this.forceRedraw = true;
            }
        }
    };

    /**
     * Start the game loop
     * @this {TGE}
     * @export
     */
    TGE.prototype.start = function() {
        if (!this.initialized) return;

        if (!this.running) {
            this.rAF = w.requestAnimationFrame(this.frame);
        }

        this.running = true;
    };

    /**
     * Stop the game loop
     * @this {TGE}
     * @export
     */
    TGE.prototype.stop = function() {
        if (this.running) {
            if (this.rAF) {
                w.cancelAnimationFrame(this.rAF);
            }
        }

        this.rAF = 0;
        this.running = false;
    },

    /**
     * Game loop body
     * @param {number}  time     frame timestamp
     * @private
     * @this {TGE}
     */
    TGE.prototype.frame = function(time) {
        var dt = time - this.time;

        if (this.ttu - dt > 0 && !this.forceRedraw) {
            // nothing to update yet
            this.rAF = w.requestAnimationFrame(this.frame);

            return;
        }

        // store last update time
        this.time = time;
        
        // update and render the stage
        this.ttu = this.update(dt);
        this.render();

        // request next frame update
        this.rAF = w.requestAnimationFrame(this.frame);
    };

    /**
     * Called internally from game loop body to update current stage
     * @param {number}  dt      time difference from last update
     * @return {number}         Return time difference (in ms) to next update
     * @protected
     * @this {TGE}
     */
    TGE.prototype.update = function(dt) {
        if (this.activeStage) {
            return this.activeStage.update(dt);
        }
        return 16;
    };

    /**
     * Called internally from game loop body to render current stage
     * @protected
     * @this {TGE}
     */
    TGE.prototype.render = function() {
        if (this.activeStage) {
            // redraw canvas only if required
            if (this.activeStage.redraw || this.forceRedraw) {
                this.activeStage.render();
            }
        }
        
        this.forceRedraw = false;
    };
    
    /**
     * Add stage to the contrainer
     * @param {string}  name    Stage name
     * @param {Stage}   stage   Stage object
     * @this {TGE}
     * @export
     */
    TGE.prototype.addStage = function(name, stage) {
        if (!this.stages[name]) {
            this.stages[name] = stage;
            return true;
        }
        
        return false;
    };
    
    /**
     * Get reference to the specified stage
     * @param {string}  name        Stage name
     * @return {Stage|undefined}    Returns Stage objects or undefined, if specified stage not found
     * @export
     */
    TGE.prototype.getStage = function(name) {
        if (!this.stages[name]) return undefined;
        
        return this.stages[name];
    };
    
    /**
     * Deactivate current stage and switch to the specified one
     * @param {string}      name    New stage name
     * @return {boolean}    TRUE on success
     * @this {TGE}
     * @export
     */
    TGE.prototype.activateStage = function(name) {
        if (this.activeStage) {
            this.activeStage.deactivate();
            
            this.activeStage = undefined;
        }
        
        if (this.stages[name]) {
            this.activeStage = this.stages[name];

            this.activeStage.activate();
            
            this.activeStage.redraw = true;
        }
        
        return this.activeStage !== undefined;
    };

    TGE.bus = undefined;

    w['TiledGameEngine'] = TGE;

})(window);