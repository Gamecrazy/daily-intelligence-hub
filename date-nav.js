(function () {
  var path = location.pathname || "";
  var dailyMatch = path.match(/(\d{4}-\d{2}-\d{2})\.html$/);
  var weekMatch = path.match(/(\d{4}-W\d{2})\.html$/);
  var MODE = dailyMatch ? "daily" : weekMatch ? "weekly" : null;
  if (!MODE) return;
  var CURRENT = (dailyMatch || weekMatch)[1];

  function isoWeekFromDate(ymd) {
    var p = ymd.split("-");
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    var day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return d.getUTCFullYear() + "-W" + String(week).padStart(2, "0");
  }

  function lastDateOfWeek(weekId) {
    var m = weekId.match(/^(\d{4})-W(\d{2})$/);
    if (!m) return null;
    var y = +m[1], w = +m[2];
    var simple = new Date(Date.UTC(y, 0, 1 + (w - 1) * 7));
    var dow = simple.getUTCDay();
    var monday = new Date(simple);
    if (dow <= 4) monday.setUTCDate(simple.getUTCDate() - dow + 1);
    else monday.setUTCDate(simple.getUTCDate() + 8 - dow);
    var sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    return sunday.toISOString().slice(0, 10);
  }

  function goRel(rel) {
    if (!rel) return;
    location.href = new URL(rel, location.href).href;
  }

  function ensureCss() {
    if (document.getElementById("date-nav-css")) return;
    var style = document.createElement("style");
    style.id = "date-nav-css";
    style.textContent =
      ".issue-nav{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-left:auto}" +
      ".edition-nav{display:flex;gap:0;border:1px solid var(--line,#e4e7eb);border-radius:999px;overflow:hidden;background:#fff}" +
      ".edition-nav a{padding:7px 14px;font-size:13px;font-weight:650;color:var(--ink,#181b20);text-decoration:none}" +
      ".edition-nav a.active{background:var(--accent,#5148b8);color:#fff}" +
      ".date-nav{display:flex;gap:8px;align-items:center;flex-wrap:wrap}" +
      ".date-nav button,.date-nav select{border:1px solid var(--line,#e4e7eb);background:#fff;border-radius:999px;padding:7px 12px;font-size:13px;font-weight:650;color:var(--ink,#181b20);cursor:pointer}" +
      ".date-nav button:disabled{opacity:.4;cursor:not-allowed}" +
      ".date-nav select{min-width:10em}";
    document.head.appendChild(style);
  }

  function pickWeek(weeks, dateYmd) {
    var want = isoWeekFromDate(dateYmd);
    if (weeks.indexOf(want) >= 0) return want;
    return weeks[0] || want;
  }

  function pickDaily(dates, weekId) {
    var end = lastDateOfWeek(weekId);
    if (end && dates.indexOf(end) >= 0) return end;
    if (end) {
      for (var i = 0; i < dates.length; i++) {
        if (isoWeekFromDate(dates[i]) === weekId) return dates[i];
      }
    }
    return dates[0] || end;
  }

  function mount(dates, weeks) {
    if (document.querySelector(".issue-nav")) return;
    ensureCss();
    dates = dates && dates.length ? dates.slice() : [];
    weeks = weeks && weeks.length ? weeks.slice() : [];
    if (MODE === "daily" && dates.indexOf(CURRENT) < 0) dates = [CURRENT].concat(dates);
    if (MODE === "weekly" && weeks.indexOf(CURRENT) < 0) weeks = [CURRENT].concat(weeks);

    var latestDaily = dates[0] || CURRENT;
    var latestWeek = weeks[0] || (MODE === "weekly" ? CURRENT : isoWeekFromDate(CURRENT));
    var weeklyTarget = MODE === "daily" ? pickWeek(weeks, CURRENT) : CURRENT;
    var dailyTarget = MODE === "weekly" ? pickDaily(dates, CURRENT) : CURRENT;

    var wrap = document.createElement("div");
    wrap.className = "issue-nav";

    var edition = document.createElement("nav");
    edition.className = "edition-nav";
    edition.setAttribute("aria-label", "日报周报切换");
    edition.innerHTML =
      "<a class=\"edition-daily" + (MODE === "daily" ? " active" : "") + "\" href=\"" +
        (MODE === "daily" ? "#" : "../daily/" + dailyTarget + ".html") + "\">日报</a>" +
      "<a class=\"edition-weekly" + (MODE === "weekly" ? " active" : "") + "\" href=\"" +
        (MODE === "weekly" ? "#" : "../weekly/" + weeklyTarget + ".html") + "\">周报</a>";
    wrap.appendChild(edition);

    var items = MODE === "daily" ? dates : weeks;
    var i = items.indexOf(CURRENT);
    var prev = i >= 0 && i < items.length - 1 ? items[i + 1] : null;
    var next = i > 0 ? items[i - 1] : null;
    var nav = document.createElement("nav");
    nav.className = "date-nav";
    nav.setAttribute("aria-label", MODE === "daily" ? "日期切换" : "周次切换");
    var opts = items.map(function (d) {
      return "<option value=\"" + d + "\"" + (d === CURRENT ? " selected" : "") + ">" + d + "</option>";
    }).join("");
    nav.innerHTML =
      "<button type=\"button\" class=\"date-prev\"" + (prev ? "" : " disabled") + ">" +
        (MODE === "daily" ? "前一天" : "上一周") + "</button>" +
      "<select class=\"date-select\" aria-label=\"" + (MODE === "daily" ? "选择日期" : "选择周次") + "\">" + opts + "</select>" +
      "<button type=\"button\" class=\"date-next\"" + (next ? "" : " disabled") + ">" +
        (MODE === "daily" ? "后一天" : "下一周") + "</button>";
    wrap.appendChild(nav);

    var host = document.querySelector(".hero-top") || document.querySelector("header") || document.body;
    var win = host.querySelector && host.querySelector(".window");
    if (win) win.after(wrap);
    else host.appendChild(wrap);

    function goItem(d) {
      if (!d || d === CURRENT) return;
      location.href = d + ".html";
    }
    nav.querySelector(".date-prev").onclick = function () { goItem(prev); };
    nav.querySelector(".date-next").onclick = function () { goItem(next); };
    nav.querySelector(".date-select").onchange = function (e) { goItem(e.target.value); };

    if (MODE === "daily") {
      edition.querySelector(".edition-daily").onclick = function (e) { e.preventDefault(); };
    } else {
      edition.querySelector(".edition-weekly").onclick = function (e) { e.preventDefault(); };
    }
  }

  var datesUrl = new URL("../dates.json", location.href).href;
  var weeksUrl = new URL("../weeks.json", location.href).href;
  Promise.all([
    fetch(datesUrl).then(function (r) { return r.json(); }).catch(function () { return {}; }),
    fetch(weeksUrl).then(function (r) { return r.json(); }).catch(function () { return {}; })
  ]).then(function (pair) {
    var dates = (pair[0] && pair[0].dates) || (MODE === "daily" ? [CURRENT] : []);
    var weeks = (pair[1] && pair[1].weeks) || (MODE === "weekly" ? [CURRENT] : []);
    if (MODE === "daily" && !weeks.length) weeks = [isoWeekFromDate(CURRENT)];
    mount(dates, weeks);
  });
})();
