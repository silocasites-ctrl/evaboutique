import { CheckCircle2, Clock, AlertTriangle, AlertCircle, CircleDashed, Ban } from 'lucide-react';

/**
 * Componente de Badge de Status estilizado com visual shadcn/ui e Tailwind
 */
export default function StatusBadge({ status, diasAtraso = 0, label = null, size = 'md' }) {
  const normStatus = String(status || '').toLowerCase();

  let config = {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    Icon: CircleDashed,
    defaultLabel: 'Indefinido'
  };

  switch (normStatus) {
    case 'quitado':
      config = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        Icon: CheckCircle2,
        defaultLabel: 'Quitado'
      };
      break;

    case 'em_aberto':
    case 'aberto':
      config = {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        Icon: Clock,
        defaultLabel: 'Em aberto'
      };
      break;

    case 'vence_hoje':
      config = {
        bg: 'bg-amber-100/80',
        text: 'text-amber-900',
        border: 'border-amber-300 font-bold animate-pulse',
        dot: 'bg-amber-600',
        Icon: AlertTriangle,
        defaultLabel: 'Vence hoje'
      };
      break;

    case 'vence_em_breve':
    case 'vence_breve':
      config = {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        Icon: AlertTriangle,
        defaultLabel: 'Vence em até 3 dias'
      };
      break;

    case 'atrasado':
      config = {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200 font-semibold',
        dot: 'bg-rose-500',
        Icon: AlertCircle,
        defaultLabel: diasAtraso > 0 ? `Atrasado (${diasAtraso}d)` : 'Atrasado'
      };
      break;

    case 'parcialmente_pago':
      config = {
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
        dot: 'bg-sky-500',
        Icon: Clock,
        defaultLabel: 'Parcialmente pago'
      };
      break;

    case 'sem_debitos':
      config = {
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
        Icon: CheckCircle2,
        defaultLabel: 'Sem débitos'
      };
      break;

    case 'cancelado':
      config = {
        bg: 'bg-gray-100',
        text: 'text-gray-500 line-through',
        border: 'border-gray-200',
        dot: 'bg-gray-400',
        Icon: Ban,
        defaultLabel: 'Cancelado'
      };
      break;

    default:
      break;
  }

  const displayText = label || config.defaultLabel;
  const { Icon } = config;

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs gap-1' 
    : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border transition-colors shadow-xs ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      <span className="truncate">{displayText}</span>
    </span>
  );
}
