/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 *
 * https://github.com/MiguelCastillo/spromise
 */

/**
 * almond 0.2.6 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */

/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */

(function(e,t){typeof require=="function"&&typeof exports=="object"&&typeof module=="object"?module.exports=t():typeof define=="function"&&define.amd?define(t):e.spromise=t()})(this,function(){var e,t,n;return function(r){function d(e,t){return h.call(e,t)}function v(e,t){var n,r,i,s,o,u,a,f,c,h,p=t&&t.split("/"),d=l.map,v=d&&d["*"]||{};if(e&&e.charAt(0)===".")if(t){p=p.slice(0,p.length-1),e=p.concat(e.split("/"));for(f=0;f<e.length;f+=1){h=e[f];if(h===".")e.splice(f,1),f-=1;else if(h===".."){if(f===1&&(e[2]===".."||e[0]===".."))break;f>0&&(e.splice(f-1,2),f-=2)}}e=e.join("/")}else e.indexOf("./")===0&&(e=e.substring(2));if((p||v)&&d){n=e.split("/");for(f=n.length;f>0;f-=1){r=n.slice(0,f).join("/");if(p)for(c=p.length;c>0;c-=1){i=d[p.slice(0,c).join("/")];if(i){i=i[r];if(i){s=i,o=f;break}}}if(s)break;!u&&v&&v[r]&&(u=v[r],a=f)}!s&&u&&(s=u,o=a),s&&(n.splice(0,o,s),e=n.join("/"))}return e}function m(e,t){return function(){return s.apply(r,p.call(arguments,0).concat([e,t]))}}function g(e){return function(t){return v(t,e)}}function y(e){return function(t){a[e]=t}}function b(e){if(d(f,e)){var t=f[e];delete f[e],c[e]=!0,i.apply(r,t)}if(!d(a,e)&&!d(c,e))throw new Error("No "+e);return a[e]}function w(e){var t,n=e?e.indexOf("!"):-1;return n>-1&&(t=e.substring(0,n),e=e.substring(n+1,e.length)),[t,e]}function E(e){return function(){return l&&l.config&&l.config[e]||{}}}var i,s,o,u,a={},f={},l={},c={},h=Object.prototype.hasOwnProperty,p=[].slice;o=function(e,t){var n,r=w(e),i=r[0];return e=r[1],i&&(i=v(i,t),n=b(i)),i?n&&n.normalize?e=n.normalize(e,g(t)):e=v(e,t):(e=v(e,t),r=w(e),i=r[0],e=r[1],i&&(n=b(i))),{f:i?i+"!"+e:e,n:e,pr:i,p:n}},u={require:function(e){return m(e)},exports:function(e){var t=a[e];return typeof t!="undefined"?t:a[e]={}},module:function(e){return{id:e,uri:"",exports:a[e],config:E(e)}}},i=function(e,t,n,i){var s,l,h,p,v,g=[],w;i=i||e;if(typeof n=="function"){t=!t.length&&n.length?["require","exports","module"]:t;for(v=0;v<t.length;v+=1){p=o(t[v],i),l=p.f;if(l==="require")g[v]=u.require(e);else if(l==="exports")g[v]=u.exports(e),w=!0;else if(l==="module")s=g[v]=u.module(e);else if(d(a,l)||d(f,l)||d(c,l))g[v]=b(l);else{if(!p.p)throw new Error(e+" missing "+l);p.p.load(p.n,m(i,!0),y(l),{}),g[v]=a[l]}}h=n.apply(a[e],g);if(e)if(s&&s.exports!==r&&s.exports!==a[e])a[e]=s.exports;else if(h!==r||!w)a[e]=h}else e&&(a[e]=n)},e=t=s=function(e,t,n,a,f){return typeof e=="string"?u[e]?u[e](t):b(o(e,t).f):(e.splice||(l=e,t.splice?(e=t,t=n,n=null):e=r),t=t||function(){},typeof n=="function"&&(n=a,a=f),a?i(r,e,t,n):setTimeout(function(){i(r,e,t,n)},4),s)},s.config=function(e){return l=e,l.deps&&s(l.deps,l.callback),s},e._defined=a,n=function(e,t,n){t.splice||(n=t,t=[]),!d(a,e)&&!d(f,e)&&(f[e]=[e,t,n])},n.amd={jQuery:!0}}(),n("lib/js/almond",function(){}),n("src/async",[],function(){var e=this,t;return e.setImmediate?t=e.setImmediate:e.process&&typeof e.process.nextTick=="function"?t=e.process.nextTick:t=function(t){e.setTimeout(t,0)},t}),n("src/promise",["src/async"],function(e){function r(e,s){function a(e,t){return u.then(e,t)}function f(e){return u.enqueue(t.resolved,e),o.promise}function l(e){return u.enqueue(t.rejected,e),o.promise}function c(e){return u.enqueue(t.always,e),o.promise}function h(e){return u.enqueue(t.notify,e),o.promise}function p(){return n[u.state]}function d(){return u.transition(t.resolved,this,arguments),o}function v(){return u.transition(t.rejected,this,arguments),o}if(this instanceof r==0)return new r(e,s);var o=this,u=new i(o,s||{});a.constructor=r,a.stateManager=u,o.always=c,o.done=f,o.fail=l,o.notify=h,o.resolve=d,o.reject=v,o.then=a,o.state=p,o.promise={always:c,done:f,fail:l,notify:h,then:a,state:p},typeof e=="function"&&e.call(o,o.resolve,o.reject)}function i(e,n){this.state=t.pending,n.state&&this.transition(n.state,n.context,n.value)}function s(e){this.promise=e}var t={pending:0,always:1,resolved:2,rejected:3,notify:4},n=["pending","","resolved","rejected",""];return r.defer=function(){return new r},r.thenable=function(e){return new r(e.then)},r.rejected=function(){return new r(null,{context:this,value:arguments,state:t.rejected})},r.resolved=function(){return new r(null,{context:this,value:arguments,state:t.resolved})},i.prototype.enqueue=function(n,r,i){var s=this,o=s.state;o?o===n||t.always===n?i?r.apply(s.context,s.value):e(function(){r.apply(s.context,s.value)}):t.notify===n&&(i?r.call(s.context,s.state,s.value):e(function(){r.call(s.context,s.state,s.value)})):(this.queue||(this.queue=[])).push({state:n,cb:r})},i.prototype.transition=function(e,t,n,r){if(this.state)return;this.state=e,this.context=t,this.value=n;if(this.queue){var i=this.queue,s=i.length,o=0,u;this.queue=null;for(;o<s;o++)u=i[o],this.enqueue(u.state,u.cb,r)}},i.prototype.then=function(e,n){var i;return e=typeof e=="function"?e:null,n=typeof n=="function"?n:null,!e&&this.state===t.resolved||!n&&this.state===t.rejected?new r(null,this):(i=new s(new r),this.enqueue(t.notify,i.notify(e,n)),i.promise)},s.prototype.notify=function(e,n){var r=this;return function(s,o){var u=(e||n)&&(s===t.resolved?e||n:n||e);try{r.context=this,r.finalize(s,u?[u.apply(this,o)]:o)}catch(a){r.promise.reject.call(r.context,a)}}},s.prototype.chain=function(e){var t=this;return function(){try{t.resolved||(t.resolved=!0,t.context=this,t.finalize(e,arguments))}catch(r){t.promise.reject.call(t.context,r)}}},s.prototype.finalize=function(e,n){var i=n[0],o=i&&i.then,u=this.promise,a=this.context,f,l;if(i===this.promise)throw new TypeError("Resolution input must not be the promise being resolved");if(o&&o.constructor===r)return o.stateManager.enqueue(t.notify,this.notify(),!0);l=o&&typeof o=="function"&&typeof i;if(l==="function"||l==="object")try{f=new s(u),o.call(i,f.chain(t.resolved),f.chain(t.rejected))}catch(c){f.resolved||u.reject.call(a,c)}else u.then.stateManager.transition(e,a,n)},r.states=t,r}),n("src/when",["src/promise","src/async"],function(e,t){function n(e,t,n){return typeof e=="function"?e.apply(n,t||[]):e}function r(){function l(){a&&a--,a||i.resolve.apply(s,r)}function c(e){return function(){r[e]=arguments.length===1?arguments[0]:arguments,l()}}function h(){i.reject.apply(this,arguments)}function p(){f=a=r.length;for(o=0;o<f;o++)u=r[o],u&&typeof u.then=="function"?u.then(c(o),h):(r[o]=n(u),l())}var r=Array.prototype.slice.call(arguments),i=e.defer(),s=this,o,u,a,f;return r.length?(t(p),i):i.resolve(null)}return r}),n("src/spromise",["src/promise","src/async","src/when"],function(e,t,n){return e.when=n,e.async=t,e}),t("src/spromise")});