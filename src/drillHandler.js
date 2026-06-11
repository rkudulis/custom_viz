function attachRowDrills(trEl, dataRow, allFields) {
  trEl.querySelectorAll('td').forEach((cell, cellIdx) => {
    const field = allFields[cellIdx];
    if (!field) return;

    const cellData = dataRow[field.name];
    if (cellData?.links?.length > 0) {
      cell.setAttribute('data-drillable', 'true');
      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        LookerCharts.Utils.openDrillMenu({
          links: cellData.links,
          event: { metaKey: e.metaKey, pageX: e.pageX, pageY: e.pageY - window.pageYOffset },
        });
      });
    }
  });
}

export function attachDrillHandlers(table, data, allFields, measureTypeField) {
  table.querySelectorAll('tbody tr').forEach((trEl, rowIdx) => {
    if (rowIdx >= data.length) return;
    attachRowDrills(trEl, data[rowIdx], allFields);
  });

  const factRow = data.find(r => r[measureTypeField]?.value === 'Fact');
  const planRow = data.find(r => r[measureTypeField]?.value === 'Plan');
  const pyRow   = data.find(r => r[measureTypeField]?.value === 'Past Year');

  table.querySelectorAll('tfoot tr').forEach((trEl, rowIdx) => {
    const label = trEl.querySelector('td')?.textContent?.trim();
    const isVsPlan = label === 'Fact vs Plan';
    const baseRow  = isVsPlan ? planRow : pyRow;

    trEl.querySelectorAll('td').forEach((cell, cellIdx) => {
      const field = allFields[cellIdx];
      if (!field) return;

      const factLinks = factRow?.[field.name]?.links || [];
      const baseLinks = baseRow?.[field.name]?.links || [];
      const links = [
        ...factLinks.map(l => ({ ...l, label: `Fact — ${l.label}` })),
        ...baseLinks.map(l => ({ ...l, label: `${isVsPlan ? 'Plan' : 'Past Year'} — ${l.label}` })),
      ];

      if (links.length > 0) {
        cell.setAttribute('data-drillable', 'true');
        cell.addEventListener('click', (e) => {
          e.stopPropagation();
          LookerCharts.Utils.openDrillMenu({
            links,
            event: { metaKey: e.metaKey, pageX: e.pageX, pageY: e.pageY - window.pageYOffset },
          });
        });
      }
    });
  });
}
