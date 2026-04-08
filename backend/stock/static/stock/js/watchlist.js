/* ============================================================
   STOCKVISION – WATCHLIST.JS  (DB-connected, v2)
   ============================================================ */

const API = '/stock/api/';
let watchlistData = [];
let wlChartInst = null;

/* ── Load watchlist from DB ── */
async function loadWatchlist() {
    const grid = document.getElementById('watchlistGrid');
    if (!grid) return;
    try {
        const r = await fetch(API + 'watchlist/');
        watchlistData = await r.json();
        await renderWatchlist();
    } catch (e) {
        showToast('Watchlist Error', 'Could not load your watchlist.', 'error');
        grid.innerHTML = '<p style="color:var(--text-2);padding:20px;">Error loading watchlist</p>';
    }
}

async function renderWatchlist() {
    const grid = document.getElementById('watchlistGrid');
    const empty = document.getElementById('watchlistEmpty');
    if (!grid) return;

    if (!watchlistData.length) {
        grid.innerHTML = '';
        if (empty) empty.style.display = 'flex';
        return;
    }
    if (empty) empty.style.display = 'none';

    // Fetch live quotes for all watchlist symbols
    const quotes = await Promise.all(watchlistData.map(async item => {
        try {
            const r = await fetch(`${API}quote/${item.symbol}/`);
            return await r.json();
        } catch (e) { return { symbol: item.symbol, name: item.name, price: 0, pct_change: 0, change: 0 }; }
    }));

    grid.innerHTML = quotes.map((q, i) => {
        const pos = (q.pct_change || 0) >= 0;
        const sign = pos ? '+' : '';
        const id = watchlistData[i]?.id;
        return `
    <div class="watchlist-card ${pos ? 'card-up' : 'card-down'}" id="wlcard_${q.symbol}">
      <div class="wl-card-top">
        <div>
          <div class="wl-sym-badge">${q.symbol}</div>
          <div class="wl-name">${q.name || q.symbol}</div>
          <div class="wl-sector" style="font-size:0.75rem;color:var(--text-2);margin-top:2px;">${q.sector || ''}</div>
        </div>
        <button class="remove-btn" onclick="removeFromWatchlist(${id},'${q.symbol}')" title="Remove">🗑</button>
      </div>
      <div class="wl-card-bottom">
        <div class="wl-price">${fmtCurr(q.price)}</div>
        <div class="wl-change ${pos ? 'positive' : 'negative'}">${sign}${fmt(q.pct_change)}% &nbsp; ${sign}${fmt(q.change)}</div>
      </div>
      <div class="wl-card-actions">
        <button class="action-btn small" onclick="openStockDetail('${q.symbol}')">📊 Chart</button>
        <a class="action-btn small" href="/stock/stock/${q.symbol}/">View Detail</a>
      </div>
    </div>`;
    }).join('');
}

/* ── Add stock ── */
async function addToWatchlist() {
    const input = document.getElementById('addStockInput');
    const btn = document.getElementById('addWatchBtn');
    if (!input) return;
    const sym = input.value.trim().toUpperCase();
    if (!sym) { input.focus(); return; }

    btn.textContent = '+ Adding…';
    btn.disabled = true;
    try {
        const r = await fetch(API + 'watchlist/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: sym })
        });
        const d = await r.json();
        if (d.error) { alert('Error: ' + d.error); }
        else {
            input.value = '';
            await loadWatchlist();
        }
    } catch (e) {
        showToast('Add Failed', 'Could not add stock. Check symbol and try again.', 'error');
    } finally {
        btn.textContent = '+ Add Stock';
        btn.disabled = false;
    }
}

/* ── Remove stock ── */
async function removeFromWatchlist(id, sym) {
    if (!confirm(`Remove ${sym} from watchlist?`)) return;
    try {
        await fetch(`${API}watchlist/${id}/`, { method: 'DELETE' });
        const sec = document.getElementById('selectedStockSection');
        if (sec && sec.style.display !== 'none') {
            const title = document.getElementById('selectedStockTitle');
            if (title && title.textContent.includes(sym)) closeStockDetail();
        }
        await loadWatchlist();
        showToast('Success', sym + ' removed from watchlist', 'success');
    } catch (e) { showToast('Error', 'Error removing stock', 'error'); }
}

