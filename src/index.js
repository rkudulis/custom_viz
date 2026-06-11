import { buildStyles } from './styles.js';
import { buildDeltaRows } from './deltaRows.js';
import { buildHeaderRow, buildTableHTML } from './render.js';
import { attachDrillHandlers } from './drillHandler.js';

looker.plugins.visualizations.add({
  id: 'test_viz',
  label: 'Test Viz',
  options: {
    header_alignment: {
      type: 'string', label: 'Header Alignment', section: 'Style', order: 1,
      display: 'select', default: 'left',
      values: [{ 'Left': 'left' }, { 'Center': 'center' }, { 'Right': 'right' }],
    },
    cell_alignment: {
      type: 'string', label: 'Cell Alignment', section: 'Style', order: 2,
      display: 'select', default: 'left',
      values: [{ 'Left': 'left' }, { 'Center': 'center' }, { 'Right': 'right' }],
    },
    font_size: {
      type: 'string', label: 'Font Size', section: 'Style', order: 3,
      display: 'select', default: '13px',
      values: [{ 'Small (12px)': '12px' }, { 'Medium (13px)': '13px' }, { 'Large (14px)': '14px' }],
    },
    row_density: {
      type: 'string', label: 'Row Density', section: 'Style', order: 4,
      display: 'select', default: 'default',
      values: [{ 'Compact': 'compact' }, { 'Default': 'default' }, { 'Comfortable': 'comfortable' }],
    },
    header_background: {
      type: 'string', label: 'Header Background', section: 'Style', order: 5,
      display: 'color', default: '#f4f4f4',
    },
    zebra_striping: {
      type: 'boolean', label: 'Alternating Row Colors', section: 'Style', order: 6,
      default: false,
    },
  },

  create(element, config) {
    // update() manages all DOM; create() just sets root container
    element.innerHTML = '<div class="tv-root"></div>';
  },

  update(data, element, config, queryResponse) {
    try {
      this.clearErrors();

      element.querySelector('#tv-styles')?.remove();
      element.querySelector('.tv-wrap')?.remove();
      element.insertAdjacentHTML('beforeend',
        `<style id="tv-styles">${buildStyles(config)}</style><div class="tv-wrap"><div class="tv-body" id="tv-body"></div></div>`);
      const body = element.querySelector('#tv-body');
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
      const kpiFields = measures.map(m => m.name);
      const deltaRows = buildDeltaRows(data, measureTypeField, kpiFields);
      const headerRow = buildHeaderRow(allFields);

      body.innerHTML = buildTableHTML(data, deltaRows, allFields, kpiFields, headerRow);

      const table = body.querySelector('#tv-data-table');
      attachDrillHandlers(table, data, allFields, measureTypeField);
    } catch (err) {
      console.error('Custom viz error:', err);
      this.addError({ title: 'Visualization Error', message: err.message });
    }
  },
});
