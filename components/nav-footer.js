/* BDA Shared Nav + Footer Component
 * Load this script on any BDA page to get the full nav and footer.
 * Automatically loads settings from CMS for dynamic content.
 * Usage: <script src="/components/nav-footer.js"></script>
 */
(function() {

var NAV_HTML = "<nav id=\"mainnav\" role=\"navigation\" aria-label=\"Main navigation\">\n  <div class=\"nav-inner\">\n    <a href=\"/\" class=\"nav-logo\" aria-label=\"Blue Door Architects \u2014 Home\">\n      <img src=\"/logo-white.png\" alt=\"Blue Door Architects\" class=\"logo-white\" width=\"300\" height=\"300\"/>\n      <img src=\"/logo-black.png\" alt=\"\" class=\"logo-black\" aria-hidden=\"true\" width=\"300\" height=\"300\"/>\n    </a>\n    </a>\n    <div class=\"nav-links\">\n      <a href=\"#projects\">Work</a>\n      <a href=\"#services\">Services</a>\n      <a href=\"#unikraft\">Unikraft</a>\n      <a href=\"#production\">Manufacturing</a>\n      <a href=\"#philosophy\">Studio</a>\n      <a href=\"#publications\">Press</a>\n      <a href=\"/insights/\" id=\"nav-insights\">Insights</a>\n      \n      <a href=\"https://www.instagram.com/bluedoor_architects/\" id=\"nav-instagram\" target=\"_blank\" rel=\"noopener\" aria-label=\"Instagram\" style=\"display:inline-flex;align-items:center;opacity:0.55;transition:opacity 0.2s;padding:4px 0\" onmouseover=\"this.style.opacity=1\" onmouseout=\"this.style.opacity=0.55\"><svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"currentColor\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z\"/></svg></a>\n      <a href=\"#contact\" class=\"nav-cta\">Begin a Project</a>\n    </div>\n    <label for=\"nav-toggle\" class=\"nav-burger\" aria-label=\"Open navigation\">\n      <span></span><span></span>\n    </label>\n  </div>\n</nav>";
var FOOTER_HTML = "<footer role=\"contentinfo\">\n  <div class=\"wrap\">\n    <div class=\"ft-inner\">\n      <div>\n        <p class=\"ft-brand-name\">Blue Door Architects</p>\n        <p class=\"ft-brand-sub\">Architecture &amp; Turnkey Design</p>\n        <p class=\"ft-palm\">A sub-brand of <a id=\"ft-palm-link\" href=\"https://www.thepalm.in/\" target=\"_blank\" rel=\"noopener\">The Palm Group</a></p>\n      </div>\n      <nav class=\"ft-nav\" aria-label=\"Footer navigation\">\n        <div class=\"ft-col\"><h5>Work</h5><ul>\n          <li><a href=\"#projects\">Residential</a></li>\n          <li><a href=\"#projects\">Commercial</a></li>\n          <li><a href=\"#projects\">Hospitality</a></li>\n          <li><a href=\"#projects\">Landscape</a></li>\n          <li><a href=\"#projects\">Mixed-Use</a></li>\n        </ul></div>\n        <div class=\"ft-col\"><h5>Studio</h5><ul>\n          <li><a href=\"#philosophy\">About</a></li>\n          <li><a href=\"#services\">Services</a></li>\n          <li></li>\n          <li><a href=\"#unikraft\">Unikraft</a></li>\n          <li><a id=\"ft-palm-link2\" href=\"https://thepalmgroup.in\" target=\"_blank\" rel=\"noopener\">The Palm Group &#8599;</a></li>\n        </ul></div>\n        <div class=\"ft-col\"><h5>Connect</h5><ul>\n          <li><a href=\"https://www.instagram.com/bluedoor_architects/\" target=\"_blank\" rel=\"noopener\">Instagram &#8599;</a></li>\n          <li><a href=\"https://in.pinterest.com/bluedoorarchitects/\" target=\"_blank\" rel=\"noopener\">Pinterest &#8599;</a></li>\n          <li><a id=\"footer-email\" href=\"mailto:info@bluedoorarchitects.com\">Email</a></li>\n          <li><a href=\"#contact\">Begin a Project</a></li>\n        </ul></div>\n      </nav>\n    </div>\n    <div class=\"ft-bottom\">\n      <p class=\"ft-copy\">&copy; 2025 Blue Door Architects. All rights reserved.</p>\n      <div class=\"ft-legal\"><button class=\"ft-legal-btn\" onclick=\"openLegalModal('privacy')\">Privacy Policy</button><button class=\"ft-legal-btn\" onclick=\"openLegalModal('terms')\">Terms</button></div>\n    </div>\n  </div>\n</footer>";
var SHARED_CSS = "\n*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}\nhtml{scroll-behavior:smooth}\n:root{\n  --ink:#0C0C0A;--ink-soft:#6B6860;--ink-muted:#A8A49E;\n  --gold:#B8965A;--gold-lt:#D4B07A;\n  --cream:#F5F2EC;--warm:#FDFCFA;\n  --border:rgba(0,0,0,0.08);\n  --serif:'Cormorant Garamond',Georgia,'Times New Roman',serif;\n  --sans:'Jost',system-ui,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;\n  --nav-h:88px;--ease:cubic-bezier(0.4,0,0.2,1);\n}\nbody{font-family:var(--sans);color:var(--ink);background:var(--warm);-webkit-font-smoothing:antialiased;overflow-x:hidden}\na{color:inherit;text-decoration:none}\nimg{max-width:100%;display:block}\n\n/* \u2500\u2500 MOBILE MENU \u2500\u2500 */\n#nav-toggle{position:fixed;opacity:0;pointer-events:none;width:0;height:0;}\n.nav-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:#0C0C0A;z-index:8000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:36px;transform:translateX(-100%);transition:transform 0.38s cubic-bezier(0.4,0,0.2,1);}\n#nav-toggle:checked ~ .nav-overlay{transform:translateX(0);}\n.nav-overlay-close{position:absolute;top:24px;right:24px;font-family:var(--sans);font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.4);cursor:pointer;padding:12px;background:none;border:none;}\n.nav-overlay-close:hover{color:white}\n.nav-overlay a{font-family:var(--serif);font-size:2.4rem;font-weight:300;color:rgba(255,255,255,0.85);letter-spacing:0.06em;transition:color 0.2s;}\n.nav-overlay a:hover,.nav-overlay a.accent{color:var(--gold)}\n.nav-burger{display:none;flex-direction:column;gap:5px;padding:8px;cursor:pointer;background:none;border:none;user-select:none;}\n.nav-burger span{display:block;height:1px;background:white;transition:background 0.4s}\n.nav-burger span:first-child{width:24px}\n.nav-burger span:last-child{width:14px}\nnav#mainnav.nav-scrolled .nav-burger span{background:var(--ink)}\n\n/* \u2500\u2500 NAV \u2500\u2500 */\nnav#mainnav{position:fixed;top:0;left:0;right:0;z-index:500;height:var(--nav-h);display:flex;align-items:center;transition:background 0.4s,border-color 0.4s;border-bottom:1px solid transparent}\nnav#mainnav.nav-scrolled{background:rgba(253,252,250,0.96);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-color:var(--border)}\n.nav-inner{display:flex;align-items:center;justify-content:space-between;width:100%;padding:0 48px}\n.nav-logo{display:flex;align-items:center}\n.logo-white{height:72px;width:auto;object-fit:contain;display:block}\n.logo-black{height:72px;width:auto;object-fit:contain;display:none}\nnav#mainnav.nav-scrolled .logo-white{display:none}\nnav#mainnav.nav-scrolled .logo-black{display:block}\n.nav-links{display:flex;align-items:center;gap:32px}\n.nav-links a{font-size:0.7rem;font-weight:300;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.8);transition:opacity 0.2s}\n.nav-links a:hover{opacity:0.5}\nnav#mainnav.nav-scrolled .nav-links a{color:var(--ink-soft)}\n.nav-cta{color:var(--gold)!important;border-bottom:1px solid var(--gold);padding-bottom:1px;opacity:1!important}\n\n/* \u2500\u2500 FOOTER \u2500\u2500 */\n.wrap{max-width:1400px;margin:0 auto;padding:0 48px}\n@media(max-width:768px){.wrap{padding:0 24px}}\nfooter{background:#080806;border-top:1px solid rgba(255,255,255,0.05);padding:56px 0 36px}\n.ft-inner{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:52px}\n.ft-brand-name{font-family:var(--serif);font-weight:300;font-size:1.05rem;letter-spacing:0.16em;text-transform:uppercase;color:rgba(245,240,230,0.88)}\n.ft-brand-sub{font-size:0.56rem;letter-spacing:0.26em;text-transform:uppercase;color:rgba(245,240,230,0.50);margin-top:4px}\n.ft-palm{font-size:0.6rem;letter-spacing:0.12em;text-transform:uppercase;color:rgba(245,240,230,0.38);margin-top:14px}\n.ft-palm a{color:rgba(184,150,90,0.4);transition:color 0.2s}.ft-palm a:hover{color:var(--gold)}\n.ft-nav{display:flex;gap:56px}\n.ft-col h5{font-size:0.54rem;letter-spacing:0.24em;text-transform:uppercase;color:#c9a96e;margin-bottom:14px}\n.ft-col ul{list-style:none;display:flex;flex-direction:column;gap:9px}\n.ft-col ul li a{font-size:0.75rem;font-weight:200;color:rgba(245,240,230,0.72);transition:color 0.2s}.ft-col ul li a:hover{color:#c9a96e}\n.ft-bottom{border-top:1px solid rgba(255,255,255,0.05);padding-top:24px;display:flex;justify-content:space-between;align-items:center}\n.ft-copy{font-size:0.65rem;font-weight:200;color:rgba(245,240,230,0.42)}\n.ft-legal{display:flex;gap:20px}\n.ft-legal a{font-size:0.6rem;font-weight:200;color:rgba(245,240,230,0.38);transition:color 0.2s}.ft-legal a:hover{color:#c9a96e}.ft-legal-btn{background:none;border:none;cursor:pointer;font-family:var(--sans);font-size:0.6rem;font-weight:200;color:rgba(245,240,230,0.38);transition:color 0.2s;padding:0}.ft-legal-btn:hover{color:#c9a96e}\n\n/* Skip link for accessibility */\n.skip-link{position:absolute;top:-40px;left:0;background:var(--gold);color:white;padding:8px 16px;font-size:0.8rem;z-index:9999;transition:top 0.2s}\n.skip-link:focus{top:0}\n\n";

// Inject CSS
var style = document.createElement('style');
style.textContent = SHARED_CSS;
document.head.appendChild(style);

// Inject nav at top of body
var navWrap = document.createElement('div');
navWrap.innerHTML = NAV_HTML;
var navEl = navWrap.firstElementChild;
document.body.insertBefore(navEl, document.body.firstChild);

// Inject footer into slot placeholder
var ftSlot = document.getElementById('footer-slot');
if (ftSlot) {
  var ftWrap = document.createElement('div');
  ftWrap.innerHTML = FOOTER_HTML;
  ftSlot.parentNode.replaceChild(ftWrap.firstElementChild, ftSlot);
} else {
  var ftWrap2 = document.createElement('div');
  ftWrap2.innerHTML = FOOTER_HTML;
  document.body.appendChild(ftWrap2.firstElementChild);
}

// Mark active nav link based on current path
var path = window.location.pathname;
var links = document.querySelectorAll('#mainnav .nav-links a, #mainnav .nav-link');
links.forEach(function(a) {
  if (a.getAttribute('href') === path || (path.startsWith('/insights') && a.id === 'nav-insights')) {
    a.style.opacity = '1';
    a.style.borderBottom = '1px solid currentColor';
  }
});

// Nav scroll behaviour
var nav = document.getElementById('mainnav');
if (nav) {
  // On non-homepage (light background), always show dark nav
  var isHomepage = window.location.pathname === '/' || window.location.pathname === '';
  if (!isHomepage) {
    nav.classList.add('nav-scrolled');
    nav.style.position = 'fixed';
  }
  window.addEventListener('scroll', function() {
    if (isHomepage) {
      nav.classList.toggle('nav-scrolled', window.scrollY > 40);
    }
  }, { passive: true });
}

// Mobile menu toggle
var toggle = document.getElementById('nav-toggle');
if (toggle && nav) {
  toggle.addEventListener('click', function() {
    nav.classList.toggle('nav-open');
  });
}

// Load CMS settings for dynamic nav/footer content
var _B = 'https://raw.githubusercontent.com/arpitsantoki-afk/BDA-Website/main/';
fetch(_B + '_data/settings.json?t=' + Date.now())
  .then(function(r) { return r.json(); })
  .then(function(d) {
    ['nav-instagram','nav-instagram-mobile'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el && d.instagram) el.href = d.instagram;
    });
    ['ft-palm-link','ft-palm-link2'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el && d.palm_group_url) el.href = d.palm_group_url;
    });
    var ftEmail = document.getElementById('ft-email');
    if (ftEmail && d.email) { ftEmail.href = 'mailto:' + d.email; ftEmail.textContent = d.email; }
    var ftPhone = document.getElementById('ft-phone');
    if (ftPhone && d.phone) { ftPhone.href = 'tel:' + d.phone.replace(/\s/g,''); ftPhone.textContent = d.phone; }
  })
  .catch(function() {});

// Hide Insights nav link if section is disabled
var _B2 = 'https://raw.githubusercontent.com/arpitsantoki-afk/BDA-Website/main/';
fetch(_B2 + '_data/insights-index.json?t=' + Date.now())
  .then(function(r){ return r.ok ? r.json() : Promise.reject(); })
  .then(function(idx){
    if(!idx.enabled){
      ['nav-insights','nav-insights-mobile'].forEach(function(id){
        var el = document.getElementById(id);
        if(el) el.style.display = 'none';
      });
    }
  })
  .catch(function(){});

})();