/* ── Stock detail chart ── */
async function openStockDetail(sym) {
    const sec = document.getElementById('selectedStockSection');
    if (sec) sec.style.display = 'block';

    document.getElementById('selectedStockTitle').textContent = sym;
    document.getElementById('selectedStockPrice').textContent = 'Loading…';
    document.getElementById('selectedStockChange').textContent = '';

    try {
        const [qr, hr, ar] = await Promise.all([
            fetch(`${API}quote/${sym}/`),
            fetch(`${API}history/${sym}/?period=3mo&interval=1d`),
            fetch(`${API}analysis/${sym}/`),
        ]);
        const q = await qr.json();
        const h = await hr.json();
        const a = await ar.json();

        const pos = (q.pct_change || 0) >= 0;
        const sign = pos ? '+' : '';
        document.getElementById('selectedStockPrice').textContent = fmtCurr(q.price);
        const chgEl = document.getElementById('selectedStockChange');
        chgEl.textContent = `${sign}${fmt(q.pct_change)}% (${sign}${fmt(q.change)})`;
        chgEl.className = `chart-change ${pos ? 'positive' : 'negative'}`;

        const sb = document.getElementById('selectedSignal');
        if (sb) { sb.textContent = a.signal || '—'; sb.className = 'signal-badge ' + (a.signal || 'hold').toLowerCase(); }

        // Chart
        const canvas = document.getElementById('watchlistChart');
        if (canvas) {
            const candles = h.candles || [];
            const labels = candles.map(c => c.date.slice(0, 10));
            const prices = candles.map(c => c.close);
            const color = pos ? '#00c896' : '#ff4d6d';
            if (wlChartInst) wlChartInst.destroy();
            wlChartInst = new Chart(canvas, {
                type: 'line',
                data: { labels, datasets: [{ data: prices, borderColor: color, borderWidth: 2, pointRadius: 0, fill: true, backgroundColor: pos ? 'rgba(0,200,150,0.08)' : 'rgba(255,77,109,0.08)', tension: 0.35 }] },
                options: {
                    responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, backgroundColor: '#1a2235', bodyColor: '#f0f4ff', callbacks: { label: c => '₹' + c.raw.toLocaleString('en-IN') } } },
                    scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4b5a7a', maxTicksLimit: 6 } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4b5a7a', callback: v => '₹' + v.toLocaleString('en-IN') } } }
                }
            });
        }

        // Detail grid
        const dg = document.getElementById('stockDetailGrid');
        if (dg) {
            const ind = a.indicators || {};
            dg.innerHTML = [
                ['Open', fmtCurr(q.open)], ['Day High', fmtCurr(q.high)],
                ['Day Low', fmtCurr(q.low)], ['52W High', fmtCurr(q.week52_high)],
                ['52W Low', fmtCurr(q.week52_low)], ['Volume', (q.volume || 0).toLocaleString('en-IN')],
                ['P/E Ratio', fmt(q.pe_ratio)], ['Market Cap', fmtCr(q.market_cap)],
                ['RSI', ind.rsi ? ind.rsi.toFixed(1) : '—'], ['SMA20', ind.sma20 ? '₹' + ind.sma20.toFixed(0) : '—'],
            ].map(([l, v]) => `<div class="stat-item"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');
        }

        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { console.error('Detail error:', e); }
}

function closeStockDetail() {
    const sec = document.getElementById('selectedStockSection');
    if (sec) sec.style.display = 'none';
    if (wlChartInst) { wlChartInst.destroy(); wlChartInst = null; }
}

/* Allow pressing Enter in add input */
document.addEventListener('DOMContentLoaded', () => {
    const inp = document.getElementById('addStockInput');
    if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') addToWatchlist(); });
    loadWatchlist();
    // Refresh quotes every 60s
    setInterval(renderWatchlist, 60000);
});
