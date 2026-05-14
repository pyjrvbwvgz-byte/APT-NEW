import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DAY_LABELS = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const GREEN = [16, 185, 129];
const DARK = [17, 28, 21];
const MUTED = [92, 112, 99];
const RED = [220, 38, 38];

function fmtQty(q) {
  return q % 1 === 0 ? `${q}` : q.toFixed(1);
}

export function generateMealPlanPDF({ client, menu, shopping, totals, dailyTotals }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;

  // ===== COVER =====
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageW, 8, "F");

  // Brand mark: red dot + "APT" wordmark
  doc.setFillColor(...RED);
  doc.circle(margin + 8, 95, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.setTextColor(...DARK);
  doc.text("APT", margin + 24, 105);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("ABRAHAM'S PERSONAL TRAINING  ·  bruddatrain", margin, 124);

  doc.setFontSize(30);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.text("Your week, planned.", margin, 210);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...MUTED);
  const subtitle = `Prepared for ${client?.name || "Member"}  ·  Week of ${
    menu?.week_start
      ? new Date(menu.week_start).toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "—"
  }`;
  doc.text(subtitle, margin, 232);

  // Weekly macros on cover
  if (totals) {
    const boxes = [
      { label: "WEEKLY KCAL", value: totals.kcal?.toLocaleString() || "0" },
      { label: "PROTEIN (g)", value: totals.protein?.toLocaleString() || "0" },
      { label: "CARBS (g)", value: totals.carbs?.toLocaleString() || "0" },
      { label: "FAT (g)", value: totals.fat?.toLocaleString() || "0" },
    ];
    const boxW = (pageW - margin * 2 - 24) / 4;
    boxes.forEach((b, i) => {
      const x = margin + i * (boxW + 8);
      doc.setDrawColor(229, 239, 232);
      doc.setFillColor(248, 251, 249);
      doc.roundedRect(x, 270, boxW, 70, 8, 8, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(b.label, x + 12, 290);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(...GREEN);
      doc.text(b.value, x + 12, 322);
    });
  }

  // What's inside
  doc.setTextColor(...DARK);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("What's inside", margin, 386);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  [
    "1.  Weekly meal plan (Mon–Sun) with daily kcal totals",
    "2.  Full recipes — ingredients, macros & instructions",
    "3.  Auto-generated shopping list",
  ].forEach((l, i) => doc.text(l, margin, 410 + i * 18));

  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("apttrains.com", margin, pageH - 30);

  // ===== WEEKLY PLAN =====
  doc.addPage();
  drawHeader(doc, "Weekly Plan");

  const rows = DAYS.map((day) => {
    const d = menu.days[day];
    const dt = dailyTotals?.[day] || {};
    return [
      DAY_LABELS[day],
      menu.recipes?.[d.breakfast]?.name || "—",
      menu.recipes?.[d.lunch]?.name || "—",
      menu.recipes?.[d.dinner]?.name || "—",
      dt.kcal ? `${dt.kcal.toLocaleString()}` : "—",
    ];
  });

  autoTable(doc, {
    startY: 130,
    head: [["Day", "Breakfast", "Lunch", "Dinner", "kcal"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 8, textColor: DARK, lineColor: [229, 239, 232] },
    headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 251, 249] },
    columnStyles: { 4: { halign: "right", cellWidth: 60, fontStyle: "bold", textColor: GREEN } },
    margin: { left: margin, right: margin },
  });

  // ===== RECIPES =====
  const seen = new Set();
  const recipeList = [];
  DAYS.forEach((day) => {
    ["breakfast", "lunch", "dinner"].forEach((meal) => {
      const slug = menu.days[day][meal];
      if (slug && !seen.has(slug)) {
        seen.add(slug);
        const r = menu.recipes?.[slug];
        if (r) recipeList.push(r);
      }
    });
  });

  recipeList.forEach((r) => {
    doc.addPage();
    drawHeader(doc, "Recipe");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...DARK);
    doc.text(r.name, margin, 130);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...GREEN);
    doc.text(
      `${r.category.toUpperCase()}  ·  ${r.prep_time} MIN  ·  SERVES ${r.servings}`,
      margin,
      148
    );

    // Macros bar
    if (r.macros) {
      const labels = [
        { k: "kcal", l: "kcal" },
        { k: "protein", l: "Protein (g)" },
        { k: "carbs", l: "Carbs (g)" },
        { k: "fat", l: "Fat (g)" },
      ];
      const boxW = (pageW - margin * 2 - 24) / 4;
      labels.forEach((m, i) => {
        const x = margin + i * (boxW + 8);
        doc.setDrawColor(229, 239, 232);
        doc.setFillColor(243, 247, 244);
        doc.roundedRect(x, 162, boxW, 46, 6, 6, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text(m.l.toUpperCase(), x + 10, 178);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(...DARK);
        doc.text(`${r.macros[m.k] ?? "—"}`, x + 10, 200);
      });
    }

    // Ingredients
    autoTable(doc, {
      startY: r.macros ? 224 : 170,
      head: [["Ingredient", "Qty", "Unit"]],
      body: r.ingredients.map((i) => [i.name, fmtQty(i.quantity), i.unit]),
      theme: "striped",
      styles: { fontSize: 10, cellPadding: 6, textColor: DARK, lineColor: [229, 239, 232] },
      headStyles: { fillColor: [243, 247, 244], textColor: DARK, fontStyle: "bold" },
      margin: { left: margin, right: margin },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "left", cellWidth: 60 } },
    });

    let y = doc.lastAutoTable.finalY + 28;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...DARK);
    doc.text("Instructions", margin, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    r.instructions.forEach((step, i) => {
      y += 16;
      const wrapped = doc.splitTextToSize(`${i + 1}. ${step}`, pageW - margin * 2);
      if (y + wrapped.length * 14 > pageH - 60) {
        doc.addPage();
        drawHeader(doc, `Recipe · ${r.name}`);
        y = 130;
      }
      doc.text(wrapped, margin, y);
      y += (wrapped.length - 1) * 14;
    });
  });

  // ===== SHOPPING LIST =====
  doc.addPage();
  drawHeader(doc, "Shopping List");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...DARK);
  doc.text("Take this to the shop.", margin, 130);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text(
    "Auto-generated from the meals in your plan. Tick as you go.",
    margin,
    150
  );

  autoTable(doc, {
    startY: 170,
    head: [["", "Item", "Qty", "Unit"]],
    body: shopping.items.map((i) => ["☐", i.name, fmtQty(i.quantity), i.unit]),
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 7, textColor: DARK, lineColor: [229, 239, 232] },
    headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 251, 249] },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 28, halign: "center" },
      2: { halign: "right", cellWidth: 70 },
      3: { cellWidth: 70 },
    },
  });

  // Page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `APT · bruddatrain · apttrains.com    ·    Page ${p} / ${pageCount}`,
      margin,
      pageH - 24
    );
  }

  doc.save(`APT-MealPlan-${menu.week_start}.pdf`);
}

function drawHeader(doc, title) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageW, 6, "F");

  // Mini brand: red dot + APT
  doc.setFillColor(...RED);
  doc.circle(54, 46, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...DARK);
  doc.text("APT", 62, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GREEN);
  doc.text("bruddatrain", 92, 50);

  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(title.toUpperCase(), pageW - 48, 50, { align: "right" });

  doc.setDrawColor(229, 239, 232);
  doc.line(48, 70, pageW - 48, 70);
}
