// Fallback formatter — only fires when Looker does not provide rendered_value.
// Looker-provided rendered_value already respects account locale, so prefer that.
export function formatValue(value, field) {
  if (value == null || value === '' || value === 0) return '—';

  const numVal = parseFloat(value);
  if (isNaN(numVal)) return value;

  const fmt = field.value_format_name;
  const raw = field.value_format;

  if (fmt === 'percent_2' || raw === '0.00%') return (numVal * 100).toFixed(2) + '%';
  if (fmt === 'percent_1')                    return (numVal * 100).toFixed(1) + '%';
  if (fmt === 'percent_0')                    return (numVal * 100).toFixed(0) + '%';

  // decimal_0 / decimal_1 / decimal_2 — Looker built-in names
  if (fmt === 'decimal_0') return Math.round(numVal).toLocaleString();
  if (fmt === 'decimal_1') return numVal.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (fmt === 'decimal_2') return numVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // explicit value_format strings
  if (raw === '#,##0')    return Math.round(numVal).toLocaleString();
  if (raw === '#,##0.00') return numVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (raw === '0.00')     return numVal.toFixed(2);

  return value;
}
