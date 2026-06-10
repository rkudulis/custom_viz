import { styles } from './styles.js';
import { buildDeltaRows } from './deltaRows.js';
import { buildHeaderRow, buildTableHTML } from './render.js';
import { attachDrillHandlers } from './drillHandler.js';

looker.plugins.visualizations.add({
  id: 'test_viz',
  label: 'Test Viz',
  options: {},

  create(element, config) {
    element.innerHTML = `
      <style>${styles}</style>
      <div class="tv-wrap">
        <div class="tv-body" id="tv-body"></div>
      </div>`;
  },

  updateAsync(data, element, config, queryResponse, done) {
    try {
      this.clearErrors();

      const body = element.querySelector('#tv-body');
      const dimensions = queryResponse.fields.dimensions || [];
      const measures = queryResponse.fields.measures || [];
      const allFields = [...dimensions, ...measures];

      if (allFields.length === 0) {
        body.innerHTML = '<div class="tv-error">No fields found in query.</div>';
        done();
        return;
      }
      if (data.length === 0) {
        body.innerHTML = '<div class="tv-error">No data returned from query.</div>';
        done();
        return;
      }

      const measureTypeField = dimensions[0]?.name;
      const kpiFields = measures.map(m => m.name);
      const deltaRows = buildDeltaRows(data, measureTypeField, kpiFields);
      const headerRow = buildHeaderRow(allFields);

      body.innerHTML = buildTableHTML(data, deltaRows, allFields, kpiFields, headerRow);

      const table = body.querySelector('#tv-data-table');
      attachDrillHandlers(table, data, allFields);

      done();
    } catch (err) {
      console.error('Custom viz error:', err);
      this.addError({ title: 'Visualization Error', message: err.message });
      done();
    }
  },
});
