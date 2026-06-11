import { formatValue } from './formatValue.js';

export function buildTableHTML(data, deltaRows, allFields, kpiFields, headerRow) {
  const bodyRows = data.map(row => renderRow(row, allFields, kpiFields)).join('');
  const footRows = deltaRows.map(row => renderRow(row, allFields, kpiFields)).join('');

  return `
    <table class="tv-table" id="tv-data-table">
      <thead><tr>${headerRow}</tr></thead>
      <tbody>${bodyRows}</tbody>
      <tfoot>${footRows}</tfoot>
    </table>`;
}

export function buildHeaderRow(allFields) {
  return allFields.map(f => `<th>${f.label_short || f.name}</th>`).join('');
}

function renderRow(row, allFields, kpiFields) {
  const isDeltaRow = kpiFields.some(k => row[k]?.is_delta);
  const rowClass = isDeltaRow ? 'class="tv-delta-row"' : '';

  const cells = allFields.map(field => {
    const cell = row[field.name];
    const isDeltaCell = cell?.is_delta;
    const cellClass = isDeltaCell
      ? (cell.delta_sign === 'positive' ? 'tv-delta-positive' : 'tv-delta-negative')
      : '';
    const classAttr = cellClass ? `class="${cellClass}"` : '';
    const display = cell?.rendered ?? formatValue(cell?.value, field) ?? '—';
    return `<td ${classAttr}>${display}</td>`;
  }).join('');

  return `<tr ${rowClass}>${cells}</tr>`;
}
