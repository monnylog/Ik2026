// Utility to render a print-friendly view in a new window and trigger print (save as PDF)

interface PrintColumn {
  header: string;
  key: string;
}

interface PrintOptions {
  title: string;
  subtitle?: string;
  columns: PrintColumn[];
  rows: Record<string, string>[];
}

export function printToPDF({ title, subtitle, columns, rows }: PrintOptions) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Please allow popups to export PDF.");
    return;
  }

  const headerRow = columns.map((c) => `<th>${c.header}</th>`).join("");
  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${columns.map((c) => `<td>${row[c.key] || ""}</td>`).join("")}</tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title} — Isang Kusina 2026</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #1a1a1a; padding: 2rem; }
    .print-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #D4A843; }
    .print-header h1 { font-size: 1.5rem; color: #2B4440; }
    .print-header .subtitle { font-size: 0.85rem; color: #666; margin-top: 0.25rem; }
    .print-header .logo { font-size: 1.5rem; font-weight: 700; color: #D4A843; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.8rem; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
    th { background-color: #f0ece3; font-weight: 600; color: #2B4440; }
    tr:nth-child(even) { background-color: #fafaf7; }
    .print-footer { margin-top: 2rem; padding-top: 0.75rem; border-top: 1px solid #ccc; font-size: 0.7rem; color: #888; text-align: center; }
    @media print {
      @page { margin: 1.5cm; size: letter; }
    }
  </style>
</head>
<body>
  <div class="print-header">
    <div>
      <span class="logo">IK26</span>
    </div>
    <div>
      <h1>${title}</h1>
      ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
    </div>
  </div>
  <table>
    <thead><tr>${headerRow}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="print-footer">
    Isang Kusina 2026 — isangkusina.com — Exported ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
  </div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}