  var menuToggle = document.getElementById('menuToggle');
  var mobileLinks = document.getElementById('mobileLinks');
  menuToggle.addEventListener('click', function(){
    var isOpen = mobileLinks.classList.toggle('open');
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  mobileLinks.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      mobileLinks.classList.remove('open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded','false');
    });
  });

  // Force-start the hero background video — some browsers delay/pause
  // autoplay until an explicit play() call.
  document.querySelectorAll('video[autoplay]').forEach(function(v){
    v.muted = true;
    var tryPlay = function(){ v.play().catch(function(){}); };
    if (v.readyState >= 2) tryPlay();
    else v.addEventListener('loadeddata', tryPlay, { once: true });
    ['click','touchstart','scroll'].forEach(function(evt){
      document.addEventListener(evt, tryPlay, { once: true, passive: true });
    });
  });
