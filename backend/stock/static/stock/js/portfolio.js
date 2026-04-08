/* ============================================================
   STOCKVISION – PORTFOLIO.JS  (DB-connected, v2)
   ============================================================ */

const API = '/stock/api/';
let portfolioData = [];
let allocChartInst = null;
let pnlChartInst = null;

/* ── Load holdings from DB ── */
async function loadPortfolio() {
    try {
        const r = await fetch(API + 'portfolio/');
        portfolioData = await r.json();
        await renderPortfolio();
    } catch (e) {
        showToast('Portfolio Error', 'Failed to load portfolio holdings', 'error');
        const tbody = document.getElementById('holdingsBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" class="table-loading">Error loading portfolio</td></tr>';
    }
}

async function renderPortfolio() {
    const tbody = document.getElementById('holdingsBody');
    const empty = document.getElementById('portfolioEmpty');
    if (!tbody) return;

    if (!portfolioData.length) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'flex';
        updateKPIs([], []);
        return;
    }
    if (empty) empty.style.display = 'none';

    // Fetch live CMP for each holding
    const quotes = await Promise.all(portfolioData.map(async item => {
        try {
            const r = await fetch(`${API}quote/${item.symbol}/`);
            const q = await r.json();
            return { ...item, cmp: q.price || 0, sector: q.sector || 'Other' };
        } catch { return { ...item, cmp: item.avg_buy_price, sector: 'Other' }; }
    }));

    updateKPIs(quotes, portfolioData);
    buildAllocationChart(quotes);
    buildPnLChart(quotes);

    tbody.innerHTML = quotes.map(q => {
        const invested = q.quantity * q.avg_buy_price;
        const current = q.quantity * q.cmp;
        const pnl = current - invested;
        const pnlPct = invested ? (pnl / invested * 100) : 0;
        const pos = pnl >= 0;
        return `<tr>
      <td><span class="sym-badge">${q.symbol}</span></td>
      <td>${q.name || q.symbol}</td>
      <td>${q.quantity}</td>
      <td>${fmtCurr(q.avg_buy_price)}</td>
      <td><strong>${fmtCurr(q.cmp)}</strong></td>
      <td>${fmtCurr(invested)}</td>
      <td>${fmtCurr(current)}</td>
      <td class="${pos ? 'positive' : 'negative'}">${pos ? '+' : ''}${fmtCurr(pnl)}</td>
      <td class="${pos ? 'positive' : 'negative'}">${pos ? '+' : ''}${fmt(pnlPct)}%</td>
      <td>
        <a href="/stock/stock/${q.symbol}/" class="action-btn">View</a>
        <button class="danger-btn" onclick="removeHolding(${q.id},'${q.symbol}')">🗑</button>
      </td>
    </tr>`;
    }).join('');
}

function updateKPIs(quotes, holdings) {
    let invested = 0, current = 0;
    quotes.forEach(q => {
        invested += q.quantity * q.avg_buy_price;
        current += q.quantity * (q.cmp || q.avg_buy_price);
    });
    const pnl = current - invested;
    const pnlPct = invested ? pnl / invested * 100 : 0;
    const pos = pnl >= 0;

    const kpiInvested = document.getElementById('kpiInvested');
    const kpiCurrent = document.getElementById('kpiCurrent');
    const kpiPnl = document.getElementById('kpiPnl');
    const kpiPnlPct = document.getElementById('kpiPnlPct');

    if (kpiInvested) kpiInvested.textContent = fmtCurr(invested);
    if (kpiCurrent) kpiCurrent.textContent = fmtCurr(current);
    if (kpiPnl) {
        kpiPnl.textContent = (pos ? '+' : '') + fmtCurr(pnl);
        kpiPnl.className = 'kpi-value ' + (pos ? 'positive' : 'negative');
    }
    if (kpiPnlPct) {
        kpiPnlPct.textContent = (pos ? '+' : '') + fmt(pnlPct) + '%';
        kpiPnlPct.className = 'kpi-value ' + (pos ? 'positive' : 'negative');
    }
}

function buildAllocationChart(quotes) {
    const canvas = document.getElementById('allocationChart');
    const legend = document.getElementById('allocationLegend');
    if (!canvas || !quotes.length) return;

    // Group by sector
    const sectors = {};
    quotes.forEach(q => {
        const invested = q.quantity * q.avg_buy_price;
        sectors[q.sector || 'Other'] = (sectors[q.sector || 'Other'] || 0) + invested;
    });
    const labels = Object.keys(sectors);
    const values = Object.values(sectors);
    const COLORS = ['#6c63ff', '#00c896', '#ff9f43', '#ff4d6d', '#54a0ff', '#ff6b9d', '#ffa502', '#2ed573'];

    if (allocChartInst) allocChartInst.destroy();
    allocChartInst = new Chart(canvas, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: values, backgroundColor: COLORS.slice(0, labels.length), borderWidth: 2, borderColor: '#0d1421' }] },
        options: { responsive: true, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a2235', titleColor: '#f0f4ff', bodyColor: '#8a97b4', callbacks: { label: c => `${c.label}: ${fmtCurr(c.raw)}` } } } }
    });

    if (legend) {
        legend.innerHTML = labels.map((l, i) => `
      <div class="legend-item">
        <div class="legend-dot" style="background:${COLORS[i]}"></div>
        <span>${l}</span>
      </div>`).join('');
    }
}

