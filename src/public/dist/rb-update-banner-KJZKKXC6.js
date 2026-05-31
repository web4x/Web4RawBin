var d=Object.defineProperty;var l=(o,n,t)=>n in o?d(o,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):o[n]=t;var s=(o,n,t)=>l(o,typeof n!="symbol"?n+"":n,t);var r=class extends HTMLElement{constructor(){super(...arguments);s(this,"version","")}connectedCallback(){this.registerServiceWorker(),this.checkForUpdate()}registerServiceWorker(){"serviceWorker"in navigator&&(navigator.serviceWorker.register("/sw.js").then(t=>{t.addEventListener("updatefound",()=>{let e=t.installing;e&&e.addEventListener("statechange",()=>{e.state==="installed"&&navigator.serviceWorker.controller&&this.showBanner()})})}).catch(()=>{}),navigator.serviceWorker.addEventListener("controllerchange",()=>{location.reload()}))}async checkForUpdate(){try{let e=await(await fetch("/api/config")).json(),i=localStorage.getItem("rawbin-version");if(!i){localStorage.setItem("rawbin-version",e.version);return}i!==e.version&&(this.version=e.version,this.showBanner(e.version))}catch{}}showBanner(t){if(this.shadowRoot?.getElementById("banner"))return;let e=this.attachShadow?.({mode:"open"})||this.shadowRoot;if(!e)return;let i=t||this.version,c=i?`v${i} available`:"New version available";e.innerHTML=`
      <style>
        :host { display: block; position: fixed; top: 0; left: 0; right: 0; z-index: 2000; }
        .banner { background: #e74c3c; color: white; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 10px 16px; padding-top: calc(10px + env(safe-area-inset-top)); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 0.9rem; font-weight: 600; }
        button { background: white; color: #e74c3c; border: none; border-radius: 6px; padding: 6px 16px; font-size: 0.85rem; font-weight: 700; cursor: pointer; }
        button:active { opacity: 0.8; }
      </style>
      <div class="banner" id="banner">
        <span>${c}</span>
        <button id="update-now">Update Now</button>
      </div>`,e.getElementById("update-now")?.addEventListener("click",async()=>{i&&localStorage.setItem("rawbin-version",i),this.remove();let a=await navigator.serviceWorker?.getRegistration?.();a?.waiting?a.waiting.postMessage("SKIP_WAITING"):location.reload()})}};customElements.define("rb-update-banner",r);
//# sourceMappingURL=rb-update-banner-KJZKKXC6.js.map
