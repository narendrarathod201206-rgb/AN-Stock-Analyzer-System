/* ============================================================
   STOCKVISION – SCREENER.JS  (v2)
   ============================================================ */

const API = '/stock/api/';
let allStocks = [];
let sortKey = 'market_cap';
let sortDir = -1;  // -1 = desc

async function loadScreener() {
    document.getElementById('screenerLoading').style.display = 'flex';
    document.getElementById('screenerBody').innerHTML = '<tr><td colspan="11" class="table-loading">Fetching live data (may take ~30s)…</td></tr>';

    try {
        const r = await fetch(API + 'screener/');
        allStocks = await r.json();
        applyFilters();
    } catch (e) {
        showToast('Data Error', 'Error loading screener data from API.', 'error');
        document.getElementById('screenerLoading').style.display = 'none';
        document.getElementById('screenerBody').innerHTML = '<tr><td colspan="11" class="table-loading">Error loading screener data</td></tr>';
    }
}

function applyFilters() {
    document.getElementById('filterBtn').textContent = '🔍 Applying…';
    const sector = document.getElementById('fSector').value;
    const maxPE = parseFloat(document.getElementById('fPE').value) || Infinity;
    const minMcap = parseFloat(document.getElementById('fMcap').value) || 0;
    const minROE = parseFloat(document.getElementById('fROE').value) || -Infinity;
    const minChg = parseFloat(document.getElementById('fChg').value) || -Infinity;
    const maxBeta = parseFloat(document.getElementById('fBeta').value) || Infinity;

    let filtered = allStocks.filter(s => {
        if (sector && s.sector !== sector) return false;
        if (s.pe_ratio && s.pe_ratio > maxPE) return false;
        if (s.market_cap && s.market_cap / 1e7 < minMcap) return false;
        if (s.roe && s.roe * 100 < minROE) return false;
        if (s.pct_change < minChg) return false;
        if (s.beta && s.beta > maxBeta) return false;
        return true;
    });

    filtered = sortData(filtered);
    const count = document.getElementById('resultsCount');
    if (count) count.textContent = `${filtered.length} stocks found`;

    renderTable(filtered);
    document.getElementById('screenerLoading').style.display = 'none';
    document.getElementById('filterBtn').textContent = '🔍 Apply Filters';
}

function resetFilters() {
    ['fSector', 'fPE', 'fMcap', 'fROE', 'fChg', 'fBeta'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    applyFilters();
}

function sortData(data) {
    return [...data].sort((a, b) => {
        const av = a[sortKey] || 0;
        const bv = b[sortKey] || 0;
        if (typeof av === 'string') return sortDir * av.localeCompare(bv);
        return sortDir * (bv - av);
    });
}

function sortTable(key) {
    if (sortKey === key) sortDir *= -1;
    else { sortKey = key; sortDir = -1; }
    const info = document.getElementById('sortInfo');
    if (info) info.textContent = `Sorted by ${key} ${sortDir === -1 ? '▼' : '▲'}`;
    applyFilters();
}

async function addWatchlistFromScreener(sym) {
    const btn = document.getElementById('wl_' + sym);
    if (btn) { btn.textContent = '⭐ Adding…'; btn.disabled = true; }
    try {
        const r = await fetch(API + 'watchlist/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: sym }) });
        const d = await r.json();
        if (btn) { btn.textContent = d.created ? '✅ Added' : '✅ In WL'; }
        if (d.created) showToast('Success', sym + ' added to Watchlist', 'success');
    } catch (e) { 
        if (btn) btn.textContent = '❌ Error'; 
        showToast('Add Failed', 'Could not add to Watchlist.', 'error');
    }
}

function renderTable(data) {
    const tbody = document.getElementById('screenerBody');
    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="11" class="table-loading">No stocks match the current filters</td></tr>';
        return;
    }
    const fmtPct = v => v >= 0 ? '+' + v.toFixed(2) + '%' : v.toFixed(2) + '%';
    const fmtCr = v => v ? '₹' + (v / 1e7).toFixed(0) + ' Cr' : '—';
    const fmtN = v => v ? v.toFixed(2) : '—';

    tbody.innerHTML = data.map(s => {
        const pos = s.pct_change >= 0;
        return `<tr onclick="window.location='/stock/stock/${s.symbol}/'" style="cursor:pointer;">
      <td><span class="sym-badge">${s.symbol}</span></td>
      <td style="font-size:0.85rem;">${s.name}</td>
      <td><span class="sector-chip">${s.sector}</span></td>
      <td><strong>₹${(s.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
      <td class="${pos ? 'positive' : 'negative'}">${fmtPct(s.pct_change || 0)}</td>
      <td>${fmtCr(s.market_cap)}</td>
      <td>${fmtN(s.pe_ratio)}</td>
      <td>${s.roe ? (s.roe * 100).toFixed(1) + '%' : '—'}</td>
      <td>${fmtN(s.beta)}</td>
      <td class="${(s.from_52h_pct || 0) > -10 ? 'positive' : 'negative'}">${fmtN(s.from_52h_pct)}%</td>
      <td onclick="event.stopPropagation()">
        <button class="action-btn small" id="wl_${s.symbol}" onclick="addWatchlistFromScreener('${s.symbol}')">⭐ WL</button>
      </td>
    </tr>`;
    }).join('');
}

window.addEventListener('DOMContentLoaded', () => {
    startClock(); updateMarketStatus(); buildTickerFromCache();
    loadScreener();
});
