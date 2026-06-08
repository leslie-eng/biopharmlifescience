const dashboard = {
  heroMetrics: [
    { label: "Gross sales", value: "KES 12.8M", change: "+14.2% vs last month" },
    { label: "Orders fulfilled", value: "1,284", change: "96.1% within SLA" },
    { label: "Receivables", value: "KES 2.3M", change: "18 invoices due this week" },
    { label: "Net margin", value: "24.8%", change: "+2.7 pts after cost control" }
  ],
  kpis: [
    { label: "Average order value", value: "KES 9,960", change: "+8.1% uplift" },
    { label: "Repeat customer rate", value: "38%", change: "+5.4% growth" },
    { label: "Inventory turnover", value: "6.2x", change: "Healthy stock velocity" },
    { label: "Return rate", value: "1.9%", change: "Below target threshold" }
  ],
  orders: [
    { orderNo: "BL-10482", customer: "Nairobi Medics Ltd", status: "Paid", statusClass: "paid", channel: "Wholesale", total: 248000 },
    { orderNo: "BL-10481", customer: "Afya Retail Hub", status: "Processing", statusClass: "processing", channel: "Online Store", total: 124500 },
    { orderNo: "BL-10480", customer: "MediCore Kenya", status: "Pending", statusClass: "pending", channel: "Direct Sales", total: 387200 },
    { orderNo: "BL-10479", customer: "Wellness Point", status: "Completed", statusClass: "completed", channel: "Marketplace", total: 86400 },
    { orderNo: "BL-10478", customer: "GreenCross Clinics", status: "Paid", statusClass: "paid", channel: "Online Store", total: 192100 }
  ],
  salesSeries: [
    { month: "Jan", revenue: 1100000 },
    { month: "Feb", revenue: 1380000 },
    { month: "Mar", revenue: 1490000 },
    { month: "Apr", revenue: 1710000 },
    { month: "May", revenue: 1830000 },
    { month: "Jun", revenue: 2080000 }
  ],
  clients: [
    { name: "Nairobi Medics Ltd", segment: "Enterprise B2B", orders: 128, ltv: 6840000 },
    { name: "Afya Retail Hub", segment: "Retail Chain", orders: 73, ltv: 3540000 },
    { name: "MediCore Kenya", segment: "Distributor", orders: 64, ltv: 3120000 },
    { name: "GreenCross Clinics", segment: "Clinical Network", orders: 48, ltv: 2210000 }
  ],
  financials: [
    { label: "Cash balance", value: 4180000, context: "Treasury accounts available" },
    { label: "Accounts receivable", value: 2310000, context: "Outstanding customer invoices" },
    { label: "Accounts payable", value: 1280000, context: "Supplier obligations due" },
    { label: "Operating expenses", value: 970000, context: "Current month spend" }
  ],
  inventory: [
    { name: "Rapid Diagnostic Kit", sku: "RDK-2201", onHand: 420, reorderPoint: 250, stockStatus: "In Stock", stockClass: "in-stock" },
    { name: "Cold Chain Box", sku: "CCB-1189", onHand: 85, reorderPoint: 100, stockStatus: "Low Stock", stockClass: "low" },
    { name: "Protective Gloves Pack", sku: "PGP-8400", onHand: 920, reorderPoint: 450, stockStatus: "In Stock", stockClass: "in-stock" },
    { name: "Lab Sample Tubes", sku: "LST-4430", onHand: 74, reorderPoint: 120, stockStatus: "Low Stock", stockClass: "low" }
  ],
  insights: [
    {
      title: "Online store revenue is growing faster than wholesale",
      summary: "Digital orders contributed 42% of total sales this month, with stronger average order value from repeat buyers."
    },
    {
      title: "Receivables concentration risk is emerging in three enterprise accounts",
      summary: "Top three customers hold 57% of outstanding invoice value, suggesting a need for tighter credit monitoring."
    },
    {
      title: "Margin expansion is tied to lower fulfillment leakage",
      summary: "Improved pick-pack accuracy and fewer returns contributed to a 2.7-point improvement in net margin."
    },
    {
      title: "Inventory restock should prioritize cold-chain products",
      summary: "Two temperature-sensitive SKUs have dipped below reorder points and could constrain new hospital orders."
    }
  ]
};

module.exports = { dashboard };
