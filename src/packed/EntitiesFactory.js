/*! TiledGameEngine v0.0.1 - 10th Mar 2015 | https://github.com/elvariongh/tiledgameengine */
(function(c){function d(){}d.prototype.register=function(b,a){this[b.toLowerCase()]=a};d.prototype.create=function(b){if(b.type){var a=b.type.toLowerCase();if(this[a])return a=new this[a],a.init.apply(a,arguments),a;if(this.entity)return a=new this.entity,a.init.apply(a,arguments),a}};c.EntitiesFactory=new d})(TiledGameEngine);