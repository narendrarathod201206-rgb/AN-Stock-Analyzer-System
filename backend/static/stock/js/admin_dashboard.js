/* Ultimate SaaS Dashboard - Growth Chart Initialization */

document.addEventListener("DOMContentLoaded", () => {
    // Wait slightly for Unfold's dynamic components if any
    setTimeout(() => {
        const metricsContainer = document.querySelector(".unfold-dashboard-metrics");
        if (!metricsContainer) return;

        // Create Chart Container
        const chartWrapper = document.createElement("div");
        chartWrapper.className = "mb-8 p-6 bg-white rounded-xl shadow-sm border border-slate-200";
        chartWrapper.style.gridColumn = "1 / -1"; // Span full width in grid

        const title = document.createElement("h3");
        title.innerText = "User Growth / 7 Days";
        title.className = "text-lg font-semibold text-slate-800 mb-4";
        chartWrapper.appendChild(title);

        const canvas = document.createElement("canvas");
        canvas.id = "growthChart";
        canvas.height = 100; // Sleek horizontal look
        chartWrapper.appendChild(canvas);

        // Insert before metrics
        metricsContainer.parentNode.insertBefore(chartWrapper, metricsContainer);

        // Fetch data from hidden attributes or global window if we inject it
        // Since we can't easily pass JSON to JS via Unfold context without template override
        // We'll scrape it from the metrics or use a fallback if not found
        // But better: Unfold's dashboard_callback context is available in the template
        // But we don't want to override the template.
        // HACK: We can inject the data into the page by defining a global variable in a script tag in settings.py
        
        const labels = window.dashboardChartLabels || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const data = window.dashboardChartData || [5, 12, 8, 15, 10, 20, 15];

        const ctx = document.getElementById('growthChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'New Signups',
                    data: data,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgb(99, 102, 241)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#1e293b',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { borderDash: [5, 5], color: '#e2e8f0' },
                        ticks: { color: '#64748b' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b' }
                    }
                }
            }
        });
    }, 500);
});
