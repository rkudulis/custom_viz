const DENSITY_PADDING = {
  compact:     '5px 8px',
  default:     '10px 12px',
  comfortable: '15px 16px',
};

export function buildStyles(config = {}) {
  const cellAlign   = config.cell_alignment   || 'left';
  const headerAlign = config.header_alignment || 'left';
  const fontSize    = config.font_size        || '13px';
  const padding     = DENSITY_PADDING[config.row_density] || DENSITY_PADDING.default;
  const headerBg    = config.header_background || '#f4f4f4';
  const zebraRule   = config.zebra_striping
    ? `.tv-table tbody tr:nth-child(even) { background: #f7f7f7; }`
    : '';

  return `
    .tv-wrap { font-family: inherit; padding: 0; box-sizing: border-box; height: 100%; }
    .tv-body { padding: 0; background: #fff; }
    .tv-error { color: #c0392b; font-size: 13px; padding: 12px; }
    .tv-table { width: 100%; border-collapse: collapse; font-size: ${fontSize}; }
    .tv-table th {
      background: ${headerBg};
      padding: ${padding};
      text-align: ${headerAlign};
      border-bottom: 2px solid #ddd;
      font-weight: 600;
      color: #333;
    }
    .tv-table td {
      padding: ${padding};
      border-bottom: 1px solid #eee;
      color: #444;
      text-align: ${cellAlign};
    }
    .tv-table tr:hover { background: #f9f9f9; }
    ${zebraRule}
    .tv-delta-row { background: #f0f0f0; font-weight: 600; }
    .tv-delta-row:hover { background: #e8e8e8; }
    .tv-delta-positive { background: #d5f5e3; color: #1e8449; font-weight: 600; }
    .tv-delta-negative { background: #fadbd8; color: #c0392b; font-weight: 600; }
    .tv-table td[data-drillable="true"] {
      cursor: pointer;
      text-decoration: underline;
      text-decoration-color: #3498db;
      text-decoration-style: dotted;
    }
    .tv-table td[data-drillable="true"]:hover { background: #e3f2fd !important; }
  `;
}
