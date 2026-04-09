/* ============================================================
   STOCKVISION – CORE APP.JS  (API-connected, v2)
   ============================================================ */

const API_BASE = '/stock/api/';

/* ── Formatters ── */
const fmt = (n, d = 2) => (+n || 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtCurr = n => '₹' + fmt(n);
const fmtCr = n => n ? '₹' + (n / 1e7).toFixed(2) + ' Cr' : '—';

/* ── Cache for ticker (so news/settings pages don't need API) ── */
let _tickerData = [];

/* ── Footer Clock ── */
function startFooterClock() {
    const el = document.getElementById('footerTime');
    if (!el) return;
    const tick = () => {
        const now = new Date();
        el.textContent = now.getHours().toString().padStart(2, '0') + ':' + 
                         now.getMinutes().toString().padStart(2, '0') + ':' + 
                         now.getSeconds().toString().padStart(2, '0');
    };
    tick(); setInterval(tick, 1000);
}

/* ── Clock ── */
function startClock() {
    const el = document.getElementById('liveTime');
    if (!el) return;
    const tick = () => el.textContent = new Date().toLocaleTimeString('en-IN', { hour12: true });
    tick(); setInterval(tick, 1000);
}

/* ── Market Status ── */
function updateMarketStatus() {
    const dot = document.getElementById('statusDot');
    const lbl = document.getElementById('marketStatusLabel');
    if (!dot) return;
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const open = mins >= 555 && mins <= 930;
    dot.className = 'status-dot' + (open ? '' : ' closed');
    if (lbl) lbl.textContent = open ? 'Market Open' : 'Market Closed';
}

/* ── Ticker Tape ── */
async function buildTicker() {
    const tape = document.getElementById('tickerTape');
    if (!tape) return;
    const render = data => {
        if (!data || !data.length) return;
        const html = data.map(d => {
            const pos = d.pct_change >= 0;
            const sign = pos ? '+' : '';
            return `<span class="ticker-item">
        <span class="ticker-symbol">${d.symbol || d.key}</span>
        <span class="ticker-price">${fmtCurr(d.price)}</span>
        <span class="ticker-change ${pos ? 'up' : 'down'}">${sign}${fmt(d.pct_change)}%</span>
      </span>`;
        }).join('');
        tape.innerHTML = html + html; // Double for seamless loop
    };
    try {
        const r = await fetch(API_BASE + 'market/');
        const indices = await r.json();
        _tickerData = indices;
        // Then also add a few stocks
        const mr = await fetch(API_BASE + 'movers/');
        const movers = await mr.json();
        const extra = (movers.gainers || []).slice(0, 5).concat((movers.losers || []).slice(0, 3));
        _tickerData = [...indices, ...extra];
        render(_tickerData);
    } catch (e) {
        tape.innerHTML = '<span class="ticker-item"><span class="ticker-symbol">NSE</span><span class="ticker-price">Connecting…</span></span>';
    }
    // Refresh every 60s
    setInterval(async () => {
        try {
            const r = await fetch(API_BASE + 'market/');
            const d = await r.json();
            _tickerData = d; render(d);
        } catch (e) { }
    }, 60000);
}

function buildTickerFromCache() {
    const tape = document.getElementById('tickerTape');
    if (!tape || !_tickerData.length) return;
    tape.innerHTML = _tickerData.map(d => {
        const pos = d.pct_change >= 0;
        return `<span class="ticker-item"><span class="ticker-symbol">${d.symbol || d.key}</span><span class="ticker-price">${fmtCurr(d.price)}</span><span class="ticker-change ${pos ? 'up' : 'down'}">${pos ? '+' : ''}${fmt(d.pct_change)}%</span></span>`;
    }).join('');
}

/* ── Sidebar Toggle ── */
function toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open');
}

/* ── SEARCH ── */
const SEARCH_STOCKS = [
    'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'WIPRO', 'LT', 'BAJFINANCE',
    'SUNPHARMA', 'TATAMOTORS', 'MARUTI', 'ONGC', 'ADANIPORTS', 'KOTAKBANK', 'HINDUNILVR',
    'ITC', 'AXISBANK', 'SBIN', 'BHARTIARTL', 'NTPC', 'POWERGRID', 'HCLTECH', 'TECHM',
    'ULTRACEMCO', 'TITAN', 'ASIANPAINT', 'CIPLA', 'DRREDDY', 'DIVISLAB', 'BAJAJFINSV'
];

