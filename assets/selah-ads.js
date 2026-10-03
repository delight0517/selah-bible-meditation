(() => {
  'use strict';
  const config = window.SelahAdConfig || {}; let busy=false, initialized=false, plugin;
  const safe=()=>document.visibilityState==='visible'&&!document.body.classList.contains('mobile-reading-focus')&&!document.querySelector('#meditation.active')&&!Array.from(document.querySelectorAll('[role="dialog"],.modal')).some(el=>el.getClientRects().length);
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  function reserve(){return new Promise((resolve,reject)=>{
    const open=indexedDB.open('selah-ad-frequency',1);
    open.onupgradeneeded=()=>open.result.createObjectStore('quota');open.onerror=()=>reject(open.error);
    open.onsuccess=()=>{const db=open.result,tx=db.transaction('quota','readwrite'),store=tx.objectStore('quota');let granted=false;const req=store.get('daily');
      req.onsuccess=()=>{const old=req.result,day=old?.day>today()?old.day:today(),state=old?.day===day?old:{day,count:0,lastAt:0};
        if(!Number.isInteger(state.count)||state.count<0||state.count>=3||Date.now()-state.lastAt<900000)return;
        store.put({day,count:state.count+1,lastAt:Date.now()},'daily');granted=true;};
      tx.oncomplete=()=>{db.close();resolve(granted);};tx.onerror=tx.onabort=()=>{db.close();reject(tx.error);};};
  });}
  function privacyControl(info){let b=document.getElementById('selahAdPrivacy');if(!b){b=document.createElement('button');b.id='selahAdPrivacy';b.type='button';b.className='btn secondary';
    const label=()=>{const lang=(document.documentElement.lang||navigator.language).toLowerCase();const labels={ko:'광고 개인정보 설정',ja:'広告のプライバシー設定','zh-tw':'廣告隱私設定',zh:'广告隐私设置',pt:'Privacidade dos anúncios',es:'Privacidad de anuncios',fil:'Privacy ng mga ad',en:'Ad privacy settings'};b.textContent=labels[lang]||labels[lang.split('-')[0]]||labels.en;};label();new MutationObserver(label).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    (document.querySelector('footer')||document.body).append(b);b.onclick=async()=>{try{await plugin.showPrivacyOptionsForm();}catch{}};}
    b.hidden=info.privacyOptionsRequirementStatus!=='REQUIRED';}
  async function transition(reason){
    if(!['reading-finished','meditation-finished'].includes(reason)||busy||!config.enabled||!safe())return;
    const c=window.Capacitor;if(!c?.isNativePlatform?.()||!['ios','android'].includes(c.getPlatform()))return;
    const adId=config[c.getPlatform()]?.interstitial;if(!/^ca-app-pub-\d+\/\d+$/.test(adId||''))return;busy=true;
    try{plugin||=c.registerPlugin('AdMob');if(!initialized){await plugin.initialize({initializeForTesting:config.testing===true});initialized=true;}
      let consent=await plugin.requestConsentInfo();if(consent.isConsentFormAvailable&&consent.status==='REQUIRED')consent=await plugin.showConsentForm();privacyControl(consent);
      if(!consent.canRequestAds||!safe())return;await plugin.prepareInterstitial({adId,isTesting:config.testing===true});
      // IndexedDB serializes tabs; reserve durably BEFORE presentation. Failed
      // presentation consumes a slot conservatively so restart cannot overserve.
      if(!safe()||!await reserve()||!safe())return;await plugin.showInterstitial();
    }catch{/* Offline, no-fill, storage/consent errors never block the reader. */}finally{busy=false;}
  }
  window.SelahAds=Object.freeze({transition,dailyLimit:3});
})();
