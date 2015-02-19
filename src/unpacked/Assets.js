(function(w, TGE) {
    /**
     * @constructor
     */
    function Assets() {
        this.success = 0;
        this.error = 0;
        
        this.cache = {};
        
        this.queue = [];
        
        this.map = {};
        
        this.cbProgress = undefined;
        this.cbDone = undefined;
        
        this.fnProgress = this.fnProgress.bind(this);
        this.fnError = this.fnError.bind(this);
        this.fnLoad = this.fnLoad.bind(this);
    };
    
    Assets.prototype.request = function(name) {
        // check if such resource already requested to avoid multiple downloading of same asset
        if (this.map[name]) {
            return;
        }
        
        // store request
        this.queue[this.queue.length] = name;
        this.map[name] = 1;
    };
        
    Assets.prototype.fnProgress = function(event) {
        if (event.lengthComputable) {
            if (event.loaded !== event.total) {
                // notify about loading progress
                if (this.cbProgress) this.cbProgress(event.target.url, ~~((event.loaded / event.total) * 100));
            }
        } else {
            // length is not computable - just notify that loading in progress
            if (this.cbProgress) this.cbProgress(event.target.url, -1);
        }
    };
        
    Assets.prototype.fnError = function(event) {
        ++this.error;
        
        if (this.completed()) {
            this.finish();
        }
    };
        
    Assets.prototype.fnImageLoad = function(data, type) {
        var blob = new Blob([data], {type: type});

        var img = new Image();
        
        img.onload = function(e) {
            // Clean up after yourself.
            window.URL.revokeObjectURL(img.src);
        };
        
        img.src = window.URL.createObjectURL(blob);
        
        return img;
    };
        
    Assets.prototype.fnJSONLoad = function(data) {
        var bufView = new Uint8Array(data);
        var length = bufView.length;
        var s = '';
        for(var i = 0; i < length; i += 65535) {
            var addition = 65535;
            
            if(i + 65535 > length) {
                addition = length - i;
            }
            
            s += String.fromCharCode.apply(null, bufView.subarray(i,i+addition));
        }
        
        return JSON.parse(s);
    };
        
    Assets.prototype.fnLoad = function(xhr) {
        xhr = xhr.target;
        
        var type = xhr.getResponseHeader('content-type'),
            r;

        if (type.indexOf('image') !== -1) {
            r = this.fnImageLoad(xhr.response, type);
            this.success++;
        } else if (type.indexOf('json') !== -1) {
            r = this.fnJSONLoad(xhr.response);
            this.success++;
        } else {
            console.warn('Unknown asset type', type);
            r = xhr.response;
            
            this.error++;
        }
        
        this.cache[xhr.url] = r;

        if (this.cbProgress) {
            this.cbProgress(xhr.url, 100);
        }

        if (this.completed()) {
            this.finish();
        }
    };
        
    Assets.prototype.finish = function() {
        var cb = this.cbDone;
        
        this.cbProgress = undefined;
        this.cbDone = undefined;
        
        this.queue.length = 0;

        if (cb) {
            cb();
        }
    };
        
    Assets.prototype.download = function(fnDone, fnProgress) {
        if (this.queue.length === 0) {
            
            if (fnDone) {
                fnDone();
            }
            return;
        }
        
        this.cbDone = fnDone;
        this.cbProgress = fnProgress;
        
        for (var i = 0, l = this.queue.length; i < l; ++i) {
            var name = this.queue[i];
            
            if (this.cache[name]) {
                if (this.cbProgress) {
                    this.cbProgress(name, 100);
                }

                if (this.completed()) {
                    this.finish();
                    return;
                }
            } else {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', name, true);
                xhr.responseType = 'arraybuffer';
                xhr.url = name;
                
                xhr.onprogress = this.fnProgress;
                xhr.onerror = this.fnError;
                xhr.onload = this.fnLoad;
                xhr.send();	
            }
        }
    };
        
    Assets.prototype.get = function(name) {
        return this.cache[name];
    };
        
    Assets.prototype.completed = function() {
        return this.queue.length <= this.error + this.success;
    };
        
    Assets.prototype.clear = function() {
        this.success = 0;
        this.error = 0
        this.cache = {};
        this.queue.length = 0;
        this.map = {};
        
        this.cbProgress = undefined;
        this.cbDone = undefined;
    };
    
    TGE['Assets'] = Assets;

})(window, TiledGameEngine);