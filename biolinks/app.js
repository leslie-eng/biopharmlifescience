const currency = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0
});

const compactCurrency = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  notation: "compact",
  maximumFractionDigits: 1
});

async function getJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json();
}

function createMetricCard(metric, compact = false) {
  return `
    <article class="${compact ? "micro-card" : "metric-card"}">
      <p class="metric-label">${metric.label}</p>
      <div class="metric-value">${metric.value}</div>
      <p class="metric-foot">${metric.change}</p>
    </article>
  `;
}

function renderOrders(orders) {
  document.querySelector("#ordersTable").innerHTML = orders.map((order) => `
    <tr>
      <td><strong>${order.orderNo}</strong></td>
      <td>${order.customer}</td>
      <td><span class="status ${order.statusClass}">${order.status}</span></td>
      <td>${order.channel}</td>
      <td>${currency.format(order.total)}</td>
    </tr>
  `).join("");
}

function renderSales(sales) {
  const highestValue = Math.max(...sales.map((item) => item.revenue));
  document.querySelector("#salesChart").innerHTML = sales.map((item, index) => {
    const height = Math.max(42, Math.round((item.revenue / highestValue) * 220));
    const className = index % 3 === 0 ? "bar bar-alt" : "bar";
    return `
      <div class="bar-col">
        <div class="${className}" style="height:${height}px"></div>
        <div class="bar-label">${item.month}</div>
      </div>
    `;
  }).join("");
}

function renderClients(clients) {
  document.querySelector("#clientsList").innerHTML = clients.map((client) => `
    <article class="list-item">
      <h4>${client.name}</h4>
      <p class="list-meta">${client.segment} | ${client.orders} orders | Lifetime value ${compactCurrency.format(client.ltv)}</p>
    </article>
  `).join("");
}

function renderFinance(finance) {
  document.querySelector("#financeCards").innerHTML = finance.map((item) => createMetricCard({
    label: item.label,
    value: currency.format(item.value),
    change: item.context
  }, true)).join("");
}

function renderInventory(items) {
  document.querySelector("#inventoryList").innerHTML = items.map((item) => `
    <article class="list-item">
      <h4>${item.name}</h4>
      <p class="list-meta">SKU ${item.sku} | ${item.onHand} units on hand | Reorder point ${item.reorderPoint}</p>
      <p class="list-meta"><span class="status ${item.stockClass}">${item.stockStatus}</span></p>
    </article>
  `).join("");
}

function renderInsights(insights) {
  document.querySelector("#insightsList").innerHTML = insights.map((item) => `
    <article class="insight-item">
      <h4>${item.title}</h4>
      <p>${item.summary}</p>
    </article>
  `).join("");
}

function attachNavBehavior() {
  const links = [...document.querySelectorAll(".nav-link")];
  links.forEach((link) => {
    link.addEventListener("click", () => {
      links.forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
    });
  });
}

async function init() {
  try {
    const dashboard = await getJson("/api/dashboard");
    document.querySelector("#heroMetrics").innerHTML = dashboard.heroMetrics.map((metric) => createMetricCard(metric, true)).join("");
    document.querySelector("#metricsGrid").innerHTML = dashboard.kpis.map((metric) => createMetricCard(metric)).join("");
    renderOrders(dashboard.orders);
    renderSales(dashboard.salesSeries);
    renderClients(dashboard.clients);
    renderFinance(dashboard.financials);
    renderInventory(dashboard.inventory);
    renderInsights(dashboard.insights);
    attachNavBehavior();
  } catch (error) {
    document.querySelector("#metricsGrid").innerHTML = `
      <article class="metric-card">
        <p class="metric-label">Loading error</p>
        <div class="metric-value">API unavailable</div>
        <p class="metric-foot">${error.message}</p>
      </article>
    `;
  }
}

init();
