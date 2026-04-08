/* ============================================================
   STOCKVISION – ANALYTICS.JS  (v2)
   ============================================================ */

const API = '/stock/api/';
let priceChartInst = null;
let rsiChartInst = null;
let macdChartInst = null;
let volChartInst = null;

async function loadAnalytics() {
    const sym = (document.getElementById('analyticsSymbol')?.value || 'RELIANCE').toUpperCase().trim();
    const period = document.getElementById('analyticsPeriod')?.value || '3mo';

    // Show loading
    const badge = document.getElementById('signalBadge');
    if (badge) { badge.textContent = 'Analysing…'; badge.className = 'signal-badge large'; }

    try {
        const [hr, ar] = await Promise.all([
            fetch(`${API}history/${sym}/?period=${period}&interval=1d`),
            fetch(`${API}analysis/${sym}/`)
        ]);
        const histData = await hr.json();
        const analysis = await ar.json();

        const candles = histData.candles || [];
        const labels = candles.map(c => c.date.slice(0, 10));

        // ── Signal badge ──
        const sig = analysis.signal || 'HOLD';
        const score = analysis.score || 50;
        const hasSig = analysis.has_signals;
        const hasInd = analysis.has_indicators;

        if (badge) {
            if (sig === 'LOCKED') {
                badge.textContent = '🔒 ELITE ONLY';
                badge.className = 'signal-badge large locked';
            } else {
                badge.textContent = `${sig}  (${score}/100)`;
                badge.className = `signal-badge large ${sig.toLowerCase()}`;
            }
        }

        // ── Title / price row ──
        const ind = analysis.indicators || {};
        const close = analysis.close || 0;
        const titleEl = document.getElementById('analyticsTitle');
        const cmpEl = document.getElementById('analyticsCMP');
        if (titleEl) titleEl.textContent = `${sym} – Price` + (hasInd ? ' & Bollinger Bands' : '');
        if (cmpEl) cmpEl.textContent = '₹' + close.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // ── Signal summary ──
        const ss = document.getElementById('signalSummary');
        if (ss) {
            if (!hasInd) {
                ss.style.display = 'grid';
                ss.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px; font-weight: 700; color: var(--accent); cursor: pointer;" onclick="window.location=\'/stock/pricing/\'">🔒 Upgrade to Pro to unlock advanced indicators (RSI, MACD, etc.)</div>';
            } else {
                ss.style.display = 'grid';
                ss.innerHTML = `
                    <div class="signal-detail"><span class="signal-label">RSI</span><span>${ind.rsi ? ind.rsi.toFixed(1) : '—'}</span></div>
                    <div class="signal-detail"><span class="signal-label">MACD</span><span>${ind.macd ? ind.macd.toFixed(3) : '—'}</span></div>
                    <div class="signal-detail"><span class="signal-label">SMA 20</span><span>${ind.sma20 ? '₹' + ind.sma20.toFixed(2) : '—'}</span></div>
                    <div class="signal-detail"><span class="signal-label">SMA 50</span><span>${ind.sma50 ? '₹' + ind.sma50.toFixed(2) : '—'}</span></div>
                    <div class="signal-detail"><span class="signal-label">BB Upper</span><span>${ind.bb_upper ? '₹' + ind.bb_upper.toFixed(2) : '—'}</span></div>
                    <div class="signal-detail"><span class="signal-label">BB Lower</span><span>${ind.bb_lower ? '₹' + ind.bb_lower.toFixed(2) : '—'}</span></div>
                `;
            }
        }

        // ── PRICE CHART with Bollinger Bands ──
        const prices = candles.map(c => c.close);
        const positive = prices.length > 1 && prices[prices.length - 1] >= prices[0];
        const pCanvas = document.getElementById('priceChart');
        if (pCanvas) {
            if (priceChartInst) priceChartInst.destroy();
            
            const datasets = [{ label: 'Price', data: prices, borderColor: positive ? '#00c896' : '#ff4d6d', borderWidth: 2.5, pointRadius: 0, fill: false, tension: 0.35, order: 1 }];
            
            if (hasInd) {
                const bbUpper = candles.map(c => c.bb_upper);
                const bbLower = candles.map(c => c.bb_lower);
                const bbMid = candles.map(c => c.bb_mid);
                const sma20 = candles.map(c => c.sma20);
                const sma50 = candles.map(c => c.sma50);
                
                datasets.push(
                    { label: 'BB Upper', data: bbUpper, borderColor: 'rgba(108,99,255,0.4)', borderWidth: 1, pointRadius: 0, fill: '+1', backgroundColor: 'rgba(108,99,255,0.05)', tension: 0.35, borderDash: [3, 3], order: 3 },
                    { label: 'BB Lower', data: bbLower, borderColor: 'rgba(108,99,255,0.4)', borderWidth: 1, pointRadius: 0, fill: false, tension: 0.35, borderDash: [3, 3], order: 4 },
                    { label: 'BB Mid', data: bbMid, borderColor: 'rgba(108,99,255,0.6)', borderWidth: 1.5, pointRadius: 0, fill: false, tension: 0.35, borderDash: [4, 4], order: 5 },
                    { label: 'SMA20', data: sma20, borderColor: 'rgba(255,159,67,0.8)', borderWidth: 1.5, pointRadius: 0, fill: false, tension: 0.35, order: 6 },
                    { label: 'SMA50', data: sma50, borderColor: 'rgba(255,77,109,0.8)', borderWidth: 1.5, pointRadius: 0, fill: false, tension: 0.35, order: 7 }
                );
            }

            priceChartInst = new Chart(pCanvas, {
                type: 'line',
                data: { labels, datasets },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: hasInd, position: 'top', labels: { color: '#8a97b4', boxWidth: 12, font: { size: 11 } } }, tooltip: { mode: 'index', intersect: false, backgroundColor: '#1a2235', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, titleColor: '#8a97b4', bodyColor: '#f0f4ff', callbacks: { label: c => c.raw != null ? `${c.dataset.label}: ₹${c.raw.toLocaleString('en-IN')}` : null } } },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4b5a7a', maxTicksLimit: 8 } },
                        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4b5a7a', callback: v => '₹' + v.toLocaleString('en-IN') } }
                    }
                }
            });
        }

        // ── RSI & MACD Gating ──
        ['rsiChart', 'macdChart'].forEach(canvasId => {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            const parent = canvas.closest('.card');
            if (parent) {
                const existingOverlay = parent.querySelector('.lock-overlay');
                if (existingOverlay) existingOverlay.remove();
                
                if (!hasInd) {
                    canvas.style.filter = 'blur(4px)';
                    const overlay = document.createElement('div');
                    overlay.className = 'lock-overlay';
                    overlay.innerHTML = '🔒 Unlock Pro Indicators';
                    overlay.onclick = () => window.location = '/stock/pricing/';
                    parent.style.position = 'relative';
                    parent.appendChild(overlay);
                } else {
                    canvas.style.filter = 'none';
                }
            }
        });

        // ── RSI CHART ──
        if (hasInd) {
            const rsiData = candles.map(c => c.rsi);
            const rCanvas = document.getElementById('rsiChart');
            if (rCanvas) {
                if (rsiChartInst) rsiChartInst.destroy();
                rsiChartInst = new Chart(rCanvas, {
                    type: 'line',
                    data: { labels, datasets: [{ label: 'RSI', data: rsiData, borderColor: '#6c63ff', borderWidth: 2, pointRadius: 0, fill: true, backgroundColor: 'rgba(108,99,255,0.06)', tension: 0.35 }] },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                        scales: { x: { ticks: { color: '#4b5a7a', maxTicksLimit: 6 } }, y: { min: 0, max: 100 } }
                    }
                });
            }

            // ── MACD CHART ──
            const macdLine = candles.map(c => c.macd);
            const macdSig = candles.map(c => c.macd_signal);
            const macdHist = candles.map(c => c.macd_hist);
            const mCanvas = document.getElementById('macdChart');
            if (mCanvas) {
                if (macdChartInst) macdChartInst.destroy();
                macdChartInst = new Chart(mCanvas, {
                    type: 'bar',
                    data: {
                        labels, datasets: [
                            { type: 'bar', label: 'MACD Hist', data: macdHist, backgroundColor: macdHist.map(v => v >= 0 ? 'rgba(0,200,150,0.6)' : 'rgba(255,77,109,0.6)') },
                            { type: 'line', label: 'MACD', data: macdLine, borderColor: '#6c63ff', borderWidth: 2, pointRadius: 0, fill: false, tension: 0.35 },
                            { type: 'line', label: 'Signal', data: macdSig, borderColor: '#ff9f43', borderWidth: 1.5, pointRadius: 0, fill: false, tension: 0.35, borderDash: [4, 3] },
                        ]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                });
            }
        }

        // ── VOLUME CHART ──
        const volData = candles.map(c => c.volume);
        const vCanvas = document.getElementById('analyticsVolChart');
        if (vCanvas) {
            if (volChartInst) volChartInst.destroy();
            volChartInst = new Chart(vCanvas, {
                type: 'bar',
                data: { labels, datasets: [{ label: 'Volume', data: volData, backgroundColor: 'rgba(108,99,255,0.4)', borderRadius: 3 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }

    } catch (e) {
        console.error('Analytics error:', e);
        if (badge) { badge.textContent = 'Error'; badge.className = 'signal-badge large hold'; }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    startClock(); updateMarketStatus(); buildTickerFromCache();

    // Pre-fill from URL param ?sym=
    const urlSym = new URLSearchParams(window.location.search).get('sym');
    if (urlSym) {
        const inp = document.getElementById('analyticsSymbol');
        if (inp) inp.value = urlSym.toUpperCase();
    }
    loadAnalytics();

    // Enter key trigger
    const inp = document.getElementById('analyticsSymbol');
    if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') loadAnalytics(); });
});
