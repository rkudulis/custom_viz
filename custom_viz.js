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
      </style>
      <div class="tv-wrap">
        <div class="tv-header" id="tv-header">Loading…</div>
        <div class="tv-body" id="tv-body"></div>
      </div>`;
  },

  // ── update() — runs every time data or config changes ─────────────────────
  // This is where all your rendering logic lives.
  update(data, element, config, queryResponse) {

    // Always clear errors from previous renders first
    this.clearErrors();

    const header = element.querySelector('#tv-header');
    const body   = element.querySelector('#tv-body');

    // ── Read config options ──────────────────────────────────────────────────
    const title       = config.title || 'Test Visualization';
    const headerColor = config.header_color || '#1D9E75';

    // ── Apply header ─────────────────────────────────────────────────────────
    header.textContent    = title;
    header.style.background = headerColor;

    // ── Read fields from queryResponse ───────────────────────────────────────
    // queryResponse.fields has two arrays: dimensions and measures
    const dimensions = queryResponse.fields.dimensions || [];
    const measures   = queryResponse.fields.measures   || [];
    const allFields  = [...dimensions, ...measures];

    if (allFields.length === 0) {
      body.innerHTML = '<div class="tv-error">No fields found in query. Add at least one dimension or measure.</div>';
      return;
    }

    // ── Row count ────────────────────────────────────────────────────────────
    const rowCount = data.length;

    // ── First cell value ─────────────────────────────────────────────────────
    // data[0] is an object keyed by field name.
    // Each value is { value: rawValue, rendered_value: formattedString }
    let firstValue = '—';
    if (rowCount > 0) {
      const firstFieldName = allFields[0].name;
      const cell = data[0][firstFieldName];
      if (cell) {
        firstValue = cell.rendered_value ?? cell.value ?? '—';
      }
    }

    // ── Build field tag list ──────────────────────────────────────────────────
    const dimTags = dimensions.map(f =>
      `<span class="tv-field" style="border-left: 3px solid #378ADD">${f.label_short || f.name}</span>`
    ).join('');

    const measTags = measures.map(f =>
      `<span class="tv-field" style="border-left: 3px solid #1D9E75">${f.label_short || f.name}</span>`
    ).join('');

    // ── Render ────────────────────────────────────────────────────────────────
    body.innerHTML = `
      <div class="tv-stat">Rows returned: <span>${rowCount}</span></div>
      <div class="tv-stat">Dimensions: <span>${dimensions.length}</span> &nbsp; Measures: <span>${measures.length}</span></div>

      <hr class="tv-divider">

      <div class="tv-field-list">
        <div style="font-size:11px;color:#999;margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em">
          Dimensions (blue) &amp; Measures (green)
        </div>
        ${dimTags}${measTags}
      </div>

      <div class="tv-first-value">
        First cell value
        <code>${String(firstValue).substring(0, 80)}</code>
      </div>`;

    // Signal to Looker that rendering is complete
    this.trigger('updateComplete');
  },

});
