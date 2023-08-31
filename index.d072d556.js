var t,e,i,r,s,h,o,l;const n=["north","east","west","south"];function u(t){switch(t){case"north":return"south";case"south":return"north";case"west":return"east";case"east":return"west";default:throw Error("Unknown dir")}}function f(t){return`${t.y},${t.x}`}function a(t,e,i){let r=Object.assign({},t);switch(e){case"north":if(0!==r.y)--r.y;else{if(!i.brokenWalls)return null;r.y=i.height-1}break;case"south":if(r.y!==i.height-1)++r.y;else{if(!i.brokenWalls)return null;r.y=0}break;case"east":if(r.x!==i.width-1)++r.x;else{if(!i.brokenWalls)return null;r.x=0}break;case"west":if(0!==r.x)--r.x;else{if(!i.brokenWalls)return null;r.x=i.width-1}}return r}function d(t){return(t.north?1:0)+(t.south?1:0)+(t.east?1:0)+(t.west?1:0)}class c{#t;#e;constructor(t,e){this.#e=t,this.#t=new Map;for(let i=0;i!=t*e;++i)this.#t.set(i,i)}find(t){let e=t.x+t.y*this.#e;for(;;){let t=this.#t.get(e);if(t===e)return e;e=t}}union(t,e){this.#t.set(this.find(t),this.find(e))}}class g{#i(t,e){return"north"===e?0!==t.y?{x:t.x,y:t.y-1}:this.brokenWalls?{x:t.x,y:this.height-1}:null:"south"===e?t.y!==this.height-1?{x:t.x,y:t.y+1}:this.brokenWalls?{x:t.x,y:0}:null:"west"===e?0!==t.x?{x:t.x-1,y:t.y}:this.brokenWalls?{x:this.width-1,y:t.y}:null:"east"!==e?null:t.x!==this.width-1?{x:t.x+1,y:t.y}:this.brokenWalls?{x:0,y:t.y}:null}getNeighboursOf(t){return n.map(e=>{let i=this.#i(t,e);return null===i?{other:null,point:null,dir:e}:{other:this.get(i),point:i,dir:e}})}getNeighbourSlotsOf(t){return this.getNeighboursOf(t).filter(t=>null!==t.other)}}function w(e){return e===t.Yes?t.No:e===t.No?t.Yes:e}function y(e,i){let r=e=>(e===t.Maybe?i:e)===t.Yes;return{north:r(e.north),south:r(e.south),east:r(e.east),west:r(e.west)}}function b(t,e){let i=0;return t.north===e&&++i,t.south===e&&++i,t.east===e&&++i,t.west===e&&++i,i}(s=t||(t={}))[s.Maybe=0]="Maybe",s[s.Yes=1]="Yes",s[s.No=2]="No";class k extends g{get width(){return this.ruleset.width}get height(){return this.ruleset.height}get brokenWalls(){return this.ruleset.brokenWalls}get(t){return this._slots[t.y][t.x]}constructor(t,e){super(),this._slots=t,this.ruleset=e}static fromIGrid(e){let i=[];for(let r=0;r!==e.height;++r){let s=[];for(let i=0;i!==e.width;++i)s.push(function(e){if(e.blocked)return e;{let i=d(e);return 4===i||0===i?e:{south:t.Maybe,north:t.Maybe,west:t.Maybe,east:t.Maybe,form:function(t){let e=d(t);switch(e){case 1:return"i";case 3:return"T";case 2:return t.south===t.north?"I":"L";default:throw Error("Fixed form slot")}}(e)}}}(e.get({x:i,y:r})));i.push(s)}return new k(i,e)}clone(){let t=[];for(let i=0;i!==this.height;++i){let r=[];for(let t=0;t!==this.width;++t){var e;r.push("form"in(e=this._slots[i][t])?Object.assign({},e):e)}t.push(r)}return new k(t,this)}solveSomeSlots(t){let e=!1;for(let i=0;i!==this.height;++i)for(let r=0;r!==this.width;++r){let s=this.solveAt({x:r,y:i},t);if("bad"===s)return"bad";e||=s}return e}solveAt(e,i){let r=this._slots[e.y][e.x];if(!("form"in r))return!1;let s=function(e){let i=b(e,t.Yes),r=b(e,t.No);if("T"===e.form){if(4===i||r>=2)return"bad";if(3===i)return y(e,t.No);if(1===r)return y(e,t.Yes)}else if("i"===e.form){if(i>1||r>3)return"bad";if(1===i)return y(e,t.No);if(3===r)return y(e,t.Yes)}else if("I"===e.form){if(i>2||r>2)return"bad";for(let i of n)if(e[i]===t.Yes&&e[u(i)]===t.No)return"bad";if(i>0||r>0){for(let i of n)if(e[i]!==t.Maybe){for(let t of n)e[t]=t===i||t===u(i)?e[i]:w(e[i]);return y(e,t.Yes)}}}else if("L"===e.form){if(i>2||r>2)return"bad";for(let i of n)if(e[i]!==t.Maybe&&e[u(i)]===e[i])return"bad";let s=b(e,t.Maybe);for(let i of n)e[i]!==t.Maybe&&(e[u(i)]=w(e[i]));let h=b(e,t.Maybe);if(0===h)return y(e,t.Yes);if(s!==h)return"new_info"}}(r);return void 0!==s&&("bad"===s?"bad":("new_info"!==s&&(this._slots[e.y][e.x]=s,i.push(Object.assign(e,s))),!0))}removeInvalidHypothesises(e){let i=!1;for(let r=0;r!=this.height;++r)for(let s=0;s!=this.width;++s){let h=this._slots[r][s];if(!("form"in h))continue;this.getNeighbourSlotsOf({x:s,y:r}).forEach(({other:e,dir:r})=>{let s=function(e,i,r){let s=u(r);if(!("form"in i)){let h=i[s]?t.Yes:t.No;return e[r]!==h&&(e[r]=h,!0)}if(i[s]===t.Maybe){if(e[r]!==t.Maybe)return i[s]=e[r],!0}else if(e[r]===t.Maybe)return e[r]=i[s],!0;return!1}(h,e,r);i||=s});let o=this.solveAt({x:s,y:r},e);if("bad"===o)return"bad";i||=o}return i}initialDeductions(){let e=t=>{if("form"in t)return"i"===t.form;let e=d(t);return 1===e},i=(()=>{let t=0;for(let i=0;i!=this.height;++i)for(let r=0;r!=this.width;++r){let s=this._slots[i][r];if(e(s)){if(!(t<2))return!0;++t}}return!1})();for(let r=0;r!=this.height;++r)for(let s=0;s!=this.width;++s){let h=this._slots[r][s];"form"in h&&this.getNeighboursOf({x:s,y:r}).forEach(({other:r,dir:s})=>{null===r?h[s]=t.No:e(h)&&e(r)&&(h[s]=i?t.No:t.Yes,"form"in r&&(r[u(s)]=i?t.No:t.Yes))})}}explorePossibilitiesOfanI(){var i;let r=[],s=[];for(let t=0;t!==this.height;++t)for(let e=0;e!==this.width;++e){let i=this._slots[t][e];"form"in i&&("I"===i.form?r.push({x:e,y:t}):s.push({x:e,y:t}))}if(0===r.length&&0===(r=s).length)return null;let h=r[Math.floor(Math.random()*r.length)],o=this._slots[h.y][h.x];for(let r of("i"===(i=o.form)?[{north:!0,east:!1,south:!1,west:!1},{north:!1,east:!0,south:!1,west:!1},{north:!1,east:!1,south:!0,west:!1},{north:!1,east:!1,south:!1,west:!0}]:"I"===i?[{north:!0,east:!1,south:!0,west:!1},{north:!1,east:!0,south:!1,west:!0}]:"L"===i?[{north:!0,east:!0,south:!1,west:!1},{north:!1,east:!0,south:!0,west:!1},{north:!1,east:!1,south:!0,west:!0},{north:!0,east:!1,south:!1,west:!0}]:[{north:!0,east:!0,south:!0,west:!1},{north:!1,east:!0,south:!0,west:!0},{north:!0,east:!1,south:!0,west:!0},{north:!0,east:!0,south:!1,west:!0}]).filter(e=>(function(e,i){for(let r of n)if(i[r]===t.Yes&&!0!==e[r]||i[r]===t.No&&!1!==e[r])return!1;return!0})(e,o))){let t=this.clone();if(t._slots[h.y][h.x]=r,t.getCompletitionState()===e.Invalid)continue;let i=t.trySolve();if(null!==i)return[Object.assign(h,r),...i]}return null}trySolve(){let t=[];for(this.initialDeductions();;){let e=this.removeInvalidHypothesises(t);if("bad"===e)return null;if(!1===e)break}let i=this.getCompletitionState();if(i===e.Invalid)return null;if(i!==e.IncompleteValid)return t;{let e=this.explorePossibilitiesOfanI();return e?[...t,...e]:null}}getCompletitionState(){let i=new Map;for(let t=0;t!==this.height;++t)for(let e=0;e!==this.width;++e)i.set(f({x:e,y:t}),f({x:e,y:t}));let r=t=>{let e=i.get(f(t));for(;e!==i.get(e);)e=i.get(e);return e},s=t=>{let e=i.get(t);for(;e!==i.get(e);)e=i.get(e);return e},h=!1;for(let s=0;s!==this.height;++s)for(let o=0;o!==this.width;++o){let l=this._slots[s][o];"form"in l&&(h=!0);let n=!1;if(this.getNeighboursOf({x:o,y:s}).forEach(({other:e,point:h,dir:f})=>{if(null===e)(!0===l[f]||l[f]===t.Yes)&&(n=!0);else{var a,d,c,g;a=l[f],d=e[u(f)],(!0===a||a===t.Yes?!0!==d&&d!==t.Yes&&d!==t.Maybe:(!1===a||a===t.No)&&!1!==d&&d!==t.No&&d!==t.Maybe)&&(n=!0),c=l[f],g=e[u(f)],(!0===c||c===t.Yes||c===t.Maybe)&&(!0===g||g===t.Yes||g===t.Maybe)&&i.set(r({x:o,y:s}),r(h))}}),n)return e.Invalid}let o=r({x:0,y:0});for(let t of i.keys())if(o!==s(t))return e.Invalid;return h?e.IncompleteValid:e.CompleteValid}}(h=e||(e={}))[h.IncompleteValid=0]="IncompleteValid",h[h.CompleteValid=1]="CompleteValid",h[h.Invalid=2]="Invalid",(o=i||(i={}))[o.LockedOk=0]="LockedOk",o[o.LockedWithConflict=1]="LockedWithConflict",o[o.NotLocked=2]="NotLocked",(l=r||(r={}))[l.Free=0]="Free",l[l.Restrained=1]="Restrained",l[l.AutoLock=2]="AutoLock";class p{countPaths(){return n.map(t=>this[t]).filter(t=>t).length}isABar(){return this.north==this.south&&this.west==this.east&&this.north!==this.west}draw(t,e,r,s,h,o,l,n){t.fillStyle="black",t.fillRect(e,r,s,h),t.fillStyle=function(t){switch(t){case i.LockedOk:return"darkgrey";case i.LockedWithConflict:return"red";case i.NotLocked:return"lightgrey";default:return"green"}}(l),t.fillRect(e+1,r+1,s-2,h-2),t.fillStyle=o,this.north&&t.fillRect(e+s/2-10,r,20,h/2),this.south&&t.fillRect(e+s/2-10,r+h/2,20,h/2),this.west&&t.fillRect(e,r+h/2-10,s/2,20),this.east&&t.fillRect(e+s/2,r+h/2-10,s/2,20),1===this.countPaths()&&(n&&(t.fillStyle="blue"),t.fillRect(e+s/2-10,r+h/2-10,20,20))}rotate(){if(this.blocked)return;let t=this.north;this.north=this.east,this.east=this.south,this.south=this.west,this.west=t}constructor(){this.north=!1,this.east=!1,this.west=!1,this.south=!1,this.blocked=!1}}class x extends g{constructor(t,e,i=!1){super(),this.blackPipes=!0,this.width=t,this.height=e,this.brokenWalls=i;let r=function(t){let e=function(t){let e=[];for(let i=0;i!=t.height;++i){let i=[];for(let e=0;e!=t.width;++e)i.push({north:!1,east:!1,west:!1,south:!1});e.push(i)}return e}(t);for(let{x:i,y:r,to:s}of function(t){let e=new c(t.width,t.height),{h:i,v:r}=function(t){let e=[],i=[],r=t.brokenWalls?0:1;for(let s=0;s!=t.width;++s)for(let h=0;h!=t.height;++h)s!=t.width-r&&e.push({x:s,y:h}),h!=t.height-r&&i.push({x:s,y:h});return{h:e,v:i}}(t),s=t.width*t.height,h=[],o=new Map,l=e=>{let i=o.get(e.x+e.y*t.width);return void 0===i||!(i>=3)};for(;s>1;){let n=Math.random()>=.5,u=n?"east":"south",f=n?i:r;if(0===f.length)continue;let d=Math.floor(Math.random()*f.length),c=f[d],g=a(c,u,t);if(f.splice(d,1),l(c)&&l(g)&&e.find(c)!==e.find(g)){h.push({x:c.x,y:c.y,to:u}),e.union(c,g),--s;let i=c.x+c.y*t.width;o.set(i,(o.get(i)||0)+1);let r=g.x+g.y*t.width;o.set(r,(o.get(r)||0)+1)}}return h}(t)){let h={x:i,y:r},o=a(h,s,t);e[h.y][h.x][s]=!0,e[o.y][o.x][u(s)]=!0}return e}({width:t,height:e,brokenWalls:i});this.grid=[];for(let i=0;i!=e;++i){let e=[];for(let s=0;s!=t;++s){let t=r[i][s],h=new p;Object.assign(h,t);for(let t=Math.floor(4*Math.random());t>=0;--t)h.rotate();e.push(h)}this.grid.push(e)}}get(t){return this.grid[t.y][t.x]}invertColorDisplay(){this.blackPipes=!this.blackPipes}draw(t){let e;if(this.blackPipes)e=this.checkWin()?()=>"blue":()=>"black";else{let t=function(t){let e=new Map,i=0;for(let r=0;r!=t.width;++r)for(let s=0;s!=t.height;++s){let h=r+s*t.width;!e.has(h)&&(t.exploreNetworkOf(r,s,(r,s)=>e.set(r+s*t.width,i)),++i)}let r=new Map;for(let[t,i]of e.entries())r.set(t,["blue","red","green","purple"][i%4]);return r}(this);e=(e,i)=>t.get(e+i*this.width)||"black"}let i=t.getContext("2d"),r=this.brokenWalls?50:0;i.fillStyle="red",i.fillRect(0,0,100*this.width+2*r,100*this.height+2*r);for(let t=0;t!=this.height;++t)for(let s=0;s!=this.width;++s){let h=e(s,t),o=this.grid[t][s],l=this._lockParadigmOf(o,s,t);o.draw(i,100*s+r,100*t+r,100,100,h,l,this.blackPipes)}if(this.brokenWalls){let t=this;function s(r,s,h,o){let l=e(r,s),n=t.grid[s][r],u=t._lockParadigmOf(n,r,s);n.draw(i,h,o,100,100,l,u,t.blackPipes),i.globalAlpha=.5,i.fillStyle="white",i.fillRect(h,o,100,100),i.globalAlpha=1}s(this.width-1,this.height-1,-r,-r),s(0,this.height-1,100*this.width+r,-r),s(0,0,100*this.width+r,100*this.height+r),s(this.width-1,0,-r,100*this.height+r);for(let t=0;t!=this.width;++t)s(t,this.height-1,100*t+r,-r),s(t,0,100*t+r,100*this.height+r);for(let t=0;t!=this.width;++t)s(0,t,100*this.width+r,100*t+r),s(this.width-1,t,-r,100*t+r)}}_lockParadigmOf(t,e,r){return t.blocked?this.fitsWithNearbyBlocked({x:e,y:r})?i.LockedOk:i.LockedWithConflict:i.NotLocked}fitsWithNearbyBlocked(t){let e=this.get(t);return void 0===this.getNeighboursOf(t).find(({other:t,dir:i})=>null===t?!0===e[i]:t.blocked&&e[i]!==t[u(i)])}exploreNetworkOf(t,e,i){let r=new Set;r.add(e+","+t),i(t,e);let s=[{x:t,y:e}],h=(t,e,h,o,l,n)=>{if(this.brokenWalls)t+l<0&&(l+=this.width),e+n<0&&(n+=this.height),t+l===this.width&&(l=-t),e+n===this.height&&(n=-e);else if(t+l<0||e+n<0||t+l>=this.width||e+n>=this.height)return;if(!this.grid[e][t][h])return;let u=this.grid[e+n][t+l];if(!u[o])return;let f=`${e+n},${t+l}`;r.has(f)||(r.add(f),i(t+l,e+n),s.push({x:t+l,y:e+n}))};for(;0!==s.length;){let t=s[s.length-1];s.splice(s.length-1,1),h(t.x,t.y,"north","south",0,-1),h(t.x,t.y,"south","north",0,1),h(t.x,t.y,"east","west",1,0),h(t.x,t.y,"west","east",-1,0)}}checkWin(){let t=0;return this.exploreNetworkOf(0,0,()=>++t),t===this.width*this.height}solve(){for(let t of function(t){let e=k.fromIGrid(t);return e.trySolve()||[]}(this)){let e=this.grid[t.y][t.x];for(let i=0;4!=i;++i){if(e.north===t.north&&e.south===t.south&&e.east===t.east&&e.west===t.west){e.blocked=!0;break}e.rotate()}}}shift(t){let e;if(!this.brokenWalls)return;function i(t,e){if(t>=e)return t%e;for(;t<0;)t+=e;return t}if("right"===t)e=(t,e)=>this.grid[e][i(t-1,this.width)];else if("left"===t)e=(t,e)=>this.grid[e][i(t+1,this.width)];else if("up"===t)e=(t,e)=>this.grid[i(e+1,this.height)][t];else{if("down"!==t)return;e=(t,e)=>this.grid[i(e-1,this.height)][t]}let r=[];for(let t=0;t!=this.height;++t){let i=[];for(let r=0;r!=this.width;++r)i.push(e(r,t));r.push(i)}this.grid=r}}const m={width:5,height:5,broken:!1};window.onload=()=>{document.getElementById("width").value=m.width.toString(),document.getElementById("height").value=m.height.toString(),document.getElementById("broken").checked=m.broken;let t=document.getElementById("maze");function e(){let e=new x(parseInt(document.getElementById("width").value),parseInt(document.getElementById("height").value),!!document.getElementById("broken").checked),i=e.brokenWalls?50:0;return!function(t,e,i){let r=t.style;r.width=`${e}px`,r.height=`${i}px`,t.width=e,t.height=i}(t,100*e.width+2*i,100*e.height+2*i),e.draw(t),e}let i=e();function s(e){let r=e.clientX-t.getBoundingClientRect().x,s=e.clientY-t.getBoundingClientRect().y;i.brokenWalls&&(r-=50,s-=50);let h=Math.floor(r/100),o=Math.floor(s/100);if(h>=0&&o>=0&&h<i.width&&o<i.height)return{type:"slot",x:h,y:o,slot:i.grid[o][h]};if(!i.brokenWalls)return{type:"void"};{let t={type:"movement",directions:[]};return h<0&&t.directions.push("right"),o<0&&t.directions.push("down"),h>=i.width&&t.directions.push("left"),o>=i.height&&t.directions.push("up"),t}}document.getElementById("reset").onclick=()=>i=e(),t.addEventListener("click",e=>{let h=s(e);if("slot"==h.type)(function(t,e,i,s){if(t.blocked)return;let h={x:e,y:i},o=function(){let t=document.getElementById("qol_spin");return"autolock"===t.value?r.AutoLock:"restrained"===t.value?r.Restrained:r.Free}();if(o===r.AutoLock||o===r.Restrained){let e=[!1,!1,!1,!1];for(let i=0;4!=i;++i)t.rotate(),e[i]=s.fitsWithNearbyBlocked(h);let i=e.filter(t=>t).length;if(t.isABar()&&(i/=2),o===r.AutoLock&&1===i){for(;!s.fitsWithNearbyBlocked(h);)t.rotate();t.blocked=!0}else if((o===r.Restrained||o===r.AutoLock)&&i>0)for(t.rotate();!s.fitsWithNearbyBlocked(h);)t.rotate();else t.rotate()}else t.rotate()})(h.slot,h.x,h.y,i),i.draw(t);else if("movement"==h.type){for(let t of h.directions)i.shift(t);i.draw(t)}}),t.addEventListener("contextmenu",e=>{e.preventDefault();let r=s(e);if("slot"==r.type){let e=r.slot;e.blocked=!e.blocked,i.draw(t)}return!1}),document.addEventListener("keypress",e=>{let r=e||window.event;return"d"===r.key?(i.shift("right"),i.draw(t)):"q"===r.key||"a"===r.key?(i.shift("left"),i.draw(t)):"s"===r.key?(i.shift("down"),i.draw(t)):"z"===r.key||"w"===r.key?(i.shift("up"),i.draw(t)):"c"===r.key?(i.invertColorDisplay(),i.draw(t)):"m"===r.key&&(i.solve(),i.draw(t)),!1})};
//# sourceMappingURL=index.d072d556.js.map