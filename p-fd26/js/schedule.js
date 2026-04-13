/**
 * schedule.js — Schedule loading, LIVE INFO popup, NEWS dynamic rendering
 */
(function() {
  'use strict';

  var scheduleData = [];

  // Try multiple paths for schedule.json (handles different server configs)
  var SCHEDULE_URLS = [
    '../schedule.json',       // from /p-fd26/ subdirectory
    '/schedule.json',         // absolute path from root
    'schedule.json'           // same directory fallback
  ];

  // JST today at midnight for comparison
  function todayJST() {
    var now = new Date();
    var jst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    jst.setHours(0, 0, 0, 0);
    return jst;
  }

  function parseDate(dateStr) {
    var parts = dateStr.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }

  function getUpcoming(data) {
    var today = todayJST();
    return data.filter(function(ev) {
      return parseDate(ev.date) >= today;
    });
  }

  var MONTHS_EN = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  var DAYS_EN = ['SUN.','MON.','TUE.','WED.','THU.','FRI.','SAT.'];

  function renderNews(upcoming) {
    var card = document.getElementById('newsCard');
    if (!card) return;

    if (upcoming.length === 0) {
      card.innerHTML = '<div style="text-align:center;padding:40px;font-size:16px;color:#2e5c10">現在予定はありません</div>';
      return;
    }

    var ev = upcoming[0];
    var d = parseDate(ev.date);
    var day = d.getDate();
    var month = MONTHS_EN[d.getMonth()];
    var dow = DAYS_EN[d.getDay()];
    var year = d.getFullYear();

    var dateHTML = '<p class="news-month">' + month + ' ' + year + '</p>' +
      '<div class="news-day">' + day + '</div>' +
      '<p class="news-dow">' + dow + '</p>';

    var detailHTML = '';
    if (ev.label) {
      detailHTML += '<div class="news-badge">' + escapeHTML(ev.label) + '</div>';
    }
    detailHTML += '<h3 class="news-title">' + escapeHTML(ev.band) + '</h3>';
    detailHTML += '<p class="news-info">' + escapeHTML(ev.text);
    if (ev.with) {
      detailHTML += '<br>' + escapeHTML(ev.with);
    }
    if (ev.note) {
      detailHTML += '<br>' + escapeHTML(ev.note);
    }
    detailHTML += '</p>';

    if (ev.url) {
      detailHTML += '<div style="margin-top:20px"><a href="' + escapeAttr(ev.url) + '" target="_blank" rel="noopener" class="btn-primary" style="text-decoration:none">詳細</a></div>';
    }

    document.getElementById('newsDate').innerHTML = dateHTML;
    document.getElementById('newsDetail').innerHTML = detailHTML;
  }

  function renderLiveInfo(upcoming) {
    var list = document.getElementById('liveInfoList');
    if (!list) return;

    if (upcoming.length === 0) {
      list.innerHTML = '<div class="live-info-item" style="color:#8DBA66">現在予定はありません</div>';
      return;
    }

    var html = '';
    upcoming.forEach(function(ev) {
      html += '<div class="live-info-item">';
      html += '<span class="live-info-date">' + escapeHTML(ev.date) + '</span>';
      html += escapeHTML(ev.text);
      if (ev.band) {
        html += ' ' + escapeHTML(ev.band);
      }
      html += '</div>';
    });
    list.innerHTML = html;
  }

  function escapeHTML(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // LIVE INFO popup behavior
  // PC/Mobile: click/tap to toggle, click outside to close
  function initLiveInfoPopup() {
    var btn = document.getElementById('liveInfoBtn');
    var popup = document.getElementById('liveInfoPopup');
    if (!btn || !popup) return;

    var isOpen = false;

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (isOpen) {
        popup.classList.remove('active');
        isOpen = false;
      } else {
        popup.classList.add('active');
        isOpen = true;
      }
    });

    document.addEventListener('click', function(e) {
      if (!btn.contains(e.target) && !popup.contains(e.target)) {
        popup.classList.remove('active');
        isOpen = false;
      }
    });
  }

  // Load schedule with fallback paths
  function loadSchedule() {
    tryFetch(0);
  }

  function tryFetch(index) {
    if (index >= SCHEDULE_URLS.length) {
      console.error('Failed to load schedule.json from all paths');
      return;
    }
    fetch(SCHEDULE_URLS[index])
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(data) {
        scheduleData = data;
        var upcoming = getUpcoming(data);
        renderNews(upcoming);
        renderLiveInfo(upcoming);
      })
      .catch(function(err) {
        console.warn('schedule.json not found at ' + SCHEDULE_URLS[index] + ', trying next...');
        tryFetch(index + 1);
      });
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', function() {
    loadSchedule();
    initLiveInfoPopup();
  });
})();
