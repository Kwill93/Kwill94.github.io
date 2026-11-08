(function(){
  // Header: solid after scrolling past the hero
  var header=document.querySelector('.site-header');
  if(header && !header.classList.contains('light')){
    var onScroll=function(){header.classList.toggle('solid',window.scrollY>80)};
    onScroll();window.addEventListener('scroll',onScroll,{passive:true});
  }

  // Mobile drawer
  var btn=document.querySelector('.menu-btn');
  if(btn){
    var drawer=document.createElement('div');drawer.className='drawer';drawer.setAttribute('role','dialog');
    var close=document.createElement('button');close.textContent='Close';drawer.appendChild(close);
    document.querySelectorAll('.site-header nav a').forEach(function(a){drawer.appendChild(a.cloneNode(true))});
    document.body.appendChild(drawer);
    btn.addEventListener('click',function(){drawer.classList.add('open')});
    close.addEventListener('click',function(){drawer.classList.remove('open')});
  }

  // Missing photos -> tasteful placeholder showing the file name to replace
  document.querySelectorAll('img').forEach(function(img){
    var mark=function(){var box=img.parentElement;box.classList.add('ph');box.setAttribute('data-ph',img.getAttribute('src').split('/').pop())};
    if(img.complete && img.naturalWidth===0) mark(); else img.addEventListener('error',mark);
  });

  // Reveal on scroll
  var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12}):null;
  document.querySelectorAll('.reveal').forEach(function(el){io?io.observe(el):el.classList.add('in')});

  // Portfolio filters
  var filters=document.querySelectorAll('.filters button');
  filters.forEach(function(b){b.addEventListener('click',function(){
    filters.forEach(function(x){x.setAttribute('aria-pressed','false')});b.setAttribute('aria-pressed','true');
    var f=b.dataset.filter;
    document.querySelectorAll('.gallery figure').forEach(function(fig){fig.classList.toggle('hide',f!=='all'&&fig.dataset.cat!==f)});
  })});

  // Lightbox
  var figs=[].slice.call(document.querySelectorAll('.gallery figure'));
  if(figs.length){
    var lb=document.createElement('div');lb.className='lightbox';
    lb.innerHTML='<button class="lb-close" data-track="lightbox-close">Close</button><button class="lb-prev" data-track="lightbox-prev">Prev</button><img alt=""><button class="lb-next" data-track="lightbox-next">Next</button>';
    document.body.appendChild(lb);
    var big=lb.querySelector('img'),idx=0;
    var visible=function(){return figs.filter(function(f){return !f.classList.contains('hide')})};
    var show=function(i){var v=visible();idx=(i+v.length)%v.length;var im=v[idx].querySelector('img');big.src=im.src;big.alt=im.alt;lb.classList.add('open');
      if(window.EVTrack)window.EVTrack('photo_view',{label:im.getAttribute('src').split('/').pop()})};
    figs.forEach(function(f){f.addEventListener('click',function(){show(visible().indexOf(f))})});
    lb.querySelector('.lb-close').onclick=function(){lb.classList.remove('open')};
    lb.querySelector('.lb-prev').onclick=function(){show(idx-1)};
    lb.querySelector('.lb-next').onclick=function(){show(idx+1)};
    lb.addEventListener('click',function(e){if(e.target===lb)lb.classList.remove('open')});
    document.addEventListener('keydown',function(e){if(!lb.classList.contains('open'))return;
      if(e.key==='Escape')lb.classList.remove('open');if(e.key==='ArrowLeft')show(idx-1);if(e.key==='ArrowRight')show(idx+1)});
  }
  var y=document.getElementById('year');if(y)y.textContent=new Date().getFullYear();
})();
