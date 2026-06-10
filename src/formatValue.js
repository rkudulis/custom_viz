export function formatValue(value, field) {
  if (value == null || value === '') return '—';

  const numVal = parseFloat(value);
  if (isNaN(numVal)) return value;

  if (field.value_format_name === 'percent_2' || field.value_format === '0.00%') {
    return (numVal * 100).toFixed(2) + '%';
  }
  if (field.value_format_name === 'percent_1') {
    return (numVal * 100).toFixed(1) + '%';
  }
  if (field.value_format_name === 'percent_0') {
    return (numVal * 100).toFixed(0) + '%';
  }
  if (field.value_format === '#,##0') {
    return numVal.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  if (field.value_format === '#,##0.00') {
    return numVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (field.value_format === '0.00') {
    return numVal.toFixed(2);
  }

  return value;
}
