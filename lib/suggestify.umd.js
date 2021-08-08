/*!
* @project      suggestify
* @author      	Max van der Schee
* @build        1628417475025
* @release      1.0.0
* @copyright    Copyright (c) 2021 Max van der Schee
*/
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).suggestify=e()}(this,(function(){"use strict";function t(t,e){for(var s in e)t.setAttribute(s,e[s])}return class{constructor(t,e){this.list=null,this.listItems=[],this.selectedIndex=-1,this.searchInput=null,this.cache={},this.timeout=250,this.handleBlur=()=>{setTimeout((()=>{this.deleteResultList()}),100)},this.inputSelected=()=>{this.request(this.searchInput).then((t=>{this.deleteResultList(),this.createResultList(t)})).catch((t=>{throw new Error(t.message)}))},this.clearInput=()=>{this.searchInput=null,this.input.value="",this.deleteResultList(),this.clearBtn&&(this.clearBtn.hidden=!0)},this.directSearch=()=>{if(-1!==this.selectedIndex){const t=this.listItems[this.selectedIndex];window.location.href=`${this.url}${t.id.replace("_"," ")}`}else this.searchInput&&(window.location.href=`${this.url}${this.searchInput}`)},this.selectItemUp=()=>{const t=this.listItems.length-1,e=this.listItems[this.selectedIndex];e&&e.classList.remove("selected"),this.selectedIndex<=0?this.selectedIndex=t:this.selectedIndex--;const s=this.listItems[this.selectedIndex];s&&(this.input.setAttribute("aria-activedescendant",s.id),s.classList.add("selected"))},this.selectItemDown=()=>{const t=this.listItems.length-1,e=this.listItems[this.selectedIndex];e&&e.classList.remove("selected"),this.selectedIndex===t?this.selectedIndex=0:this.selectedIndex++;const s=this.listItems[this.selectedIndex];s&&(this.input.setAttribute("aria-activedescendant",s.id),s.classList.add("selected"))},this.keyHandler=({key:t})=>{((t,e="_default")=>s=>(t[s]||t[e])())({Enter:this.directSearch,Escape:this.deleteResultList,ArrowUp:this.selectItemUp,ArrowDown:this.selectItemDown,_default:()=>null},"_default")(t)},this.autoSuggest=()=>{this.request(this.searchInput).then((t=>{this.instant&&this.createResultList(t)})).catch((t=>{throw new Error(t.message)}))},this.searchInputHandler=({target:t})=>{this.timeout&&clearTimeout(this.timeout),this.timeout=setTimeout((()=>{const e=t.value.trim();this.searchInput=e?function(t){const e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&grave;","/":"&#x2F;"};return t.replace(/[&<>"'/`]/gi,(t=>e[t]))}(e):null,e&&this.clearBtn?this.clearBtn.hidden=!1:this.clearBtn&&(this.clearBtn.hidden=!0),this.request(this.searchInput).then((t=>{this.deleteResultList(),this.createResultList(t)})).catch((t=>{throw new Error(t.message)}))}),250)},this.banner=t=>{var e,s,i,n;const l=document.createElement("li");l.className=`${this.class}-banner`,"suggestions"===t&&(l.textContent=(null==(e=this.t)?void 0:e.suggestions)?null==(s=this.t)?void 0:s.suggestions:"Suggestions"),"empty"===t&&(l.textContent=(null==(i=this.t)?void 0:i.results)?null==(n=this.t)?void 0:n.results:"No suggestions found"),"results"!==t&&this.list.appendChild(l)},this.deleteResultList=()=>{this.root.classList.remove("expanded"),this.input.setAttribute("aria-expanded","false"),this.input.setAttribute("aria-activedescendant",""),this.list.innerHTML="",this.listItems=[],this.selectedIndex=-1},this.root="string"==typeof t?document.querySelector(t):t,this.input=this.root&&this.root.querySelector("input"),this.clearBtn=this.root&&this.root.querySelector('button:not([type="submit"])'),this.submitBtn=this.root&&this.root.querySelector('button[type="submit"]'),this.url=e.url||"?q=",this.class=e.class||"suggestify",this.blur=void 0===e.blur||e.blur,this.instant=void 0!==e.instant&&e.instant,this.icon=void 0===e.icon||e.icon,this.t=e.translations||null,this.engine=e.engine||"/api/search",this.initialize()}initialize(){if(!this.root)throw new Error("Selector not found");if(!this.input)throw new Error("Input field missing");this.initializeDOM(),this.input.addEventListener("input",this.searchInputHandler,{passive:!0}),this.input.addEventListener("click",this.inputSelected,{passive:!0}),this.input.addEventListener("keydown",this.keyHandler,{passive:!0}),this.clearBtn&&this.clearBtn.addEventListener("click",this.clearInput,{passive:!0}),this.submitBtn&&this.submitBtn.addEventListener("click",this.directSearch,{passive:!0}),this.blur&&this.input.addEventListener("blur",this.handleBlur,{passive:!0}),this.instant?this.autoSuggest():this.input.addEventListener("mouseover",this.autoSuggest,{once:!0,passive:!0})}initializeDOM(){var e;const s=`${this.class}-results-${((t=21)=>{let e="",s=crypto.getRandomValues(new Uint8Array(t));for(;t--;){let i=63&s[t];e+=i<36?i.toString(36):i<62?(i-26).toString(36).toUpperCase():i<63?"_":"-"}return e})(5)}`;if(this.root.className=this.class,this.root.setAttribute("role","search"),t(this.input,{class:`${this.class}-input`,role:"combobox",autocomplete:"off",autocapitalize:"off",autocorrect:"off",spellcheck:"off","aria-autocomplete":"list","aria-haspopup":"listbox","aria-expanded":"false","aria-owns":s}),this.searchInput=this.input.value,this.icon){const e=document.createElement("i");t(e,{class:`${this.class}-icon`,role:"presentation",focusable:"false","aria-hidden":"true"});const s=e.cloneNode(!1);this.clearBtn.appendChild(e),this.submitBtn.appendChild(s)}t(this.clearBtn,{class:`${this.class}-clear`,hidden:""}),this.submitBtn.className=`${this.class}-submit`,this.list=document.createElement("ul"),t(this.list,{id:s,class:`${this.class}-results`,role:"listbox"}),null==(e=this.root)||e.appendChild(this.list)}async request(t){const e=JSON.stringify(t);if(this.cache[e])return this.cache[e];const s={method:"POST",body:JSON.stringify({search:t})},i=await fetch(this.engine,s).then((t=>t.json()));return this.cache[e]=i,i}createResultList(e){if(this.root.classList.add("expanded"),this.list.setAttribute("aria-expanded","true"),this.input.setAttribute("aria-activedescendant",""),this.banner(e.type),e.items.length)for(let s=0;s<e.items.length;s++){const i=document.createElement("li"),n=document.createElement("a"),l=e.items[s];if(t(n,{class:`${this.class}-link`,href:`${this.url}${l}`}),"results"===e.type){const t=this.searchInput?this.searchInput.split(" "):[];let e=l;for(let s=0;s<t.length;s++){const i=t[s];e=e.replace(i,`<b>${i}</b>`)}n.innerHTML=e}else n.textContent=l;i.id=l.replace(" ","_"),i.appendChild(n),this.listItems.push(i)}else{const e=document.createElement("li"),s=document.createElement("a");t(s,{class:`${this.class}-link`,href:`${this.url}${this.searchInput}`}),s.textContent=this.searchInput,e.appendChild(s),this.listItems.push(e)}for(let t=0;t<this.listItems.length;t++)this.list.appendChild(this.listItems[t])}}}));