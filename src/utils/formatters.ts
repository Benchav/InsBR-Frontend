// Convertir centavos a córdobas (backend -> frontend)
export const toCurrency = (cents: number): number => {
  return cents / 100;
};

// Alias compatible
export const centsToCurrency = toCurrency;

// Formatear como moneda (Córdobas) para mostrar en UI
export const formatCurrency = (cents: number | undefined | null): string => {
  if (cents === undefined || cents === null || isNaN(cents)) return 'C$ 0.00';
  const amount = toCurrency(cents);
  return `C$ ${amount.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Formatear moneda sin centavos (para valores grandes)
export const formatCurrencyShort = (cents: number): string => {
  const amount = toCurrency(cents);
  if (amount >= 1000000) {
    return `C$ ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `C$ ${(amount / 1000).toFixed(1)}K`;
  }
  return `C$ ${amount.toFixed(0)}`;
};

// Convertir córdobas a centavos (frontend -> backend)
// ROBUST: Handles floats appropriately to avoid floating point errors before rounding
export const toCents = (amount: number): number => {
  return Math.round(amount * 100);
};

// Alias compatible
export const currencyToCents = toCents;

// Formatear fecha
export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Formatear fecha corta
export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-NI', {
    month: 'short',
    day: 'numeric',
  });
};

// Formatear fecha y hora
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Formatear porcentaje
export const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};