function buildPnLChart(quotes) {
    const canvas = document.getElementById('pnlChart');
    if (!canvas || !quotes.length) return;
    const labels = quotes.map(q => q.symbol);
    const data = quotes.map(q => {
        const inv = q.quantity * q.avg_buy_price;
        const cur = q.quantity * (q.cmp || q.avg_buy_price);
        return parseFloat(((cur - inv) / inv * 100).toFixed(2));
    });
    const colors = data.map(v => v >= 0 ? 'rgba(0,200,150,0.8)' : 'rgba(255,77,109,0.8)');

    if (pnlChartInst) pnlChartInst.destroy();
    pnlChartInst = new Chart(canvas, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'P&L %', data, backgroundColor: colors, borderRadius: 6, borderSkipped: false }] },
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a2235', titleColor: '#f0f4ff', bodyColor: '#8a97b4', callbacks: { label: c => `P&L: ${c.raw >= 0 ? '+' : ''}${c.raw}%` } } },
            scales: { x: { grid: { display: false }, ticks: { color: '#4b5a7a' } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4b5a7a', callback: v => v + '%' } } }
        }
    });
}

/* ── Add Holding ── */
function openAddHolding() {
    document.getElementById('modalOverlay').classList.add('show');
    document.getElementById('addModal').classList.add('show');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    document.getElementById('addModal').classList.remove('show');
}

async function addHolding() {
    const symInput = document.getElementById('holdingSymbol');
    const qtyInput = document.getElementById('holdingQty');
    const avgInput = document.getElementById('holdingAvg');
    const btn = document.getElementById('addHoldingBtn');

    const sym = (symInput?.value || '').toUpperCase().trim();
    const qty = parseFloat(qtyInput?.value || 0);
    const avg = parseFloat(avgInput?.value || 0);

    if (!sym) { showToast('Missing Info', 'Please enter a symbol', 'warning'); return; }
    if (qty <= 0 || avg <= 0) { showToast('Invalid Input', 'Quantity and Price must be positive', 'warning'); return; }
    
    btn.textContent = 'Adding…'; btn.disabled = true;

    try {
        const r = await fetch(API + 'portfolio/', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ symbol: sym, quantity: qty, avg_buy_price: avg }) 
        });
        const d = await r.json();
        if (d.error) { 
            showToast('Add Failed', d.error, 'error'); 
        } else {
            showToast('Success', `${sym} added to portfolio`, 'success');
            closeModal();
            symInput.value = '';
            qtyInput.value = '';
            avgInput.value = '';
            await loadPortfolio();
        }
    } catch (e) { 
        showToast('System Error', 'Failed to connect to server.', 'error'); 
        console.error(e);
    } finally { 
        btn.textContent = 'Add to Portfolio'; 
        btn.disabled = false; 
    }
}

async function removeHolding(id, sym) {
    if (!confirm(`Remove ${sym} from portfolio?`)) return;
    await fetch(`${API}portfolio/${id}/`, { method: 'DELETE' });
    await loadPortfolio();
}

/* ── Load Elite Recommendations ── */
async function loadRecommendations() {
    console.log("Elite Recommendations: Initiated...");
    const grid = document.getElementById('recsGrid');
    const locked = document.getElementById('recsLocked');
    const loading = document.getElementById('recsLoading');
    if (!grid) return;

    // Reset UI & Ensure loading is visible
    if (loading) loading.style.display = 'flex';
    if (locked) locked.style.display = 'none';
    if (grid) grid.innerHTML = '';

    try {
        // Use timestamp to bypass browser cache
        const t = new Date().getTime();
        const r = await fetch(`${API}portfolio/recommendations/?t=${t}`);
        if (!r.ok) throw new Error("API Network Error: " + r.status);
        
        const d = await r.json();
        console.log("Elite Recommendations: Received", d);

        if (d.locked) {
            console.log("Elite Recommendations: LOCKED");
            if (locked) locked.style.display = 'flex';
            if (loading) loading.style.display = 'none';
            return;
        }

        if (d.recommendations && d.recommendations.length > 0) {
            grid.innerHTML = d.recommendations.map(rec => `
                <div class="rec-card" onclick="window.location='/stock/stock/${rec.symbol}/'">
                    <div class="rec-header">
                        <span class="rec-sym">${rec.symbol}</span>
                        <span class="rec-price">₹${rec.price}</span>
                    </div>
                    <div class="rec-params">
                        <div class="param-group">
                            <span class="rec-label">Target</span>
                            <span class="rec-target">₹${rec.target}</span>
                        </div>
                        <div class="param-group">
                            <span class="rec-label">Stop Loss</span>
                            <span class="rec-stop">₹${rec.stop}</span>
                        </div>
                    </div>
                    <div class="rec-reason">
                        <span>🚀</span>
                        <span>RSI ${rec.rsi} - AI Bullish Setup</span>
                    </div>
                </div>
            `).join('');
        } else {
            grid.innerHTML = '<p style="padding:20px; color:var(--text-2); grid-column:1/-1; text-align:center;">No new recommendations at the moment. Your portfolio is already well diversified!</p>';
        }
    } catch (e) {
        console.error("Elite Recommendations: ERROR", e);
        if (grid) grid.innerHTML = '<p style="padding:20px; color:var(--text-2); text-align:center;">AI Engine is warming up. Please refresh in a moment.</p>';
    } finally {
        // ALWAYS hide loading at the end
        if (loading) {
            loading.style.display = 'none';
            console.log("Elite Recommendations: Loading hidden via finally.");
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    loadPortfolio();
    loadRecommendations();
    setInterval(renderPortfolio, 60000);
});
