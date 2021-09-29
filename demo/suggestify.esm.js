/*!
* suggestify v1.2.1
* (c) 2021 Max van der Schee
* @license MIT
*/
let t=(t=21)=>{let e="",s=crypto.getRandomValues(new Uint8Array(t));for(;t--;){let i=63&s[t];e+=i<36?i.toString(36):i<62?(i-26).toString(36).toUpperCase():i<63?"_":"-"}return e};function e(t,e){for(var s in e)t.setAttribute(s,e[s])}export default class{constructor(t,e){this.list=null,this.listItems=[],this.selectedIndex=-1,this.searchInput="",this.cache={},this.timeout=250,this.handleBlur=()=>{setTimeout((()=>{this.deleteResultList()}),100)},this.inputSelected=()=>{this.request(this.searchInput).then((t=>{this.deleteResultList(),this.createResultList(t)})).catch((t=>{throw new Error(t.message)}))},this.clearInput=()=>{this.searchInput="",this.input.value="",this.deleteResultList(),this.clearBtn&&(this.clearBtn.hidden=!0)},this.directSearch=()=>{let t="";if(-1!==this.selectedIndex){const e=this.listItems[this.selectedIndex];t=e.title}else this.searchInput&&(t=this.searchInput.toLowerCase());if(this.onComplete&&t){const e=this.listItems.find((e=>e.title===t))?"HIT":"MISS";this.onComplete({value:t,success:e}).then((()=>{window.location.href=`${this.url}${t}`}))}else window.location.href=`${this.url}${t}`},this.selectItemUp=()=>{if(this.listItems.length){const t=this.listItems.length-1,e=this.listItems[this.selectedIndex];e&&e.classList.remove("selected"),this.selectedIndex<=0?this.selectedIndex=t:this.selectedIndex--;const s=this.listItems[this.selectedIndex];s&&(this.input.setAttribute("aria-activedescendant",s.id),s.classList.add("selected"))}},this.selectItemDown=()=>{if(this.listItems.length){const t=this.listItems.length-1,e=this.listItems[this.selectedIndex];e&&e.classList.remove("selected"),this.selectedIndex===t?this.selectedIndex=0:this.selectedIndex++;const s=this.listItems[this.selectedIndex];s&&(this.input.setAttribute("aria-activedescendant",s.id),s.classList.add("selected"))}},this.keyHandler=({key:t})=>{((t,e="_default")=>s=>(t[s]||t[e])())({Enter:this.directSearch,Escape:this.deleteResultList,ArrowUp:this.selectItemUp,ArrowDown:this.selectItemDown,_default:()=>null},"_default")(t)},this.autoSuggest=()=>{this.request(this.searchInput).then((t=>{this.instant&&this.createResultList(t)})).catch((t=>{throw new Error(t.message)}))},this.searchInputHandler=({target:t})=>{this.timeout&&clearTimeout(this.timeout),this.timeout=setTimeout((()=>{const e=t.value.trim();this.searchInput=e?function(t){const e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&grave;","/":"&#x2F;"};return t.replace(/[&<>"'/`]/gi,(t=>e[t]))}(e):"",e&&this.clearBtn?this.clearBtn.hidden=!1:this.clearBtn&&(this.clearBtn.hidden=!0),this.engine&&this.request(this.searchInput).then((t=>{this.deleteResultList(),this.createResultList(t)})).catch((t=>{throw new Error(t.message)}))}),250)},this.banner=t=>{var e,s,i,n;const l=document.createElement("li");l.className=`${this.class}-banner`,"suggestions"===t&&(l.textContent=(null==(e=this.t)?void 0:e.suggestions)?null==(s=this.t)?void 0:s.suggestions:"Suggestions"),"empty"===t&&(l.textContent=(null==(i=this.t)?void 0:i.results)?null==(n=this.t)?void 0:n.results:"No suggestions found"),"results"!==t&&this.list.appendChild(l)},this.linkHandler=(t,e)=>{t.preventDefault(),this.onComplete?this.onComplete({value:e,success:"HIT"}).then((()=>{window.location.href=`${this.url}${e}`})):window.location.href=`${this.url}${e}`},this.deleteResultList=()=>{this.list&&(this.root.classList.remove("expanded"),this.input.setAttribute("aria-expanded","false"),this.input.setAttribute("aria-activedescendant",""),this.list.innerHTML="",this.listItems=[],this.selectedIndex=-1)},this.root="string"==typeof t?document.querySelector(t):t,this.input=this.root&&this.root.querySelector("input"),this.clearBtn=this.root&&this.root.querySelector('button:not([type="submit"])'),this.submitBtn=this.root&&this.root.querySelector('button[type="submit"]'),this.url=e.url||"?q=",this.class=e.class||"suggestify",this.blur=void 0===e.blur||e.blur,this.instant=void 0!==e.instant&&e.instant,this.icon=void 0===e.icon||e.icon,this.t=e.translations||null,this.engine=e.engine,this.onComplete=e.onComplete,this.initialize()}initialize(){if(!this.root)throw new Error("Selector not found");if(!this.input)throw new Error("Input field missing");this.initializeDOM(),this.input.addEventListener("keydown",this.keyHandler,{passive:!0}),this.input.addEventListener("input",this.searchInputHandler,{passive:!0}),this.clearBtn&&this.clearBtn.addEventListener("click",this.clearInput,{passive:!0}),this.submitBtn&&this.submitBtn.addEventListener("click",this.directSearch,{passive:!0}),this.engine&&(this.input.addEventListener("click",this.inputSelected,{passive:!0}),this.blur&&this.input.addEventListener("blur",this.handleBlur,{passive:!0}),this.instant?this.autoSuggest():this.input.addEventListener("mouseover",this.autoSuggest,{once:!0,passive:!0}))}initializeDOM(){var s;const i=`${this.class}-results-${t(5)}`;if(this.root.className=this.class,this.root.setAttribute("role","search"),e(this.input,{class:`${this.class}-input`,autocomplete:"off",autocapitalize:"off",autocorrect:"off",spellcheck:"off"}),this.searchInput=this.input.value,this.icon){const t=document.createElement("i");e(t,{class:`${this.class}-icon`,role:"presentation",focusable:"false","aria-hidden":"true"});const s=t.cloneNode(!1);this.clearBtn.appendChild(t),this.submitBtn.appendChild(s)}e(this.clearBtn,{class:`${this.class}-clear`,hidden:""}),this.submitBtn.className=`${this.class}-submit`,this.engine&&(e(this.input,{role:"combobox","aria-autocomplete":"list","aria-haspopup":"listbox","aria-expanded":"false","aria-owns":i}),this.list=document.createElement("ul"),e(this.list,{id:i,class:`${this.class}-results`,role:"listbox"}),null==(s=this.root)||s.appendChild(this.list))}async request(t){const e=t||null,s=JSON.stringify(e);if(this.cache[s])return this.cache[s];const i=`${this.engine}${e?`?q=${e}`:""}`,n=await fetch(i).then((t=>t.json()));return this.cache[s]=n,n}createResultList(s){if(this.root.classList.add("expanded"),this.input.setAttribute("aria-expanded","true"),this.input.setAttribute("aria-activedescendant",""),this.banner(s.type),s.items.length)for(let i=0;i<s.items.length;i++){const n=document.createElement("li"),l=document.createElement("a"),h=s.items[i],a=`${this.class}-item-${t(6)}`;if(e(l,{class:`${this.class}-link`,href:`${this.url}${h}`}),l.addEventListener("click",(t=>this.linkHandler(t,h)),{passive:!1}),"results"===s.type){const t=this.searchInput?this.searchInput.split(" "):[];let e=h;for(let s=0;s<t.length;s++){const i=t[s];e=e.replace(i,`<b>${i}</b>`)}l.innerHTML=e}else l.textContent=h;n.id=a,n.title=h,n.appendChild(l),this.listItems.push(n)}else{const t=document.createElement("li"),s=document.createElement("a");e(s,{class:`${this.class}-link`,href:`${this.url}${this.searchInput}`}),s.addEventListener("click",(t=>this.linkHandler(t,this.searchInput)),{passive:!1}),s.textContent=this.searchInput,t.title=this.searchInput,t.appendChild(s),this.listItems.push(t)}for(let t=0;t<this.listItems.length;t++)this.list.appendChild(this.listItems[t])}}
