(function(w, TGE) {

    /**
     * Game stage basic class
     * @memberOf TiledGameEngine
     * @param {string}                  name                Stage name
     * @param {Assets|null|undefined}   assetManager        Reference to the TiledGameEngine.Assets instance or null
     * @param {Screen|undefined}        [screen=undefined]  Reference to the #Screen object
     * @constructor
     */
    function Stage(name, assetManager, screen) {
        /** @type {boolean}         Indicates if the stage is active */
        this.active = false;
        
        /** @type {string}          Store stage name */
        this.name = name;
        
        /** @type {boolean}         Indicates if the stage need to be redrawn */
        this.redraw = false;

        /** @type {Assets}          Asset manager to work with */
        this.am = assetManager;
        
        /** @type {Screen}          Screen and Viewport manager to work with */
        this.screen = screen;

        /** @type {number}          Subscriber ID for Viewport move event */
        this.sidMove = -1;

        /** @type {number}          Subscriber ID for Viewport resize event */
        this.sidResize = -1;
    };
    
    /**
     * Update stage internal objects. That routine called by main game loop
     * @param {number}  dt      time difference from last update
     * @return {number}         Return time difference (in ms) to next update
     */
    Stage.prototype.update = function(dt) {
        if (this.active) {
            // mark stage as invalid - redraw required
            this.redraw = true;
            
            return 16; // 60 FPS by default
        } else {
            return 1000; // 1 FPS in inactive state
        }
    };
        
    /**
     * Render the stage to the viewport. That routine called by main game loop
     */
    Stage.prototype.render = function() {
        if (!this.active || !this.screen || !this.redraw) return;
        
        // mark stage as up to date - no redraw needed
        this.redraw = false;

        // your render code goes here
    };
        
    Stage.prototype.onViewportResize = function(key, value) {
        // mark stage for redraw
        this.redraw = true;
        TGE.bus.notify('invalidateStage', this.name);
    };

    Stage.prototype.onViewportMove = function(key, value) {
        // mark stage for redraw
        this.redraw = true;
        TGE.bus.notify('invalidateStage', this.name);
    };

    /**
     * Activate stage and prepare for rendering
     */
    Stage.prototype.deactivate = function() {
        this.active = false;

        TGE.bus.unsubscribe('onViewportResize', this.sidResize);
        TGE.bus.unsubscribe('onViewportMove', this.sidMove);

        this.sidResize = this.sidMove = -1;

        // mark stage as up to date - no redraw needed
        this.redraw = false;
    };
        
    /**
     * Deactivate stage
     */
    Stage.prototype.activate = function() {
        this.active = true;

        // subscribe to Viewport events
        this.sidResize = TGE.bus.subscribe('onViewportResize', this.onViewportResize.bind(this));
        this.sidMove = TGE.bus.subscribe('onViewportMove', this.onViewportMove.bind(this));
        
//        this.screen.clear();

        // mark stage for redraw
        this.redraw = true;
        TGE.bus.notify('invalidateStage', this.name);
    };
    
    TGE['Stage'] = Stage;
})(window, TiledGameEngine);
