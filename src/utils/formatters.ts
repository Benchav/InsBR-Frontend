// Convertir centavos a córdobas
export const centsToCurrency = (cents: number): number => {
  return cents / 100;
};

// Formatear como moneda (Córdobas)
export const formatCurrency = (cents: number): string => {
  const amount = centsToCurrency(cents);
  return `C$ ${amount.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Formatear moneda sin centavos (para valores grandes)
export const formatCurrencyShort = (cents: number): string => {
  const amount = centsToCurrency(cents);
  if (amount >= 1000000) {
    return `C$ ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `C$ ${(amount / 1000).toFixed(1)}K`;
  }
  return `C$ ${amount.toFixed(0)}`;
};

// Convertir córdobas a centavos
export const currencyToCents = (amount: number): number => {
  return Math.round(amount * 100);
};

// Formatear fecha
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
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
