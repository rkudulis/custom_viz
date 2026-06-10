(() => {
  // src/styles.js
  var styles = `
  .tv-wrap {
    font-family: inherit;
    padding: 0;
    box-sizing: border-box;
    height: 100%;
  }
  .tv-body {
    padding: 0;
    background: #fff;
  }
  .tv-error {
    color: #c0392b;
    font-size: 13px;
    padding: 12px;
  }
  .tv-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .tv-table th {
    background: #f4f4f4;
    padding: 10px 12px;
    text-align: left;
    border-bottom: 2px solid #ddd;
    font-weight: 600;
    color: #333;
  }
  .tv-table td {
    padding: 10px 12px;
    border-bottom: 1px solid #eee;
    color: #444;
  }
  .tv-table tr:hover {
    background: #f9f9f9;
  }
  .tv-delta-row {
    background: #f0f0f0;
    font-weight: 600;
  }
  .tv-delta-row:hover {
    background: #e8e8e8;
  }
  .tv-delta-positive {
    color: #27ae60;
  }
  .tv-delta-negative {
    color: #e74c3c;
  }
  .tv-table td[data-drillable="true"] {
    cursor: pointer;
    text-decoration: underline;
    text-decoration-color: #3498db;
    text-decoration-style: dotted;
  }
  .tv-table td[data-drillable="true"]:hover {
    background: #e3f2fd !important;
  }
`;

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
    row[measureTypeField] = { value: label, rendered_value: label };
    kpiFields.forEach((kpi) => {
      const factVal = factRow[kpi]?.value;
      const baseVal = baseRow[kpi]?.value;
      if (factVal != null && baseVal != null && baseVal !== 0) {
        const pctDelta = factVal / baseVal - 1;
        row[kpi] = {
          value: pctDelta,
          rendered_value: (pctDelta * 100).toFixed(1) + "%",
          is_delta: true,
          delta_sign: pctDelta >= 0 ? "positive" : "negative"
        };
      } else {
        row[kpi] = { rendered_value: "\u2014" };
      }
    });
    return row;
  }

  // src/formatValue.js
  function formatValue(value, field) {
    if (value == null || value === "") return "\u2014";
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
      const display = cell?.rendered_value || formatValue(cell?.value, field) || "\u2014";
      return `<td ${classAttr}>${display}</td>`;
    }).join("");
    return `<tr ${rowClass}>${cells}</tr>`;
  }

  // src/drillHandler.js
  function attachDrillHandlers(table, data, allFields) {
    table.querySelectorAll("tbody tr").forEach((trEl, rowIdx) => {
      if (rowIdx >= data.length) return;
      const dataRow = data[rowIdx];
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
    });
  }

  // src/index.js
  looker.plugins.visualizations.add({
    id: "test_viz",
    label: "Test Viz",
    options: {},
    create(element, config) {
      element.innerHTML = `
      <style>${styles}</style>
      <div class="tv-wrap">
        <div class="tv-body" id="tv-body"></div>
      </div>`;
    },
    update(data, element, config, queryResponse) {
      try {
        this.clearErrors();
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
        attachDrillHandlers(table, data, allFields);
      } catch (err) {
        console.error("Custom viz error:", err);
        this.addError({ title: "Visualization Error", message: err.message });
      }
    }
  });
})();
