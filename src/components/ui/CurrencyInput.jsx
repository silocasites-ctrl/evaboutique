import { useState, useEffect } from 'react';
import { centsToCurrency, currencyToCents } from '../../utils/formatters';

export default function CurrencyInput({
  valueInCents = 0,
  onChangeCents,
  placeholder = 'R$ 0,00',
  id,
  name,
  disabled = false,
  className = '',
  required = false
}) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (valueInCents === 0 || valueInCents === null || valueInCents === undefined) {
      setDisplayValue('');
    } else {
      setDisplayValue(centsToCurrency(valueInCents).replace('R$', '').trim());
    }
  }, [valueInCents]);

  const handleChange = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setDisplayValue('');
      onChangeCents(0);
      return;
    }

    const cents = parseInt(rawDigits, 10);
    onChangeCents(cents);
    setDisplayValue((cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }));
  };

  return (
    <div className="relative rounded-lg shadow-2xs">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <span className="text-slate-500 font-medium text-sm">R$</span>
      </div>
      <input
        type="text"
        inputMode="numeric"
        id={id}
        name={name}
        disabled={disabled}
        required={required}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder.replace('R$', '').trim()}
        className={`block w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm font-medium transition-all ${className}`}
      />
    </div>
  );
}