let searchSelectedIndex = -1;
function setupSearch() {
    const input = document.getElementById('searchInput');
    const dd = document.getElementById('searchDropdown');
    if (!input) return;

    input.addEventListener('input', () => {
        searchSelectedIndex = -1;
        const q = input.value.trim().toUpperCase();
        if (!q) { dd.classList.remove('show'); return; }
        const results = SEARCH_STOCKS.filter(s => s.includes(q));
        if (!results.length) { dd.classList.remove('show'); return; }
        dd.innerHTML = results.slice(0, 8).map((s, i) =>
            `<div class="search-item" id="srchItem_${i}" onclick="handleSearch('${s}')">
        <span class="sym-badge">${s}</span>
        <span style="margin-left:8px;font-size:0.82rem;color:var(--text-2);">View Detail</span>
        <span style="font-size:0.8rem;color:var(--accent)">→</span>
       </div>`
        ).join('');
        dd.classList.add('show');
    });

    input.addEventListener('keydown', (e) => {
        const items = dd.querySelectorAll('.search-item');
        if (!dd.classList.contains('show') || !items.length) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            searchSelectedIndex = (searchSelectedIndex + 1) % items.length;
            updateSearchSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            searchSelectedIndex = (searchSelectedIndex - 1 + items.length) % items.length;
            updateSearchSelection(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (searchSelectedIndex >= 0) {
                items[searchSelectedIndex].click();
            } else {
                items[0].click();
            }
        }
    });

    function updateSearchSelection(items) {
        items.forEach((item, i) => {
            if (i === searchSelectedIndex) {
                item.style.background = 'rgba(108, 99, 255, 0.2)';
            } else {
                item.style.background = '';
            }
        });
    }

    document.addEventListener('click', e => {
        if (!e.target.closest('.search-box')) dd.classList.remove('show');
    });
}

function handleSearch(sym) {
    const input = document.getElementById('searchInput');
    const dd = document.getElementById('searchDropdown');
    if (input) input.value = sym;
    if (dd) dd.classList.remove('show');
    // Navigate to stock detail
    window.location.href = '/stock/stock/' + sym + '/';
}

/* ============================================================
   DASHBOARD  HELPERS (called from dashboard.html)
   ============================================================ */

/* ── Index Cards ── */
async function buildIndexCards() {
    const container = document.getElementById('indexCards');
    if (!container) return;
    try {
        const r = await fetch(API_BASE + 'market/');
        const data = await r.json();
        container.innerHTML = data.map(d => {
            if (d.error) return ''; // Skip failed indices
            const pos = d.pct_change >= 0;
            const sign = pos ? '+' : '';
            return `<div class="index-card ${pos ? 'up' : 'down'}" onclick="window.location='/stock/analytics/?sym=${d.key}'">
        <div class="index-name">${d.name || d.key}</div>
        <div class="index-value">${fmt(d.price)}</div>
        <div class="index-change ${pos ? 'positive' : 'negative'}">${sign}${fmt(d.change)} (${sign}${fmt(d.pct_change)}%)</div>
        <canvas class="index-mini-chart" id="mini_${d.key}"></canvas>
      </div>`;
        }).join('');
        data.forEach(d => renderMiniChart('mini_' + d.key, d.pct_change >= 0));
    } catch (e) {
        container.innerHTML = '<div class="index-card"><div class="index-name">Loading…</div></div>';
    }
}

function renderMiniChart(canvasId, positive) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const data = Array.from({ length: 20 }, (_, i) => {
        const base = 100;
        return base + (positive ? 1 : -1) * (i / 20) * 8 + (Math.random() - 0.5) * 3;
    });
    new Chart(canvas, {
        type: 'line',
        data: { labels: data.map((_, i) => i), datasets: [{ data, borderColor: positive ? '#00c896' : '#ff4d6d', borderWidth: 2, pointRadius: 0, fill: true, backgroundColor: positive ? 'rgba(0,200,150,0.08)' : 'rgba(255,77,109,0.08)', tension: 0.4 }] },
        options: { responsive: true, animation: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }
    });
}

/* ── Main Chart ── */
let mainChartInstance = null;
let currentSymbol = 'RELIANCE';
let currentPeriod = '5d';
let currentInterval = '1d';

