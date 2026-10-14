import { useState, useEffect } from 'react';
import { fiadoService } from '../../services/fiadoService';
import { 
  centsToCurrency, 
  formatDate, 
  formatPhone, 
  getTodayDateString, 
  addDaysToDateString 
} from '../../utils/formatters';
import StatusBadge from '../ui/StatusBadge';
import { TableSkeleton } from '../ui/Skeleton';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  Calendar, 
  User, 
  DollarSign, 
  RefreshCw 
} from 'lucide-react';

export default function FiadoRelatorios() {
  const [clientes, setClientes] = useState([]);
  const [dataInicio, setDataInicio] = useState(addDaysToDateString(getTodayDateString(), -60));
  const [dataFim, setDataFim] = useState(addDaysToDateString(getTodayDateString(), 60));
  const [clienteId, setClienteId] = useState('todos');
  const [status, setStatus] = useState('todos');

  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carrega lista de clientes para o filtro
  useEffect(() => {
    async function loadInitial() {
      try {
        const list = await fiadoService.getClientes();
        setClientes(list);
      } catch (err) {
        console.error(err);
      }
    }
    loadInitial();
  }, []);

  // Executa busca com filtros
  const executarFiltro = async () => {
    setLoading(true);
    try {
      const data = await fiadoService.getRelatorio({
        dataInicio,
        dataFim,
        clienteId,
        status
      });
      setResultado(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executarFiltro();
  }, [dataInicio, dataFim, clienteId, status]);

  // Exportar CSV formatado com BOM UTF-8 e delimitador ";" para Excel no Brasil
  const exportarCSV = () => {
    if (!resultado || resultado.itens.length === 0) return;

    const headers = [
      'Cliente',
      'Telefone',
      'Compra/Descricao',
      'Parcela',
      'Vencimento',
      'Valor Original (R$)',
      'Valor Pago (R$)',
      'Saldo Restante (R$)',
      'Status'
    ];

    const rows = resultado.itens.map(item => [
      `"${item.cliente_nome.replace(/"/g, '""')}"`,
      `"${formatPhone(item.cliente_telefone)}"`,
      `"${item.fiado_descricao.replace(/"/g, '""')}"`,
      `"${item.numero_parcela}/${item.total_parcelas}"`,
      `"${formatDate(item.data_vencimento)}"`,
      `"${(item.valor / 100).toFixed(2).replace('.', ',')}"`,
      `"${(item.valor_pago / 100).toFixed(2).replace('.', ',')}"`,
      `"${(item.saldo_restante / 100).toFixed(2).replace('.', ',')}"`,
      `"${item.status_calculado}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_fiado_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Imprimir com folha de estilo de impressão otimizada
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* CABEÇALHO DE RELATÓRIOS E AÇÕES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            Relatórios e Demonstrativo de Fiados
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analise lançamentos por período, filtre por cliente e exporte para contabilidade.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportarCSV}
            disabled={!resultado || resultado.itens.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!resultado || resultado.itens.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs shadow-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* CABEÇALHO EXCLUSIVO PARA IMPRESSÃO */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-4">
        <h1 className="text-xl font-bold text-slate-900">EVA BOUTIQUE - Relatório de Fiado & Crediário</h1>
        <p className="text-xs text-slate-600 mt-1">
          Emissão em: {formatDate(getTodayDateString())} • Período: {formatDate(dataInicio)} até {formatDate(dataFim)}
        </p>
      </div>

      {/* BARRA DE FILTROS LADO A LADO */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Data Início */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Vencimento Inicial
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Data Fim */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Vencimento Final
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Cliente
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="todos">Todos os Clientes</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Status do Débito
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendentes">Apenas Pendentes (Em Aberto/Atrasados)</option>
              <option value="atrasado">Apenas Atrasados</option>
              <option value="vence_hoje">Vence Hoje</option>
              <option value="em_aberto">Em Aberto (No Prazo)</option>
              <option value="quitado">Quitados</option>
            </select>
          </div>
        </div>
      </div>

      {/* CARDS RESUMO DO RELATÓRIO FILTRADO */}
      {resultado && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Lançado</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{centsToCurrency(resultado.metricas.totalOriginal)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{resultado.metricas.quantidadeItens} parcelas listadas</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
            <p className="text-xs font-semibold uppercase text-emerald-700 tracking-wider">Total Já Quitado</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{centsToCurrency(resultado.metricas.totalPago)}</p>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">Valores recebidos</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs">
            <p className="text-xs font-semibold uppercase text-rose-600 tracking-wider">Saldo Pendente</p>
            <p className="text-xl font-bold text-rose-600 mt-1">{centsToCurrency(resultado.metricas.totalPendente)}</p>
            <p className="text-[11px] text-rose-600/80 mt-0.5">A receber no período</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Taxa de Liquidação</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {resultado.metricas.totalOriginal > 0 
                ? `${Math.round((resultado.metricas.totalPago / resultado.metricas.totalOriginal) * 100)}%` 
                : '0%'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Amortizado vs Total</p>
          </div>
        </div>
      )}

      {/* TABELA ANALÍTICA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : !resultado || resultado.itens.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Nenhum lançamento corresponde aos filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Descrição da Compra</th>
                  <th className="py-3 px-4">Parcela</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4 text-right">Valor Original</th>
                  <th className="py-3 px-4 text-right">Valor Pago</th>
                  <th className="py-3 px-4 text-right">Saldo Restante</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resultado.itens.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.cliente_nome}
                      <span className="block text-[11px] font-normal text-slate-500">
                        {formatPhone(item.cliente_telefone)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {item.fiado_descricao}
                      <span className="block text-[10px] text-slate-400">
                        Comprado em {formatDate(item.fiado_data_compra)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {item.numero_parcela}/{item.total_parcelas}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {formatDate(item.data_vencimento)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      {centsToCurrency(item.valor)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-600">
                      {centsToCurrency(item.valor_pago)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {centsToCurrency(item.saldo_restante)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge
                        status={item.status_calculado}
                        diasAtraso={item.dias_diferenca < 0 ? Math.abs(item.dias_diferenca) : 0}
                        size="sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
