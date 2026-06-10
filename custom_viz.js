/**
 * testViz.js — Looker Custom Visualization (pipeline test)
 *
 * Drop this in:  your_lookml_project/visualizations/testViz.js
 * Register at:   Admin › Visualizations › Add visualization
 * URL:           https://<looker>/viz/<project>/visualizations/testViz.js
 *
 * What it does:
 *   - Shows how many rows Looker passed
 *   - Lists every field name Looker detected
 *   - Shows the raw value of the first cell of the first row
 *   - Lets you type a title via viz options
 *   - Turns the header green/red based on whether data exists
 *
 * Once this renders correctly you know:
 *   ✓ The JS file is being served from your LookML project
 *   ✓ Looker can register and load the viz
 *   ✓ The create/update lifecycle works
 *   ✓ You can read queryResponse and data correctly
 *   ✓ Viz options (config panel) work
 */

looker.plugins.visualizations.add({

  // Unique id — must not clash with any other registered viz
  id: 'test_viz',
  label: 'Test Viz',

  // ── Options (appear in the viz config panel) ──────────────────────────────
  options: {
    title: {
      type: 'string',
      label: 'Title',
      default: 'Test Visualization',
      order: 1,
    },
    header_color: {
      type: 'string',
      display: 'color',
      label: 'Header color',
      default: '#1D9E75',
      order: 2,
    },
  },

  // ── create() — runs ONCE when the tile is first mounted ───────────────────
  // Use it to build the static DOM skeleton. No data yet at this point.
  create(element, config) {
    element.innerHTML = `
      <style>
        .tv-wrap {
          font-family: inherit;
          padding: 16px;
          box-sizing: border-box;
          height: 100%;
        }
        .tv-header {
          color: #fff;
          padding: 10px 16px;
          border-radius: 8px 8px 0 0;
          font-size: 15px;
          font-weight: 600;
        }
        .tv-body {
          border: 1px solid #e0e0e0;
          border-top: none;
          border-radius: 0 0 8px 8px;
          padding: 14px 16px;
          background: #fff;
        }
        .tv-stat {
          font-size: 13px;
          color: #444;
          margin-bottom: 6px;
        }
        .tv-stat span {
          font-weight: 600;
          color: #111;
        }
        .tv-divider {
          border: none;
          border-top: 1px solid #eee;
          margin: 10px 0;
        }
        .tv-field-list {
          font-size: 12px;
          color: #666;
          line-height: 1.8;
        }
        .tv-field {
          display: inline-block;
          background: #f4f4f4;
          border-radius: 4px;
          padding: 1px 7px;
          margin: 2px 3px 2px 0;
          font-family: monospace;
          font-size: 11px;
          color: #333;
        }
        .tv-first-value {
          margin-top: 10px;
          font-size: 12px;
          color: #666;
        }
        .tv-first-value code {
          font-family: monospace;
          font-size: 12px;
          background: #f4f4f4;
          padding: 2px 6px;
          border-radius: 4px;
          color: #333;
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
      </style>
      <div class="tv-wrap">
        <div class="tv-header" id="tv-header">Loading…</div>
        <div class="tv-body" id="tv-body"></div>
      </div>`;
  },

  // ── Formatter helper ────────────────────────────────────────────────────────
  formatValue(value, field) {
    if (value == null || value === '') return '—';

    const numVal = parseFloat(value);
    if (isNaN(numVal)) return value;

    // Check for percent format
    if (field.value_format_name === 'percent_2' || field.value_format === '0.00%') {
      return (numVal * 100).toFixed(2) + '%';
    }
    if (field.value_format_name === 'percent_1') {
      return (numVal * 100).toFixed(1) + '%';
    }
    if (field.value_format_name === 'percent_0') {
      return (numVal * 100).toFixed(0) + '%';
    }

    // Check for number format
    if (field.value_format === '#,##0') {
      return numVal.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    if (field.value_format === '#,##0.00') {
      return numVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (field.value_format === '0.00') {
      return numVal.toFixed(2);
    }

    return value;
  },

  // ── update() — runs every time data or config changes ─────────────────────
  // This is where all your rendering logic lives.
  update(data, element, config, queryResponse) {

    try {
      // Always clear errors from previous renders first
      this.clearErrors();

      const that = this;
      const header = element.querySelector('#tv-header');
      const body   = element.querySelector('#tv-body');

      // ── Read config options ──────────────────────────────────────────────────
      const title       = config.title || 'Test Visualization';
      const headerColor = config.header_color || '#1D9E75';

      // ── Apply header ─────────────────────────────────────────────────────────
      header.textContent    = title;
      header.style.background = headerColor;

      // ── Read fields from queryResponse ───────────────────────────────────────
      const dimensions = queryResponse.fields.dimensions || [];
      const measures   = queryResponse.fields.measures   || [];
      const allFields  = [...dimensions, ...measures];

      if (allFields.length === 0) {
        body.innerHTML = '<div class="tv-error">No fields found in query. Add at least one dimension or measure.</div>';
        return;
      }

      if (data.length === 0) {
        body.innerHTML = '<div class="tv-error">No data returned from query.</div>';
        return;
      }

      // ── Extract measure_type field (first dimension) ──────────────────────────
      const measureTypeField = dimensions[0]?.name;
      const kpiFields = measures.map(m => m.name);

      // ── Separate data by measure_type ────────────────────────────────────────
      const rowsByType = {};
      data.forEach(row => {
        const type = row[measureTypeField]?.value;
        if (type) rowsByType[type] = row;
      });

      // ── Build extended data with delta rows ──────────────────────────────────
      const extendedData = [...data];

      // Fact vs Plan: (fact / plan) - 1
      if (rowsByType['Fact'] && rowsByType['Plan']) {
        const deltaRow = { ...rowsByType['Fact'] };
        deltaRow[measureTypeField] = { value: 'Fact vs Plan', rendered_value: 'Fact vs Plan' };
        kpiFields.forEach(kpi => {
          const factVal = rowsByType['Fact'][kpi]?.value;
          const planVal = rowsByType['Plan'][kpi]?.value;
          if (factVal != null && planVal != null && planVal !== 0) {
            const pctDelta = (factVal / planVal) - 1;
            deltaRow[kpi] = {
              value: pctDelta,
              rendered_value: (pctDelta * 100).toFixed(1) + '%',
              is_delta: true,
              delta_sign: pctDelta >= 0 ? 'positive' : 'negative'
            };
          } else {
            deltaRow[kpi] = { rendered_value: '—' };
          }
        });
        extendedData.push(deltaRow);
      }

      // Fact vs PY: (fact / py) - 1
      if (rowsByType['Fact'] && rowsByType['Past Year']) {
        const deltaRow = { ...rowsByType['Fact'] };
        deltaRow[measureTypeField] = { value: 'Fact vs PY', rendered_value: 'Fact vs PY' };
        kpiFields.forEach(kpi => {
          const factVal = rowsByType['Fact'][kpi]?.value;
          const pyVal = rowsByType['Past Year'][kpi]?.value;
          if (factVal != null && pyVal != null && pyVal !== 0) {
            const pctDelta = (factVal / pyVal) - 1;
            deltaRow[kpi] = {
              value: pctDelta,
              rendered_value: (pctDelta * 100).toFixed(1) + '%',
              is_delta: true,
              delta_sign: pctDelta >= 0 ? 'positive' : 'negative'
            };
          } else {
            deltaRow[kpi] = { rendered_value: '—' };
          }
        });
        extendedData.push(deltaRow);
      }

      // ── Build table header ───────────────────────────────────────────────────
      const headerRow = allFields.map(f =>
        `<th>${f.label_short || f.name}</th>`
      ).join('');

      // ── Build table rows (data rows in tbody, delta rows in tfoot) ──────────
      const renderRow = (row) => {
        const isDelta = row[kpiFields[0]]?.is_delta;
        const rowClass = isDelta ? 'class="tv-delta-row"' : '';
        return `<tr ${rowClass}>${allFields.map(field => {
          const cell = row[field.name];
          const isDeltaCell = cell?.is_delta;
          const cellClass = isDeltaCell ? (cell.delta_sign === 'positive' ? 'tv-delta-positive' : 'tv-delta-negative') : '';
          const cellClassAttr = cellClass ? `class="${cellClass}"` : '';
          const displayValue = cell?.rendered_value || that.formatValue(cell?.value, field) || '—';
          return `<td ${cellClassAttr}>${displayValue}</td>`;
        }).join('')}</tr>`;
      };

      const bodyRows = data.map(renderRow).join('');
      const deltaRows = extendedData.slice(data.length).map(renderRow).join('');

      // ── Render table ─────────────────────────────────────────────────────────
      body.innerHTML = `
        <table class="tv-table" id="tv-data-table">
          <thead>
            <tr>${headerRow}</tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
          <tfoot>
            ${deltaRows}
          </tfoot>
        </table>`;

      // ── Attach drill handlers ────────────────────────────────────────────────
      const table = body.querySelector('#tv-data-table');
      const tbodyRows = table.querySelectorAll('tbody tr');

      tbodyRows.forEach((trEl, rowIdx) => {
        // Delta rows are synthetic — no corresponding data row, skip
        if (rowIdx >= data.length) return;

        const dataRow = data[rowIdx];
        const cells = trEl.querySelectorAll('td');

        cells.forEach((cell, cellIdx) => {
          const field = allFields[cellIdx];
          if (!field) return;

          const cellData = dataRow[field.name];
          if (cellData && cellData.links && cellData.links.length > 0) {
            cell.setAttribute('data-drillable', 'true');
            cell.addEventListener('click', (e) => {
              e.stopPropagation();
              LookerCharts.Utils.openDrillMenu({ links: cellData.links, event: e });
            });
          }
        });
      });

      // Signal to Looker that rendering is complete
      this.trigger('updateComplete');
    } catch (err) {
      console.error('Custom viz error:', err);
      this.addError({title: 'Visualization Error', message: err.message});
    }
  },

});
