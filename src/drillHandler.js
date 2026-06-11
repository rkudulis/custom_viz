function buildCombinedLink(factLink, comparisonValue) {
  if (!factLink?.url) return null;
  try {
    const url = new URL(factLink.url, window.location.origin);
    for (const [key, val] of url.searchParams.entries()) {
      if (val === 'Fact') {
        url.searchParams.set(key, `Fact,${comparisonValue}`);
        break;
      }
    }
    return { ...factLink, url: url.pathname + url.search };
  } catch (_) {
    return factLink;
  }
}

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

  table.querySelectorAll('tfoot tr').forEach((trEl) => {
    const label = trEl.querySelector('td')?.textContent?.trim();
    const isVsPlan = label === 'Fact vs Plan';
    const compValue = isVsPlan ? 'Plan' : 'Past Year';

    trEl.querySelectorAll('td').forEach((cell, cellIdx) => {
      const field = allFields[cellIdx];
      if (!field) return;

      const factLinks = factRow?.[field.name]?.links || [];
      const links = factLinks.map(l => buildCombinedLink(l, compValue)).filter(Boolean);

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
