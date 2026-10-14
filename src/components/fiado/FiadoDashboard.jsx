import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { fiadoService } from '../../services/fiadoService';
import { 
  centsToCurrency, 
  formatDate, 
  buildWhatsAppLink, 
  formatPhone 
} from '../../utils/formatters';
import StatusBadge from '../ui/StatusBadge';
import { CardSkeleton, TableSkeleton } from '../ui/Skeleton';
import { 
  DollarSign, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Plus, 
  ArrowUpRight, 
  MessageSquare, 
  Calendar, 
  Clock, 
  CalendarDays,
  Sparkles,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

export default function FiadoDashboard(props) {
  const navigate = useNavigate();
  const outletCtx = useOutletContext() || {};
  const onOpenNovoFiado = props.onOpenNovoFiado || outletCtx.onOpenNovoFiado;

  const [metrics, setMetrics] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredWeek, setHoveredWeek] = useState(null);

  const carregarDados = async () => {
    setLoading(false);
    try {
      const [m, f] = await Promise.all([
        fiadoService.getDashboardMetrics(),
        fiadoService.getWeeklyForecast(8)
      ]);
      setMetrics(m);
      setForecast(f);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 h-64 animate-pulse" />
        <TableSkeleton rows={4} cols={5} />
      </div>
    );
  }

  // Encontra o valor máximo para a escala do gráfico
  const maxForecastValue = Math.max(...forecast.map(w => w.valorCentavos), 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. CARDS DE RESUMO FINANCEIRO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total a Receber */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total a Receber
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {centsToCurrency(metrics.totalAReceber)}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Créditos ativos a receber</span>
            </p>
          </div>
        </div>

        {/* Total em Atraso */}
        <div className="bg-white rounded-xl p-5 border border-rose-200/90 shadow-2xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Total em Atraso
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-rose-600 tracking-tight">
              {centsToCurrency(metrics.totalEmAtraso)}
            </h3>
            <p className="text-xs text-rose-600/80 mt-1 font-medium">
              {metrics.listaEmAtraso.length} parcelas vencidas
            </p>
          </div>
        </div>

        {/* Recebido no Mês */}
        <div className="bg-white rounded-xl p-5 border border-emerald-200/90 shadow-2xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Recebido no Mês
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-emerald-600 tracking-tight">
              {centsToCurrency(metrics.recebidoNoMes)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Amortizações registradas
            </p>
          </div>
        </div>

        {/* Clientes Devedores */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Clientes Devedores
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.numeroClientesDevedores}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Com saldo em aberto na loja
            </p>
          </div>
        </div>
      </div>

      {/* 2. GRÁFICO DE BARRAS: VALORES A VENCER POR SEMANA (PRÓXIMAS 8 SEMANAS) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-amber-600" />
              Previsão de Recebimentos por Semana (Próximas 8 Semanas)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Valores programados para vencer nas próximas semanas para planejamento do fluxo de caixa
            </p>
          </div>
          {hoveredWeek && (
            <div className="text-right text-xs bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg animate-in fade-in">
              <span className="font-semibold text-amber-900">{hoveredWeek.label} ({hoveredWeek.periodo}): </span>
              <span className="font-bold text-amber-700">{centsToCurrency(hoveredWeek.valorCentavos)}</span>
              <span className="text-amber-600 text-[11px]"> • {hoveredWeek.quantidadeParcelas} parcela(s)</span>
            </div>
          )}
        </div>

        {/* Bar Chart Container */}
        <div className="pt-4 pb-2">
          <div className="grid grid-cols-8 gap-2 sm:gap-4 items-end h-52 border-b border-slate-200 px-2">
            {forecast.map((week, idx) => {
              const heightPercent = maxForecastValue > 0 
                ? Math.max(6, Math.round((week.valorCentavos / maxForecastValue) * 100))
                : 6;
              const isCurrentWeek = idx === 0;
              const hasValue = week.valorCentavos > 0;

              return (
                <div
                  key={week.semanaIndex}
                  onMouseEnter={() => setHoveredWeek(week)}
                  onMouseLeave={() => setHoveredWeek(null)}
                  className="flex flex-col items-center justify-end h-full group cursor-pointer"
                >
                  {/* Tooltip valor acima da barra */}
                  <div className="text-[11px] font-bold text-slate-700 opacity-90 group-hover:opacity-100 group-hover:text-amber-700 mb-1 transition-colors text-center whitespace-nowrap">
                    {hasValue ? centsToCurrency(week.valorCentavos) : '-'}
                  </div>

                  {/* Barra */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[48px] rounded-t-lg transition-all duration-300 relative group-hover:brightness-110 ${
                      isCurrentWeek
                        ? 'bg-gradient-to-t from-amber-600 to-amber-500 shadow-sm shadow-amber-300/40'
                        : hasValue
                        ? 'bg-gradient-to-t from-slate-400 to-amber-400 group-hover:from-amber-600 group-hover:to-amber-500'
                        : 'bg-slate-100'
                    }`}
                  >
                    {isCurrentWeek && hasValue && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rótulos dos eixos X */}
          <div className="grid grid-cols-8 gap-2 sm:gap-4 pt-3 px-2 text-center">
            {forecast.map((week, idx) => (
              <div key={week.semanaIndex} className="text-xs">
                <p className={`font-semibold truncate ${idx === 0 ? 'text-amber-700 font-bold' : 'text-slate-700'}`}>
                  {week.label}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {week.periodo}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. TABELAS: "EM ATRASO" E "PRÓXIMOS VENCIMENTOS" LADO A LADO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabela: Em Atraso */}
        <div className="bg-white rounded-xl border border-rose-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="text-sm font-bold text-rose-950">Cobranças em Atraso</h3>
                <p className="text-[11px] text-rose-700">Parcelas com vencimento expirado que necessitam cobrança</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              {metrics.listaEmAtraso.length} pendentes
            </span>
          </div>

          <div className="flex-1 overflow-x-auto">
            {metrics.listaEmAtraso.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                Nenhuma parcela em atraso no momento! Excelente saúde financeira.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Vencimento</th>
                    <th className="py-2.5 px-3">Atraso</th>
                    <th className="py-2.5 px-3 text-right">Valor</th>
                    <th className="py-2.5 px-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.listaEmAtraso.map((item) => {
                    const waLink = buildWhatsAppLink(
                      item.cliente_nome,
                      item.cliente_telefone,
                      item.saldo_restante,
                      item.data_vencimento
                    );

                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-rose-50/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/fiado/clientes/${item.cliente_id}`)}
                      >
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-900 hover:text-amber-700 transition-colors">{item.cliente_nome}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{item.fiado_descricao}</p>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {formatDate(item.data_vencimento)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] bg-rose-100 text-rose-700">
                            {item.dias_atraso} {item.dias_atraso === 1 ? 'dia' : 'dias'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-rose-600">
                          {centsToCurrency(item.saldo_restante)}
                        </td>
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {item.cliente_telefone ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-medium transition-colors"
                              title="Cobrar via WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Cobrar</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400">Sem tel</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Tabela: Próximos Vencimentos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Próximos Vencimentos</h3>
                <p className="text-[11px] text-slate-500">Parcelas a vencer hoje ou nas próximas semanas</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/fiado/clientes')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors"
            >
              Ver clientes <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {metrics.proximosVencimentos.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Nenhuma parcela a vencer no momento.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Data Venc.</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Valor</th>
                    <th className="py-2.5 px-3 text-center">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.proximosVencimentos.map((item) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        item.is_hoje ? 'bg-amber-50/40 font-medium' : ''
                      }`}
                      onClick={() => navigate(`/fiado/clientes/${item.cliente_id}`)}
                    >
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-900 hover:text-amber-700 transition-colors">{item.cliente_nome}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{item.fiado_descricao}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {formatDate(item.data_vencimento)}
                      </td>
                      <td className="py-3 px-3">
                        {item.is_hoje ? (
                          <StatusBadge status="vence_hoje" size="sm" />
                        ) : item.dias_restantes <= 3 ? (
                          <StatusBadge status="vence_em_breve" label={`Em ${item.dias_restantes} dias`} size="sm" />
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            Em {item.dias_restantes} dias
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {centsToCurrency(item.saldo_restante)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="p-1 rounded-md text-slate-400 hover:text-slate-700 inline-block">
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
