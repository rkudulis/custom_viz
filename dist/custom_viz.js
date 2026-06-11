(() => {
  // src/styles.js
  var DENSITY_PADDING = {
    compact: "5px 8px",
    default: "10px 12px",
    comfortable: "15px 16px"
  };
  function buildStyles(config = {}) {
    const cellAlign = config.cell_alignment || "left";
    const headerAlign = config.header_alignment || "left";
    const fontSize = config.font_size || "13px";
    const padding = DENSITY_PADDING[config.row_density] || DENSITY_PADDING.default;
    const headerBg = config.header_background || "#f4f4f4";
    const zebraRule = config.zebra_striping ? `.tv-table tbody tr:nth-child(even) { background: #f7f7f7; }` : "";
    return `
    .tv-wrap { font-family: inherit; padding: 0; box-sizing: border-box; height: 100%; }
    .tv-body { padding: 0; background: #fff; }
    .tv-error { color: #c0392b; font-size: 13px; padding: 12px; }
    .tv-table { width: 100%; border-collapse: collapse; font-size: ${fontSize}; }
    .tv-table th {
      background: ${headerBg};
      padding: ${padding};
      text-align: ${headerAlign};
      border-bottom: 2px solid #ddd;
      font-weight: 600;
      color: #333;
    }
    .tv-table td {
      padding: ${padding};
      border-bottom: 1px solid #eee;
      color: #444;
      text-align: ${cellAlign};
    }
    .tv-table tr:hover { background: #f9f9f9; }
    ${zebraRule}
    .tv-delta-row { background: #f0f0f0; font-weight: 600; }
    .tv-delta-row:hover { background: #e8e8e8; }
    .tv-delta-positive { background: #d5f5e3; color: #1e8449; font-weight: 600; }
    .tv-delta-negative { background: #fadbd8; color: #c0392b; font-weight: 600; }
    .tv-table td[data-drillable="true"] {
      cursor: pointer;
      text-decoration: underline;
      text-decoration-color: #3498db;
      text-decoration-style: dotted;
    }
    .tv-table td[data-drillable="true"]:hover { background: #e3f2fd !important; }
  `;
  }

  // src/deltaRows.js
  function buildDeltaRows(data, measureTypeField, kpiFields) {
    const rowsByType = {};
    data.forEach((row) => {
      const type = row[measureTypeField]?.value;
      if (type) rowsByType[type] = row;
    });
    const deltaRows = [];
    if (rowsByType["Fact"] && rowsByType["Plan"]) {
      deltaRows.push(makeDeltaRow(rowsByType["Fact"], rowsByType["Plan"], "Fact vs Plan", measureTypeField, kpiFields));
    }
    if (rowsByType["Fact"] && rowsByType["Past Year"]) {
      deltaRows.push(makeDeltaRow(rowsByType["Fact"], rowsByType["Past Year"], "Fact vs PY", measureTypeField, kpiFields));
    }
    return deltaRows;
  }
  function makeDeltaRow(factRow, baseRow, label, measureTypeField, kpiFields) {
    const row = { ...factRow };
    row[measureTypeField] = { value: label, rendered: label };
    kpiFields.forEach((kpi) => {
      const factVal = factRow[kpi]?.value;
      const baseVal = baseRow[kpi]?.value;
      if (factVal != null && baseVal != null && baseVal !== 0) {
        const pctDelta = factVal / baseVal - 1;
        row[kpi] = {
          value: pctDelta,
          rendered: (pctDelta * 100).toFixed(1) + "%",
          is_delta: true,
          delta_sign: pctDelta >= 0 ? "positive" : "negative"
        };
      } else {
        row[kpi] = { rendered: "\u2014" };
      }
    });
    return row;
  }

  // src/formatValue.js
  function formatValue(value, field) {
    if (value == null || value === "" || value === 0) return "\u2014";
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return value;
    const fmt = field.value_format_name;
    const raw = field.value_format;
    if (fmt === "percent_2" || raw === "0.00%") return (numVal * 100).toFixed(2) + "%";
    if (fmt === "percent_1") return (numVal * 100).toFixed(1) + "%";
    if (fmt === "percent_0") return (numVal * 100).toFixed(0) + "%";
    if (fmt === "decimal_0") return Math.round(numVal).toLocaleString();
    if (fmt === "decimal_1") return numVal.toLocaleString(void 0, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (fmt === "decimal_2") return numVal.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (raw === "#,##0") return Math.round(numVal).toLocaleString();
    if (raw === "#,##0.00") return numVal.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (raw === "0.00") return numVal.toFixed(2);
    return value;
  }

  // src/render.js
  function buildTableHTML(data, deltaRows, allFields, kpiFields, headerRow) {
    const bodyRows = data.map((row) => renderRow(row, allFields, kpiFields)).join("");
    const footRows = deltaRows.map((row) => renderRow(row, allFields, kpiFields)).join("");
    return `
    <table class="tv-table" id="tv-data-table">
      <thead><tr>${headerRow}</tr></thead>
      <tbody>${bodyRows}</tbody>
      <tfoot>${footRows}</tfoot>
    </table>`;
  }
  function buildHeaderRow(allFields) {
    return allFields.map((f) => `<th>${f.label_short || f.name}</th>`).join("");
  }
  function renderRow(row, allFields, kpiFields) {
    const isDeltaRow = row[kpiFields[0]]?.is_delta;
    const rowClass = isDeltaRow ? 'class="tv-delta-row"' : "";
    const cells = allFields.map((field) => {
      const cell = row[field.name];
      const isDeltaCell = cell?.is_delta;
      const cellClass = isDeltaCell ? cell.delta_sign === "positive" ? "tv-delta-positive" : "tv-delta-negative" : "";
      const classAttr = cellClass ? `class="${cellClass}"` : "";
      const display = cell?.rendered ?? formatValue(cell?.value, field) ?? "\u2014";
      return `<td ${classAttr}>${display}</td>`;
    }).join("");
    return `<tr ${rowClass}>${cells}</tr>`;
  }

  // src/drillHandler.js
  function attachRowDrills(trEl, dataRow, allFields) {
    trEl.querySelectorAll("td").forEach((cell, cellIdx) => {
      const field = allFields[cellIdx];
      if (!field) return;
      const cellData = dataRow[field.name];
      if (cellData?.links?.length > 0) {
        cell.setAttribute("data-drillable", "true");
        cell.addEventListener("click", (e) => {
          e.stopPropagation();
          LookerCharts.Utils.openDrillMenu({
            links: cellData.links,
            event: { metaKey: e.metaKey, pageX: e.pageX, pageY: e.pageY - window.pageYOffset }
          });
        });
      }
    });
  }
  function attachDrillHandlers(table, data, allFields, measureTypeField) {
    table.querySelectorAll("tbody tr").forEach((trEl, rowIdx) => {
      if (rowIdx >= data.length) return;
      attachRowDrills(trEl, data[rowIdx], allFields);
    });
    const factRow = data.find((r) => r[measureTypeField]?.value === "Fact");
    const planRow = data.find((r) => r[measureTypeField]?.value === "Plan");
    const pyRow = data.find((r) => r[measureTypeField]?.value === "Past Year");
    table.querySelectorAll("tfoot tr").forEach((trEl, rowIdx) => {
      const label = trEl.querySelector("td")?.textContent?.trim();
      const isVsPlan = label === "Fact vs Plan";
      const baseRow = isVsPlan ? planRow : pyRow;
      trEl.querySelectorAll("td").forEach((cell, cellIdx) => {
        const field = allFields[cellIdx];
        if (!field) return;
        const factLinks = factRow?.[field.name]?.links || [];
        const baseLinks = baseRow?.[field.name]?.links || [];
        const links = [
          ...factLinks.map((l) => ({ ...l, label: `Fact \u2014 ${l.label}` })),
          ...baseLinks.map((l) => ({ ...l, label: `${isVsPlan ? "Plan" : "Past Year"} \u2014 ${l.label}` }))
        ];
        if (links.length > 0) {
          cell.setAttribute("data-drillable", "true");
          cell.addEventListener("click", (e) => {
            e.stopPropagation();
            LookerCharts.Utils.openDrillMenu({
              links,
              event: { metaKey: e.metaKey, pageX: e.pageX, pageY: e.pageY - window.pageYOffset }
            });
          });
        }
      });
    });
  }

  // src/index.js
  looker.plugins.visualizations.add({
    id: "test_viz",
    label: "Test Viz",
    options: {
      header_alignment: {
        type: "string",
        label: "Header Alignment",
        section: "Style",
        order: 1,
        display: "select",
        default: "left",
        values: [{ "Left": "left" }, { "Center": "center" }, { "Right": "right" }]
      },
      cell_alignment: {
        type: "string",
        label: "Cell Alignment",
        section: "Style",
        order: 2,
        display: "select",
        default: "left",
        values: [{ "Left": "left" }, { "Center": "center" }, { "Right": "right" }]
      },
      font_size: {
        type: "string",
        label: "Font Size",
        section: "Style",
        order: 3,
        display: "select",
        default: "13px",
        values: [{ "Small (12px)": "12px" }, { "Medium (13px)": "13px" }, { "Large (14px)": "14px" }]
      },
      row_density: {
        type: "string",
        label: "Row Density",
        section: "Style",
        order: 4,
        display: "select",
        default: "default",
        values: [{ "Compact": "compact" }, { "Default": "default" }, { "Comfortable": "comfortable" }]
      },
      header_background: {
        type: "string",
        label: "Header Background",
        section: "Style",
        order: 5,
        display: "color",
        default: "#f4f4f4"
      },
      zebra_striping: {
        type: "boolean",
        label: "Alternating Row Colors",
        section: "Style",
        order: 6,
        default: false
      }
    },
    create(element, config) {
      element.innerHTML = '<div class="tv-root"></div>';
    },
    update(data, element, config, queryResponse) {
      try {
        this.clearErrors();
        element.querySelector("#tv-styles")?.remove();
        element.querySelector(".tv-wrap")?.remove();
        element.insertAdjacentHTML(
          "beforeend",
          `<style id="tv-styles">${buildStyles(config)}</style><div class="tv-wrap"><div class="tv-body" id="tv-body"></div></div>`
        );
        const body = element.querySelector("#tv-body");
        const dimensions = queryResponse.fields.dimensions || [];
        const measures = queryResponse.fields.measures || [];
        const allFields = [...dimensions, ...measures];
        if (allFields.length === 0) {
          body.innerHTML = '<div class="tv-error">No fields found in query.</div>';
          return;
        }
        if (data.length === 0) {
          body.innerHTML = '<div class="tv-error">No data returned from query.</div>';
          return;
        }
        const measureTypeField = dimensions[0]?.name;
        const kpiFields = measures.map((m) => m.name);
        const deltaRows = buildDeltaRows(data, measureTypeField, kpiFields);
        const headerRow = buildHeaderRow(allFields);
        body.innerHTML = buildTableHTML(data, deltaRows, allFields, kpiFields, headerRow);
        const table = body.querySelector("#tv-data-table");
        attachDrillHandlers(table, data, allFields, measureTypeField);
      } catch (err) {
        console.error("Custom viz error:", err);
        this.addError({ title: "Visualization Error", message: err.message });
      }
    }
  });
})();
