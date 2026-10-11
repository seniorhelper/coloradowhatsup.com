(function(){
  "use strict";
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function(s,c){ return (c||document).querySelector(s); };
  var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };

  /* ---------- header height + anchor offset ---------- */
  var hdr = $('#hdr');
  function measureHeader(){
    if(!hdr) return;
    var h = hdr.offsetHeight || 96;
    document.documentElement.style.setProperty('--hdr-h', h + 'px');
    $$('section[id], article[id]').forEach(function(el){
      el.style.scrollMarginTop = (h + 14) + 'px';
    });
  }
  measureHeader();
  window.addEventListener('load', measureHeader);
  window.addEventListener('resize', measureHeader);
  window.addEventListener('orientationchange', function(){ setTimeout(measureHeader, 220); });

  /* ---------- mobile nav ---------- */
  var burger = $('#burger'), nav = $('#nav');
  if(burger && nav){
    burger.addEventListener('click', function(){
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
      if(open){ var f = nav.querySelector('a'); if(f) f.focus(); }
    });
    nav.addEventListener('click', function(e){
      if(e.target.tagName === 'A' && nav.classList.contains('open')){
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded','false');
        document.body.style.overflow = '';
      }
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && nav.classList.contains('open')){
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded','false');
        document.body.style.overflow = '';
        burger.focus();
      }
    });
  }

  /* ---------- Colorado C contour draw ---------- */
  if(!RM){
    $$('.cA').forEach(function(ring, i){
      var r = parseFloat(ring.getAttribute('r'));
      var c = 2 * Math.PI * r;
      if(ring.animate){
        ring.animate([{strokeDashoffset:c},{strokeDashoffset:0}],
          {duration:1500, delay:120*i, easing:'cubic-bezier(.22,.9,.3,1)', fill:'backwards'});
      }
    });
    var disc = $('.cdisc');
    if(disc && disc.animate){
      disc.style.transformBox = 'fill-box';
      disc.style.transformOrigin = 'center';
      disc.animate([{opacity:0,transform:'scale(.4)'},{opacity:.94,transform:'scale(1)'}],
        {duration:900, delay:800, easing:'cubic-bezier(.2,.9,.3,1)', fill:'backwards'});
    }
  }

  /* ---------- reveal on scroll ---------- */
  var rvs = $$('.rv');
  if(!RM){
    var rvList = rvs.slice(), rvTick = false;
    function rvCheck(){ rvTick = false; var line = window.innerHeight * 0.92, atEnd = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 4;
      rvList = rvList.filter(function(el){ if(atEnd || el.getBoundingClientRect().top < line){ el.classList.add('in'); return false; } return true; });
      if(!rvList.length){ window.removeEventListener('scroll', rvOnScroll); window.removeEventListener('resize', rvOnScroll); } }
    function rvOnScroll(){ if(!rvTick){ rvTick = true; requestAnimationFrame(rvCheck); } }
    if(rvList.length){ window.addEventListener('scroll', rvOnScroll, {passive:true}); window.addEventListener('resize', rvOnScroll); rvCheck(); }
  } else { rvs.forEach(function(el){ el.classList.add('in'); }); }

  /* ---------- elevation rail ---------- */
  var railFill = $('#railFill'), railDot = $('#railDot'), railLab = $('#railLab');
  var LOW = 3315, HIGH = 14440;
  function updateRail(){
    if(!railFill) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    railFill.style.height = (p*100) + '%';
    railDot.style.top = (p*100) + '%';
    railLab.textContent = Math.round(LOW + (HIGH-LOW)*p).toLocaleString('en-US') + ' ft';
  }
  var ticking = false;
  window.addEventListener('scroll', function(){
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(function(){ updateRail(); ticking = false; });
  }, {passive:true});
  updateRail();

  /* ---------- month picker ---------- */
  var mtabs = $$('.mtab');
  var mpanels = $$('.mpanel');
  function showMonth(idx, focus){
    mtabs.forEach(function(t,i){
      t.setAttribute('aria-selected', i === idx ? 'true' : 'false');
      t.setAttribute('tabindex', i === idx ? '0' : '-1');
    });
    mpanels.forEach(function(p,i){ p.hidden = i !== idx; });
    if(focus && mtabs[idx]) mtabs[idx].focus();
  }
  mtabs.forEach(function(tab, i){
    tab.addEventListener('click', function(){ showMonth(i, false); });
    tab.addEventListener('keydown', function(e){
      var n = null;
      if(e.key === 'ArrowRight') n = (i + 1) % mtabs.length;
      else if(e.key === 'ArrowLeft') n = (i - 1 + mtabs.length) % mtabs.length;
      else if(e.key === 'Home') n = 0;
      else if(e.key === 'End') n = mtabs.length - 1;
      if(n !== null){ e.preventDefault(); showMonth(n, true); }
    });
  });
  if(mtabs.length){
    var nowIdx = new Date().getMonth();
    showMonth(nowIdx, false);
  }

  /* ---------- 8. altitude & oxygen calculator ---------- */
  var PLACES = [
    {ft:0,     n:'Sea level'},
    {ft:3315,  n:'Arikaree River'},
    {ft:4583,  n:'Grand Junction'},
    {ft:5280,  n:'Denver'},
    {ft:6035,  n:'Colorado Springs'},
    {ft:7522,  n:'Estes Park'},
    {ft:7908,  n:'Aspen'},
    {ft:8150,  n:'Vail'},
    {ft:9600,  n:'Breckenridge'},
    {ft:10152, n:'Leadville'},
    {ft:11990, n:'Loveland Pass'},
    {ft:12183, n:'Trail Ridge Road'},
    {ft:14115, n:'Pikes Peak'},
    {ft:14440, n:'Mount Elbert'}
  ];
  function nearestPlace(ft){
    var best = PLACES[0], d = Math.abs(ft - best.ft);
    for(var i=1;i<PLACES.length;i++){
      var dd = Math.abs(ft - PLACES[i].ft);
      if(dd < d){ d = dd; best = PLACES[i]; }
    }
    return best;
  }
  function pressureRatio(ft){
    if(ft <= 0) return 1;
    return Math.pow(1 - 6.87535e-6 * ft, 5.2559);
  }
  function altMessage(ft){
    if(ft < 3000)  return 'Near sea level. Full oxygen. This is the baseline your body is calibrated to if you live on a coast.';
    if(ft < 5000)  return 'Colorado\u2019s eastern plains. Most people notice nothing at all here, though the air is already noticeably drier than a coastal climate.';
    if(ft < 6500)  return 'Denver and the Front Range cities. Air delivers roughly four-fifths the oxygen of sea level. Most visitors feel this as shortness of breath on stairs for a day or two, plus faster dehydration.';
    if(ft < 8500)  return 'Mountain town elevation \u2014 Estes Park, Aspen, Vail. Sleep here on your first night and you may wake up several times. Drink more water than feels necessary and skip the celebratory drink.';
    if(ft < 10500) return 'High mountain towns and lower trailheads. Acute mountain sickness becomes common above roughly 8,000 feet. Give yourself a full day before attempting anything strenuous.';
    if(ft < 12500) return 'High passes and treeline. Exertion here is genuinely hard for unacclimated visitors. Watch for headache with nausea \u2014 that combination means descend, not push on.';
    if(ft < 14000) return 'Upper alpine. Roughly two-thirds to three-fifths the oxygen of sea level. Turn-around times matter more than fitness at this elevation, and afternoon storms build fast.';
    return 'Fourteener summit. Around 58% of sea-level pressure at the top of Mount Elbert. Be here in the morning and be heading down by noon.';
  }
  var rng = $('#altRange');
  if(rng){
    var oAlt = $('#outAlt'), oPct = $('#outPct'), oO2 = $('#outO2'),
        oMsg = $('#calcMsg'), oPlace = $('#calcPlace');
    var updateCalc = function(){
      var ft = parseInt(rng.value, 10) || 0;
      var ratio = pressureRatio(ft);
      oAlt.innerHTML = ft.toLocaleString('en-US') + '<i>ft</i>';
      oPct.innerHTML = Math.round(ratio * 100) + '<i>%</i>';
      oO2.innerHTML  = (20.9 * ratio).toFixed(1) + '<i>%</i>';
      oMsg.textContent = altMessage(ft);
      oPlace.textContent = 'Near ' + nearestPlace(ft).n;
    };
    rng.addEventListener('input', updateCalc);
    updateCalc();
  }



  var yr = $('#yr');
  if(yr) yr.textContent = new Date().getFullYear();

})();
