/*
 * Lightweight first-party analytics for Emily Ventura.
 * Records: page views, unique visitors, sessions, every link/button click,
 * contact actions (email / phone / Instagram), portfolio photo views,
 * scroll depth, time on page, referrer, UTM campaign, device & screen size.
 * No cookies, no personal data: visitors get a random ID stored in localStorage.
 * Visit any page with ?notrack=1 once to exclude your own browser.
 */
(function(){
  var cfg=window.SITE_CONFIG||{};
  var qs=new URLSearchParams(location.search);
  if(qs.get('notrack')==='1'){try{localStorage.setItem('ev_notrack','1')}catch(e){}}
  if(qs.get('notrack')==='0'){try{localStorage.removeItem('ev_notrack')}catch(e){}}
  var optedOut=false;try{optedOut=localStorage.getItem('ev_notrack')==='1'}catch(e){}

  function rid(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36)}
  function store(kind,key){try{var s=window[kind],v=s.getItem(key);if(!v){v=rid();s.setItem(key,v)}return v}catch(e){return rid()}}
  var visitor=store('localStorage','ev_vid');
  var newVisitor=false;try{newVisitor=!localStorage.getItem('ev_seen');localStorage.setItem('ev_seen','1')}catch(e){}
  var session=store('sessionStorage','ev_sid');

  var w=window.innerWidth;
  var device=/Mobi|Android|iPhone/i.test(navigator.userAgent)?'mobile':(w<1024&&'ontouchstart' in window?'tablet':'desktop');
  var page=location.pathname.split('/').pop()||'index.html';
  var start=Date.now(),maxScroll=0;

  function send(type,data){
    var ev={type:type,ts:new Date().toISOString(),page:page,title:document.title,visitor:visitor,session:session,
      newVisitor:newVisitor,referrer:document.referrer||'',utm_source:qs.get('utm_source')||'',utm_campaign:qs.get('utm_campaign')||'',
      device:device,screen:screen.width+'x'+screen.height,lang:navigator.language||''};
    for(var k in (data||{}))ev[k]=data[k];
    if(optedOut){console.debug('[analytics:opted-out]',ev);return}
    if(window.gtag&&type!=='pageview')window.gtag('event',type,data||{});
    if(!cfg.analyticsEndpoint){console.debug('[analytics]',ev);return}
    var body=JSON.stringify(ev);
    // text/plain keeps this a "simple" request: no CORS preflight against Apps Script
    if(navigator.sendBeacon){navigator.sendBeacon(cfg.analyticsEndpoint,new Blob([body],{type:'text/plain'}))}
    else{fetch(cfg.analyticsEndpoint,{method:'POST',mode:'no-cors',body:body,keepalive:true})}
  }
  window.EVTrack=send;

  // Optional Google Analytics 4
  if(cfg.ga4Id&&!optedOut){var g=document.createElement('script');g.async=1;g.src='https://www.googletagmanager.com/gtag/js?id='+cfg.ga4Id;document.head.appendChild(g);
    window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',cfg.ga4Id);}

  send('pageview');

  // Clicks: anything with data-track, plus every link and button
  document.addEventListener('click',function(e){
    var el=e.target.closest('[data-track],a,button');if(!el)return;
    var href=el.getAttribute('href')||'';
    var kind='click';
    if(href.indexOf('mailto:')===0)kind='contact_email';
    else if(href.indexOf('tel:')===0)kind='contact_phone';
    else if(/instagram\.com/.test(href))kind='contact_instagram';
    else if(/^https?:/.test(href)&&el.hostname!==location.hostname)kind='outbound';
    send(kind,{label:el.getAttribute('data-track')||(el.textContent||'').trim().slice(0,60),href:href});
  },true);

  // Scroll depth milestones
  var marks=[25,50,75,100],hit={};
  window.addEventListener('scroll',function(){
    var h=document.documentElement,pct=Math.round((h.scrollTop+innerHeight)/h.scrollHeight*100);
    if(pct>maxScroll)maxScroll=pct;
    marks.forEach(function(m){if(pct>=m&&!hit[m]){hit[m]=1;send('scroll',{label:m+'%'})}});
  },{passive:true});

  // Time on page, sent once when leaving
  var sent=false;
  function leave(){if(sent)return;sent=true;send('page_exit',{seconds:Math.round((Date.now()-start)/1000),scroll:Math.min(maxScroll,100)})}
  addEventListener('pagehide',leave);
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')leave()});
})();
