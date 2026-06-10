export const styles = `
  .tv-wrap {
    font-family: inherit;
    padding: 0;
    box-sizing: border-box;
    height: 100%;
  }
  .tv-body {
    padding: 0;
    background: #fff;
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
`;
