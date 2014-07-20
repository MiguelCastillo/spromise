/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 *
 * https://github.com/MiguelCastillo/spromise
 */

/**
 * spromise Copyright (c) 2014 Miguel Castillo.
 * Licensed under MIT
 */

define("src/async",[],function(){var e=this,t;return e.setImmediate?t=e.setImmediate:e.process&&typeof e.process.nextTick=="function"?t=e.process.nextTick:t=function(t){e.setTimeout(t,0)},t}),define("src/promise",["src/async"],function(e){function r(e,s){function a(e,t){return u.then(e,t)}function f(e){return u.enqueue(t.resolved,e),o.promise}function l(e){return u.enqueue(t.rejected,e),o.promise}function c(e){return u.enqueue(t.always,e),o.promise}function h(e){return u.enqueue(t.notify,e),o.promise}function p(){return n[u.state]}function d(){return u.transition(t.resolved,this,arguments),o}function v(){return u.transition(t.rejected,this,arguments),o}if(this instanceof r==0)return new r(e,s);var o=this,u=new i(s||{});a.constructor=r,a.stateManager=u,o.always=c,o.done=f,o.fail=l,o.notify=h,o.resolve=d,o.reject=v,o.then=a,o.state=p,o.promise={always:c,done:f,fail:l,notify:h,then:a,state:p},typeof e=="function"&&e.call(o,o.resolve,o.reject)}function i(e){this.state=t.pending,e.state&&this.transition(e.state,e.context,e.value)}function s(e){this.promise=e}var t={pending:0,always:1,resolved:2,rejected:3,notify:4},n=["pending","","resolved","rejected",""];return r.defer=function(){return new r},r.thenable=function(e){return new r(e.then)},r.rejected=function(){return new r(null,{context:this,value:arguments,state:t.rejected})},r.resolved=function(){return new r(null,{context:this,value:arguments,state:t.resolved})},i.prototype.enqueue=function(n,r,i){var s=this,o=s.state;o?o===n||t.always===n?i?r.apply(s.context,s.value):e(function(){r.apply(s.context,s.value)}):t.notify===n&&(i?r.call(s.context,s.state,s.value):e(function(){r.call(s.context,s.state,s.value)})):(this.queue||(this.queue=[])).push({state:n,cb:r})},i.prototype.transition=function(e,t,n,r){if(this.state)return;this.state=e,this.context=t,this.value=n;if(this.queue){var i=this.queue,s=i.length,o=0,u;this.queue=null;for(;o<s;o++)u=i[o],this.enqueue(u.state,u.cb,r)}},i.prototype.then=function(e,n){var i;return e=typeof e=="function"?e:null,n=typeof n=="function"?n:null,!e&&this.state===t.resolved||!n&&this.state===t.rejected?new r(null,this):(i=new s(new r),this.enqueue(t.notify,i.notify(e,n)),i.promise)},s.prototype.notify=function(e,n){var r=this;return function(s,o){var u=(e||n)&&(s===t.resolved?e||n:n||e);try{r.context=this,r.finalize(s,u?[u.apply(this,o)]:o)}catch(a){r.promise.reject.call(r.context,a)}}},s.prototype.chain=function(e){var t=this;return function(){try{t.resolved||(t.resolved=!0,t.context=this,t.finalize(e,arguments))}catch(r){t.promise.reject.call(t.context,r)}}},s.prototype.finalize=function(e,n){var i=n[0],o=i&&i.then,u=this.promise,a=this.context,f,l;if(i===this.promise)throw new TypeError("Resolution input must not be the promise being resolved");if(o&&o.constructor===r){o.stateManager.enqueue(t.notify,this.notify(),!0);return}l=o&&typeof o=="function"&&typeof i;if(l==="function"||l==="object")try{f=new s(u),o.call(i,f.chain(t.resolved),f.chain(t.rejected))}catch(c){f.resolved||u.reject.call(a,c)}else u.then.stateManager.transition(e,a,n,!0)},r.states=t,r}),define("src/when",["src/promise","src/async"],function(e,t){function n(e,t,n){return typeof e=="function"?e.apply(n,t||[]):e}function r(){function a(){u--,u||s.resolve.apply(o,i)}function f(e){return function(){i[e]=arguments.length===1?arguments[0]:arguments,a()}}function l(){var e,t,o;for(e=0,o=u;e<o;e++)t=r[e],t&&typeof t.then=="function"?t.then(f(e),s.reject):(i[e]=n(t),a())}var r=arguments,i=[],s=e.defer(),o=this,u=r.length;return r.length?(t(l),s):s.resolve()}return r}),define("src/spromise",["src/promise","src/async","src/when"],function(e,t,n){return e.when=n,e.async=t,e});