async function buildMainChart(sym, period, interval) {
    const canvas = document.getElementById('mainChart');
    if (!canvas) return;
    sym = sym || currentSymbol;
    period = period || currentPeriod;
    interval = interval || currentInterval;

    try {
        const r = await fetch(`${API_BASE}history/${sym}/?period=${period}&interval=${interval}`);
        const data = await r.json();
        const candles = data.candles || [];
        const labels = candles.map(c => c.date.slice(0, 10));
        const prices = candles.map(c => c.close);
        const sma20 = candles.map(c => c.sma20);
        const positive = prices.length > 1 && prices[prices.length - 1] >= prices[0];
        const color = positive ? '#00c896' : '#ff4d6d';

        if (mainChartInstance) mainChartInstance.destroy();
        
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        if (positive) {
            gradient.addColorStop(0, 'rgba(0, 250, 154, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 250, 154, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(255, 51, 102, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 51, 102, 0)');
        }

        mainChartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { 
                        label: 'Price', 
                        data: prices, 
                        borderColor: color, 
                        borderWidth: 3, 
                        pointRadius: 0, 
                        fill: true, 
                        backgroundColor: gradient, 
                        tension: 0.4, 
                        order: 1,
                        shadowColor: color,
                        shadowBlur: 10
                    },
                    { label: 'SMA20', data: sma20, borderColor: 'rgba(108,99,255,0.5)', borderWidth: 1.5, pointRadius: 0, fill: false, tension: 0.35, borderDash: [4, 3], order: 2 },
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top', labels: { color: '#8a97b4', boxWidth: 12 } },
                    tooltip: { mode: 'index', intersect: false, backgroundColor: '#1a2235', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, titleColor: '#8a97b4', bodyColor: '#f0f4ff', padding: 10, callbacks: { label: c => `${c.dataset.label}: ₹${c.raw?.toLocaleString('en-IN') || '—'}` } }
                },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4b5a7a', maxTicksLimit: 8 } },
                    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4b5a7a', callback: v => '₹' + v.toLocaleString('en-IN') } }
                }
            }
        });

        // Update price display
        if (prices.length) {
            const last = prices[prices.length - 1];
            const first = prices[0];
            const chg = last - first;
            const pct = first ? chg / first * 100 : 0;
            const sign = chg >= 0 ? '+' : '';
            const titleEl = document.getElementById('chartTitle');
            const priceEl = document.getElementById('chartPrice');
            const changeEl = document.getElementById('chartChange');
            if (titleEl) titleEl.textContent = sym.replace('50', ' 50').replace('NIFTY50', 'NIFTY 50') || sym;
            if (priceEl) {
                const oldVal = priceEl.textContent;
                priceEl.textContent = fmtCurr(last);
                if (oldVal && oldVal !== priceEl.textContent) {
                    flashPriceUpdate('chartPrice', chg >= 0);
                }
            }
            if (changeEl) {
                changeEl.textContent = `${sign}${fmt(chg)} (${sign}${fmt(pct)}%)`;
                changeEl.className = `chart-change ${chg >= 0 ? 'positive' : 'negative'}`;
            }
        }
    } catch (e) { showToast('Chart Error', 'Failed to load chart data', 'error'); console.error('Chart error:', e); }
}

async function changeChartSymbol() {
    const sel = document.getElementById('symbolSelect');
    currentSymbol = sel ? sel.value : currentSymbol;
    await buildMainChart(currentSymbol, currentPeriod, currentInterval);
}

function setTimeframe(period, interval, btn) {
    currentPeriod = period;
    currentInterval = interval;
    document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    buildMainChart(currentSymbol, period, interval);
}

/* ── Top Movers ── */
let moversData = { gainers: [], losers: [] };
let currentMoversType = 'gainers';

async function loadMovers() {
    try {
        const r = await fetch(API_BASE + 'movers/');
        moversData = await r.json();
        buildMovers('gainers');
    } catch (e) {
        const el = document.getElementById('moversList');
        if (el) el.innerHTML = '<p style="color:var(--text-2);padding:20px;">Could not load movers</p>';
    }
}

