export function buildDeltaRows(data, measureTypeField, kpiFields) {
  const rowsByType = {};
  data.forEach(row => {
    const type = row[measureTypeField]?.value;
    if (type) rowsByType[type] = row;
  });

  const deltaRows = [];

  if (rowsByType['Fact'] && rowsByType['Plan']) {
    deltaRows.push(makeDeltaRow(rowsByType['Fact'], rowsByType['Plan'], 'Fact vs Plan', measureTypeField, kpiFields));
  }

  if (rowsByType['Fact'] && rowsByType['Past Year']) {
    deltaRows.push(makeDeltaRow(rowsByType['Fact'], rowsByType['Past Year'], 'Fact vs PY', measureTypeField, kpiFields));
  }

  return deltaRows;
}

function makeDeltaRow(factRow, baseRow, label, measureTypeField, kpiFields) {
  const row = { ...factRow };
  row[measureTypeField] = { value: label, rendered_value: label };

  kpiFields.forEach(kpi => {
    const factVal = factRow[kpi]?.value;
    const baseVal = baseRow[kpi]?.value;

    if (factVal != null && baseVal != null && baseVal !== 0) {
      const pctDelta = (factVal / baseVal) - 1;
      row[kpi] = {
        value: pctDelta,
        rendered_value: (pctDelta * 100).toFixed(1) + '%',
        is_delta: true,
        delta_sign: pctDelta >= 0 ? 'positive' : 'negative',
      };
    } else {
      row[kpi] = { rendered_value: '—' };
    }
  });

  return row;
}
