/*! TiledGameEngine v1.0.0 - 20th Feb 2015 | https://github.com/elvariongh/tiledgameengine */
(function(f,e){function d(a,c,b){a||(a="#viewport");b||(b=320);c||(c=200);this.b=[];this.c=void 0;this.viewport=new Int32Array([0,0,c,b,!1]);this.a=new Int32Array([0,0,0,0,0]);this.layers=0;this.c=document.querySelector(a);this.c.style.cssText="position:fixed; left: 0px; top:0px; display:none;";window.addEventListener("resize",this.g.bind(this));this.c.addEventListener("mousedown",this.e.bind(this));this.c.addEventListener("mouseup",this.d.bind(this));this.c.addEventListener("mousemove",this.f.bind(this));
this.c.addEventListener("mouseout",this.d.bind(this));this.addLayer(2)}d.prototype.e=function(a){a.preventDefault();a.stopImmediatePropagation();a.stopPropagation();this.a[0]=a.clientX;this.a[1]=a.clientY;this.a[2]=!0};d.prototype.d=function(a){a.preventDefault();a.stopImmediatePropagation();a.stopPropagation();this.a[2]&&(this.a[2]=!1,this.a[3]=a.clientX-this.a[0],this.a[4]=a.clientY-this.a[1],this.a[3]||this.a[4])&&(this.viewport[0]+=this.a[3],this.viewport[1]+=this.a[4],e.bus.notify("onviewportmove"))};
d.prototype.f=function(a){this.a[2]&&(a.preventDefault(),a.stopImmediatePropagation(),a.stopPropagation(),this.a[3]=a.clientX-this.a[0],this.a[4]=a.clientY-this.a[1],this.a[3]||this.a[4])&&(this.viewport[0]+=this.a[3],this.viewport[1]+=this.a[4],this.a[0]=a.clientX,this.a[1]=a.clientY,e.bus.notify("onviewportmove"))};d.prototype.g=function(a){this.resize(a.target.innerWidth,a.target.innerHeight)};d.prototype.resize=function(a,c){for(var b=this.b.length;b--;)this.b[b].canvas.width=this.b[b].width=
a,this.b[b].canvas.height=this.b[b].height=c;this.viewport[2]=a;this.viewport[3]=c;this.c.style.width=a+"px";this.c.style.height=c+"px";e.h&&e.bus.notify("onviewportresize")};d.prototype.move=function(a,c){this.viewport[0]=a;this.viewport[1]=c;e.bus.notify("onviewportmove")};d.prototype.show=function(a){a!=this.viewport[4]&&(this.c.style.display=a?"block":"none");this.viewport[4]=a};d.prototype.getLayer=function(a){if(this.b.length>a)return this.b[a]};d.prototype.addLayer=function(a){a=a||1;for(var c=
this.c.innerHTML,b=this.layers;a--;)c+='<canvas style="position:fixed; left: 0px; top: 0px; z-index: '+b+';" id="_tgelr'+b+'"></canvas>',++b;this.c.innerHTML=c;a=b;for(b=0;b<a;++b)this.b[b]=document.getElementById("_tgelr"+b),this.b[b]=this.b[b].getContext("2d");this.layers=a;this.resize(this.viewport[2],this.viewport[3])};d.prototype.clear=function(a){if(void 0===a)for(a=this.b.length;a--;)this.b[a].clearRect(0,0,this.viewport[2],this.viewport[3]);else(a=this.getLayer(a))&&a.clearRect(0,0,this.viewport[2],
this.viewport[3])};d.prototype.setBGColor=function(a){this.c.style.backgroundColor=a};e.Screen=d})(window,TiledGameEngine);