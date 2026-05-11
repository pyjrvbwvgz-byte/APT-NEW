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

function fmtQty(q) {
  return q % 1 === 0 ? `${q}` : q.toFixed(1);
}

export function generateMealPlanPDF({ client, menu, shopping }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;

  // ===== COVER =====
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageW, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(38);
  doc.setTextColor(...DARK);
  doc.text("ABPT", margin, 100);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...GREEN);
  doc.text("BRUDDATRAIN · WEEKLY MEAL PREP", margin, 122);

  doc.setFontSize(28);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.text("Your week, planned.", margin, 200);

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
  doc.text(subtitle, margin, 222);

  // table of contents-ish
  doc.setTextColor(...DARK);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("What's inside", margin, 290);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  ["1.  Weekly meal plan (Mon–Sun)", "2.  Full recipes & instructions", "3.  Auto-generated shopping list"].forEach(
    (l, i) => doc.text(l, margin, 314 + i * 18)
  );

  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("apt_train.ie", margin, doc.internal.pageSize.getHeight() - 30);

  // ===== WEEKLY PLAN =====
  doc.addPage();
  drawHeader(doc, "Weekly Plan");

  const rows = DAYS.map((day) => {
    const d = menu.days[day];
    return [
      DAY_LABELS[day],
      menu.recipes?.[d.breakfast]?.name || "—",
      menu.recipes?.[d.lunch]?.name || "—",
      menu.recipes?.[d.dinner]?.name || "—",
    ];
  });

  autoTable(doc, {
    startY: 130,
    head: [["Day", "Breakfast", "Lunch", "Dinner"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 8, textColor: DARK, lineColor: [229, 239, 232] },
    headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 251, 249] },
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

    // Ingredients
    autoTable(doc, {
      startY: 170,
      head: [["Ingredient", "Qty", "Unit"]],
      body: r.ingredients.map((i) => [i.name, fmtQty(i.quantity), i.unit]),
      theme: "striped",
      styles: { fontSize: 10, cellPadding: 6, textColor: DARK, lineColor: [229, 239, 232] },
      headStyles: { fillColor: [243, 247, 244], textColor: DARK, fontStyle: "bold" },
      margin: { left: margin, right: margin },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "left", cellWidth: 60 } },
    });

    // Instructions
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
      if (y + wrapped.length * 14 > doc.internal.pageSize.getHeight() - 60) {
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

  // page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `ABPT · bruddatrain · apt_train.ie    ·    Page ${p} / ${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 24
    );
  }

  doc.save(`ABPT-MealPlan-${menu.week_start}.pdf`);
}

function drawHeader(doc, title) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageW, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...DARK);
  doc.text("ABPT", 48, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GREEN);
  doc.text("bruddatrain", 88, 50);

  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(title.toUpperCase(), pageW - 48, 50, { align: "right" });

  doc.setDrawColor(229, 239, 232);
  doc.line(48, 70, pageW - 48, 70);
}
