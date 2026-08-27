(function () {
  var CURRENT = (location.pathname.match(/(\d{4}-\d{2}-\d{2})\.html$/) || [])[1];
  if (!CURRENT) return;
  var jsonUrl = new URL("../dates.json", location.href).href;

  function go(d) {
    if (!d || d === CURRENT) return;
    location.href = d + ".html";
  }

  function mount(dates) {
    if (document.querySelector(".date-nav")) return;
    if (CURRENT && dates.indexOf(CURRENT) < 0) dates = [CURRENT].concat(dates);
    var i = dates.indexOf(CURRENT);
    var prev = i >= 0 && i < dates.length - 1 ? dates[i + 1] : null;
    var next = i > 0 ? dates[i - 1] : null;
    var nav = document.createElement("nav");
    nav.className = "date-nav";
    nav.setAttribute("aria-label", "日期切换");
    var opts = dates.map(function (d) {
      return "<option value=\"" + d + "\"" + (d === CURRENT ? " selected" : "") + ">" + d + "</option>";
    }).join("");
    nav.innerHTML =
      "<button type=\"button\" class=\"date-prev\"" + (prev ? "" : " disabled") + ">前一天</button>" +
      "<select class=\"date-select\" aria-label=\"选择日期\">" + opts + "</select>" +
      "<button type=\"button\" class=\"date-next\"" + (next ? "" : " disabled") + ">后一天</button>";
    if (!document.getElementById("date-nav-css")) {
      var style = document.createElement("style");
      style.id = "date-nav-css";
      style.textContent =
        ".date-nav{display:flex;gap:8px;align-items:center;flex-wrap:wrap}" +
        ".date-nav button,.date-nav select{border:1px solid var(--line,#e4e7eb);background:#fff;border-radius:999px;padding:7px 12px;font-size:13px;font-weight:650;color:var(--ink,#181b20);cursor:pointer}" +
        ".date-nav button:disabled{opacity:.4;cursor:not-allowed}" +
        ".date-nav select{min-width:10em}";
      document.head.appendChild(style);
    }
    var host = document.querySelector(".hero-top") || document.querySelector("header") || document.body;
    var win = host.querySelector && host.querySelector(".window");
    if (win) win.after(nav);
    else host.appendChild(nav);
    nav.querySelector(".date-prev").onclick = function () { go(prev); };
    nav.querySelector(".date-next").onclick = function () { go(next); };
    nav.querySelector(".date-select").onchange = function (e) { go(e.target.value); };
  }

  fetch(jsonUrl).then(function (r) { return r.json(); }).then(function (idx) {
    mount(idx.dates || [CURRENT]);
  }).catch(function () {
    mount([CURRENT]);
  });
})();