function buildMovers(type) {
    const list = document.getElementById('moversList');
    if (!list) return;
    const items = moversData[type] || [];
    list.innerHTML = items.map(d => {
        if (!d || d.error) return '';
        const pos = d.pct_change >= 0;
        const sign = pos ? '+' : '';
        return `<div class="mover-item" onclick="window.location='/stock/stock/${d.symbol}/'">
      <div class="mover-left">
        <div class="mover-sym-badge">${(d.symbol || '').slice(0, 3)}</div>
        <div>
          <div class="mover-symbol">${d.symbol || 'N/A'}</div>
          <div class="mover-name">${d.name || 'Stock'}</div>
        </div>
      </div>
      <div class="mover-right">
        <div class="mover-price">${fmtCurr(d.price)}</div>
        <div class="mover-change ${pos ? 'up' : 'down'}">${sign}${fmt(d.pct_change)}%</div>
      </div>
    </div>`;
    }).join('') || '<p style="color:var(--text-2);padding:20px;text-align:center;">No data</p>';
}

function showMovers(type, btn) {
    currentMoversType = type;
    document.querySelectorAll('.mover-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    buildMovers(type);
}

/* ── Volume Chart ── */
let volumeChartInst = null;
function buildVolumeChart() {
    const canvas = document.getElementById('volumeChart');
    if (!canvas) return;
    const labels = ['9:15', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30'];
    const data = [8.2, 5.1, 4.7, 6.3, 5.8, 4.2, 3.9, 4.5, 5.2, 6.8, 7.1, 8.9, 12.4];
    if (volumeChartInst) volumeChartInst.destroy();
    volumeChartInst = new Chart(canvas, {
        type: 'bar',
        data: { labels, datasets: [{ data, backgroundColor: data.map((_, i) => i === labels.length - 1 ? '#6c63ff' : 'rgba(108,99,255,0.35)'), borderRadius: 5, borderSkipped: false }] },
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a2235', titleColor: '#8a97b4', bodyColor: '#f0f4ff', callbacks: { label: c => c.raw + 'M' } } },
            scales: { x: { grid: { display: false }, ticks: { color: '#4b5a7a', font: { size: 10 } } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4b5a7a', callback: v => v + 'M' } } }
        }
    });
}

/* ── Sectors ── */
async function buildSectors() {
    const list = document.getElementById('sectorList');
    if (!list) return;
    try {
        const r = await fetch(API_BASE + 'sectors/');
        const data = await r.json();
        list.innerHTML = data.map(s => {
            const pos = s.pct_change >= 0;
            const abs = Math.abs(s.pct_change);
            const w = Math.min(abs * 28, 100);
            return `<div class="sector-item">
        <div class="sector-meta">
          <span class="sector-name">${s.sector}</span>
          <span class="sector-pct ${pos ? 'pos' : 'neg'}">${pos ? '+' : ''}${fmt(s.pct_change)}%</span>
        </div>
        <div class="sector-bar-track">
          <div class="sector-bar-fill ${pos ? '' : 'neg'}" style="width:${w}%"></div>
        </div>
      </div>`;
        }).join('');
    } catch (e) {
        list.innerHTML = '<p style="color:var(--text-2);font-size:0.85rem;padding:8px 0;">Sector data unavailable</p>';
    }
}

/* ── Market Stats ── */
function buildStats() {
    const grid = document.getElementById('statsGrid');
    if (!grid) return;
    const stats = [
        { label: 'Advances', value: '1,842', color: 'var(--green)' },
        { label: 'Declines', value: '873', color: 'var(--red)' },
        { label: 'Unchanged', value: '124', color: 'var(--text-2)' },
        { label: 'Total Vol', value: '18.4B', color: 'var(--text-1)' },
        { label: 'FII Net', value: '+₹2,841Cr', color: 'var(--green)' },
        { label: 'DII Net', value: '+₹1,204Cr', color: 'var(--green)' },
        { label: 'P/C Ratio', value: '0.84', color: 'var(--yellow)' },
        { label: 'India VIX', value: '13.42', color: 'var(--accent2)' },
    ];
    grid.innerHTML = stats.map(s => `<div class="stat-item"><div class="stat-label">${s.label}</div><div class="stat-value" style="color:${s.color}">${s.value}</div></div>`).join('');
}

/* ── Stock Table ── */
const TABLE_SYMS = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'WIPRO', 'LT', 'BAJFINANCE'];

async function buildTable() {
    const tbody = document.getElementById('stockTableBody');
    if (!tbody) return;
    const rows = await Promise.all(TABLE_SYMS.map(async sym => {
        try {
            const r = await fetch(`${API_BASE}quote/${sym}/`);
            return await r.json();
        } catch (e) { return null; }
    }));
    tbody.innerHTML = rows.filter(r => r && !r.error).map(q => {
        const pos = q.pct_change >= 0;
        const sign = pos ? '+' : '';
        return `<tr onclick="window.location='/stock/stock/${q.symbol}/'" style="cursor:pointer;">
      <td><span class="sym-badge">${q.symbol}</span></td>
      <td>${q.name || q.symbol}</td>
      <td><strong>${fmtCurr(q.price)}</strong></td>
      <td class="${pos ? 'positive' : 'negative'}">${sign}${fmt(q.change)}</td>
      <td class="${pos ? 'positive' : 'negative'}">${sign}${fmt(q.pct_change)}%</td>
      <td>${(q.volume || 0).toLocaleString('en-IN')}</td>
      <td>${fmtCr(q.market_cap)}</td>
      <td>${fmtCurr(q.week52_high)}</td>
      <td><a href="/stock/stock/${q.symbol}/" class="action-btn">View</a></td>
    </tr>`;
    }).join('') || '<tr><td colspan="9" class="table-loading">No data available</td></tr>';
}

/* ── Dashboard init ── */
async function initDashboard() {
    await buildIndexCards();
    buildMovers('gainers'); // show empty state first
    buildVolumeChart();
    buildStats();
    buildMainChart('RELIANCE', '5d', '1d');
    loadMovers();
    buildSectors();
    buildTable();
}

/* ============================================================
   TOAST NOTIFICATION SYSTEM
   ============================================================ */
function showToast(title, msg = '', type = 'info', duration = 4500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <div class="toast-body">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
      </div>
      <button class="toast-close" onclick="dismissToast(this.parentElement)">✕</button>
    `;
    container.appendChild(toast);
    if (duration > 0) {
        setTimeout(() => dismissToast(toast), duration);
    }
    return toast;
}

function dismissToast(toast) {
    if (!toast || !toast.parentElement) return;
    toast.classList.add('dismissing');
    setTimeout(() => toast.remove(), 320);
}

// Expose globally
window.showToast = showToast;
window.dismissToast = dismissToast;

/* ── UI Flash Helper ── */
function flashPriceUpdate(elId, isUp) {
    const el = document.getElementById(elId);
    if (!el) return;
    const cls = isUp ? 'flash-up' : 'flash-down';
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 1000);
}
window.flashPriceUpdate = flashPriceUpdate;

/* ── Sidebar Market Badge ── */
function updateSidebarMarketBadge() {
    const dot = document.getElementById('sbDot');
    const lbl = document.getElementById('sbMarketLabel');
    if (!dot || !lbl) return;
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const open = mins >= 555 && mins <= 930;
    dot.className = 'sb-dot' + (open ? '' : ' closed');
    lbl.textContent = open ? 'Market Open' : 'Market Closed';
}

/* ── Dark / Light Mode Toggle ── */
function toggleTheme(btn) {
    const isLight = document.body.classList.toggle('light');
    localStorage.setItem('sv-theme', isLight ? 'light' : 'dark');
    if (btn) btn.innerHTML = isLight ? '🌙 Dark Mode' : '☀️ Light Mode';
}

function applyStoredTheme() {
    const saved = localStorage.getItem('sv-theme');
    if (saved === 'light') document.body.classList.add('light');
}

/* ============================================================
   BOOT
   ============================================================ */
window.addEventListener('DOMContentLoaded', () => {
    applyStoredTheme();
    startClock();
    updateMarketStatus();
    updateSidebarMarketBadge();
    buildTicker();
    setupSearch();
    setInterval(updateMarketStatus, 30000);
    setInterval(updateSidebarMarketBadge, 30000);

    if (document.getElementById('screenerBody')) { /* screener.js  */ }
    
    startFooterClock();

    /* ── Luxury: Mouse Follower ── */
    const glow = document.getElementById('cursorGlow');
    if (glow) {
        window.addEventListener('mousemove', e => {
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';
        });
    }

    /* ── Luxury: 3D Tilt ── */
    const tiltCards = document.querySelectorAll('.card, .index-card, .movers-card');
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (centerY - y) / 10;
            const rotateY = (x - centerX) / 10;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
        });
    });

    // Initialize Dashboard if on dashboard page
    if (document.getElementById('indexCards')) {
        initDashboard();
    }
});

