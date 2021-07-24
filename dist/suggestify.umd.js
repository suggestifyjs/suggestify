/*!
* @project      suggestify
* @author      	Max van der Schee
* @build        1627131565239
* @release      1.0.0
* @copyright    Copyright (c) 2021 Max van der Schee
*/
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).suggestify=e()}(this,(function(){"use strict";return class{constructor(t,e){var s,i;this.cache={},this.timeout=250,this.autoSuggest=()=>{this.request(this.searchInput).catch((t=>{throw new Error(t.message)}))},this.handleBlur=()=>{setTimeout((()=>{this.DeleteResultList()}),100)},this.inputSelected=()=>{this.request(this.searchInput).then((t=>{this.DeleteResultList(),this.createResultList(t)})).catch((t=>{throw new Error(t.message)}))},this.EnterHandler=()=>{this.searchInput&&(window.location.href=`${this.url}${this.searchInput}`)},this.keyHandler=({key:t})=>{((t,e="_default")=>s=>(t[s]||t[e])())({Enter:this.EnterHandler,Escape:this.DeleteResultList,_default:()=>null},"_default")(t)},this.searchHandler=({target:t})=>{this.timeout&&clearTimeout(this.timeout),this.timeout=setTimeout((()=>{const e=t.value.trim();this.searchInput=e?function(t){const e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&grave;","/":"&#x2F;"};return t.replace(/[&<>"'/`]/gi,(t=>e[t]))}(e):null,this.request(this.searchInput).then((t=>{this.DeleteResultList(),this.createResultList(t),console.info(`result (${t.time.toFixed(2)} seconds)`)})).catch((t=>{throw new Error(t.message)}))}),250)},this.DeleteResultList=()=>{this.root.classList.remove("expanded"),this.input.setAttribute("aria-expanded","false"),this.list.innerHTML=""},this.root="string"==typeof t?document.querySelector(t):t,this.url=e.url||"?q=",this.class=e.class||"suggestify",this.searchInput=null,this.translations=e.translations||null,this.engine=e.engine||"/api/search",this.input=null==(s=this.root)?void 0:s.querySelector("input"),this.list=null==(i=this.root)?void 0:i.querySelector("ul"),this.root&&this.initialize()}initialize(){var t,e;const s=document.createElement("i");s.setAttribute("role","presentation"),s.setAttribute("focusable","false"),s.setAttribute("aria-hidden","true"),s.className=`${this.class}-icon`,null==(e=this.root)||e.insertBefore(s,null==(t=this.root)?void 0:t.childNodes[0]),this.input&&this.list&&(this.input.setAttribute("role","combobox"),this.input.setAttribute("autocomplete","off"),this.input.setAttribute("autocapitalize","off"),this.input.setAttribute("autocorrect","off"),this.input.setAttribute("spellcheck","false"),this.input.setAttribute("aria-autocomplete","list"),this.input.setAttribute("aria-haspopup","listbox"),this.input.setAttribute("aria-expanded","false"),this.input.className=`${this.class}-input`,this.searchInput=this.input.value,this.list.setAttribute("role","listbox"),this.list.className=`${this.class}-result`,this.list.id||(this.list.id=`${this.class}-result-${((t=21)=>{let e="",s=crypto.getRandomValues(new Uint8Array(t));for(;t--;){let i=63&s[t];e+=i<36?i.toString(36):i<62?(i-26).toString(36).toUpperCase():i<63?"_":"-"}return e})(5)}`),this.input.setAttribute("aria-owns",this.list.id),this.input.addEventListener("input",this.searchHandler,{passive:!0}),this.input.addEventListener("click",this.inputSelected,{passive:!0}),this.input.addEventListener("keydown",this.keyHandler,{passive:!0}),this.input.addEventListener("mouseover",this.autoSuggest,{once:!0,passive:!0}),this.input.addEventListener("blur",this.handleBlur,{passive:!0}))}async request(t){const e=JSON.stringify(t);if(this.cache[e])return this.cache[e];const s={method:"POST",body:JSON.stringify({search:t})},i=await fetch(this.engine,s).then((t=>t.json()));return this.cache[e]=i,i}createResultList(t){var e,s,i,n,l,a,r,h;if(this.root.classList.add("expanded"),this.input.setAttribute("aria-expanded","true"),t.items.length){if("suggestions"===t.type){const t=document.createElement("li");t.className=`${this.class}-banner`,t.textContent=(null==(e=this.translations)?void 0:e.suggestions)?null==(s=this.translations)?void 0:s.suggestions:"Suggestions:",this.list.appendChild(t)}for(let e=0;e<t.items.length;e++){const s=t.items[e],l=document.createElement("li"),a=document.createElement("a");if(a.className=`${this.class}-link`,a.setAttribute("aria-label",`${(null==(i=this.translations)?void 0:i.linkLabel)?null==(n=this.translations)?void 0:n.linkLabel:"Search on"} ${s}`),a.href=`${this.url}${s}`,"results"===t.type){const t=this.searchInput?this.searchInput.split(" "):[];let e=s;for(let s=0;s<t.length;s++){const i=t[s];e=e.replace(i,`<b>${i}</b>`)}a.innerHTML=e}else a.textContent=s;l.appendChild(a),this.list.appendChild(l)}}else if("results"===t.type){const t=document.createElement("li"),e=document.createElement("li"),s=document.createElement("a");t.className=`${this.class}-banner`,t.textContent=(null==(l=this.translations)?void 0:l.results)?null==(a=this.translations)?void 0:a.results:"No suggestions found",s.className=`${this.class}-link`,s.setAttribute("aria-label",`${(null==(r=this.translations)?void 0:r.linkLabel)?null==(h=this.translations)?void 0:h.linkLabel:"Search on"} ${this.searchInput}`),s.href=`${this.url}${this.searchInput}`,s.textContent=this.searchInput,e.appendChild(s),this.list.appendChild(t),this.list.appendChild(e)}}}}));
