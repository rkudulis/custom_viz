export function attachDrillHandlers(table, data, allFields) {
  table.querySelectorAll('tbody tr').forEach((trEl, rowIdx) => {
    if (rowIdx >= data.length) return;

    const dataRow = data[rowIdx];
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
  });
}
