import { 
  centsToCurrency, 
  currencyToCents, 
  getTodayDateString, 
  addDaysToDateString, 
  getDaysDiffFromToday,
  generateInstallments
} from '../utils/formatters';

const STORAGE_KEY = 'eva_boutique_fiado_v1';

/**
 * Gera um identificador único simples
 */
function generateId() {
  return 'id_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

/**
 * Cria os dados iniciais de demonstração (pelo menos 8 clientes com situações ricas e realistas)
 */
function createInitialSeedData() {
  const today = getTodayDateString();
  
  // 1. Maria Clara Souza - Em dia (3 parcelas, 1ª vence em 15 dias)
  const c1Id = 'cli_maria_clara';
  const c1 = {
    id: c1Id,
    nome: 'Maria Clara Souza',
    telefone: '(11) 98765-4321',
    limite_credito: 80000, // R$ 800,00
    observacoes: 'Cliente assídua, prefere pagar no início do mês.',
    criado_em: new Date(Date.now() - 40 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 5 * 86400000).toISOString()
  };

  // 2. Carlos Eduardo Santos - Atrasado há 14 dias (2 fiados)
  const c2Id = 'cli_carlos_eduardo';
  const c2 = {
    id: c2Id,
    nome: 'Carlos Eduardo Santos',
    telefone: '(21) 97654-3210',
    limite_credito: 50000, // R$ 500,00
    observacoes: 'Pediu para avisar pelo WhatsApp um dia antes.',
    criado_em: new Date(Date.now() - 60 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 14 * 86400000).toISOString()
  };

  // 3. Ana Paula Ribeiro - Vence HOJE
  const c3Id = 'cli_ana_paula';
  const c3 = {
    id: c3Id,
    nome: 'Ana Paula Ribeiro',
    telefone: '(31) 99123-4567',
    limite_credito: 100000, // R$ 1.000,00
    observacoes: 'Costuma pagar via PIX no dia do vencimento.',
    criado_em: new Date(Date.now() - 25 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 10 * 86400000).toISOString()
  };

  // 4. Roberto Mendes - Vence em 2 dias (Alerta amarelo)
  const c4Id = 'cli_roberto_mendes';
  const c4 = {
    id: c4Id,
    nome: 'Roberto Mendes',
    telefone: '(41) 98877-6655',
    limite_credito: 60000, // R$ 600,00
    observacoes: 'Trabalha no comércio vizinho.',
    criado_em: new Date(Date.now() - 30 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 12 * 86400000).toISOString()
  };

  // 5. Juliana Ferreira - Parcialmente pago (pagou 1ª parcela de 2)
  const c5Id = 'cli_juliana_ferreira';
  const c5 = {
    id: c5Id,
    nome: 'Juliana Ferreira',
    telefone: '(71) 99345-6789',
    limite_credito: 75000, // R$ 750,00
    observacoes: 'Excelente compradora. Pagamento sempre em dia.',
    criado_em: new Date(Date.now() - 45 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 8 * 86400000).toISOString()
  };

  // 6. Marcos Vinicius Lima - Quitado (com histórico completo)
  const c6Id = 'cli_marcos_vinicius';
  const c6 = {
    id: c6Id,
    nome: 'Marcos Vinicius Lima',
    telefone: '(85) 98112-3344',
    limite_credito: 120000, // R$ 1.200,00
    observacoes: 'Histórico 100% adimplente.',
    criado_em: new Date(Date.now() - 90 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 15 * 86400000).toISOString()
  };

  // 7. Beatriz Albuquerque - Cliente sem débitos (limite disponível)
  const c7Id = 'cli_beatriz_albuquerque';
  const c7 = {
    id: c7Id,
    nome: 'Beatriz Albuquerque',
    telefone: '(19) 99443-2211',
    limite_credito: 50000, // R$ 500,00
    observacoes: 'Cadastrada recentemente, interesse em vestidos de festa.',
    criado_em: new Date(Date.now() - 10 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 10 * 86400000).toISOString()
  };

  // 8. Felipe Augusto Rocha - Atrasado crítico há 32 dias
  const c8Id = 'cli_felipe_augusto';
  const c8 = {
    id: c8Id,
    nome: 'Felipe Augusto Rocha',
    telefone: '(61) 98789-0123',
    limite_credito: 40000, // R$ 400,00
    observacoes: 'Aguardando retorno da mensagem de cobrança.',
    criado_em: new Date(Date.now() - 80 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 32 * 86400000).toISOString()
  };

  // 9. Luciana Mendes - Múltiplos lançamentos (1 quitado, 1 ativo)
  const c9Id = 'cli_luciana_mendes';
  const c9 = {
    id: c9Id,
    nome: 'Luciana Mendes',
    telefone: '(11) 99881-2233',
    limite_credito: 90000, // R$ 900,00
    observacoes: 'Compradora fiel da coleção outono/inverno.',
    criado_em: new Date(Date.now() - 75 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 2 * 86400000).toISOString()
  };

  const clientes = [c1, c2, c3, c4, c5, c6, c7, c8, c9];

  // Fiados e parcelas
  const fiados = [];
  const parcelas = [];
  const pagamentos = [];

  // Helper para criar fiado + parcelas
  const addFiadoWithInstallments = ({
    id, clienteId, descricao, valorTotal, dataCompra, parcelasData, status = 'ativo', obs = ''
  }) => {
    fiados.push({
      id,
      cliente_id: clienteId,
      descricao,
      valor_total: valorTotal,
      data_compra: dataCompra,
      data_vencimento: parcelasData[parcelasData.length - 1].dataVencimento,
      total_parcelas: parcelasData.length,
      intervalo_dias: 30,
      status,
      observacoes: obs,
      criado_em: new Date(dataCompra + 'T10:00:00').toISOString()
    });

    parcelasData.forEach((p, idx) => {
      parcelas.push({
        id: `parc_${id}_${idx + 1}`,
        fiado_id: id,
        cliente_id: clienteId,
        numero_parcela: idx + 1,
        total_parcelas: parcelasData.length,
        valor: p.valor,
        valor_pago: p.valorPago || 0,
        data_vencimento: p.dataVencimento,
        quitado_em: p.quitadoEm || null
      });
    });
  };

  // 1. Maria Clara - Fiado em 3x (R$ 360,00: 120 + 120 + 120)
  addFiadoWithInstallments({
    id: 'f_maria_1',
    clienteId: c1Id,
    descricao: 'Conjunto alfaiataria linho cru (Tamanho M)',
    valorTotal: 36000,
    dataCompra: addDaysToDateString(today, -15),
    parcelasData: [
      { valor: 12000, valorPago: 0, dataVencimento: addDaysToDateString(today, 15) },
      { valor: 12000, valorPago: 0, dataVencimento: addDaysToDateString(today, 45) },
      { valor: 12000, valorPago: 0, dataVencimento: addDaysToDateString(today, 75) }
    ]
  });

  // 2. Carlos Eduardo - 2 fiados atrasados
  addFiadoWithInstallments({
    id: 'f_carlos_1',
    clienteId: c2Id,
    descricao: 'Camisa social fio egípcio + Cinto de couro legítimo',
    valorTotal: 29000,
    dataCompra: addDaysToDateString(today, -44),
    parcelasData: [
      { valor: 29000, valorPago: 0, dataVencimento: addDaysToDateString(today, -14) } // Atrasado há 14 dias
    ],
    obs: 'Prometeu pagar no dia 10.'
  });

  addFiadoWithInstallments({
    id: 'f_carlos_2',
    clienteId: c2Id,
    descricao: 'Carteira slim couro café',
    valorTotal: 13000,
    dataCompra: addDaysToDateString(today, -35),
    parcelasData: [
      { valor: 13000, valorPago: 0, dataVencimento: addDaysToDateString(today, -5) } // Atrasado há 5 dias
    ]
  });

  // 3. Ana Paula - Vence HOJE (R$ 450,00 em 2x)
  addFiadoWithInstallments({
    id: 'f_ana_1',
    clienteId: c3Id,
    descricao: 'Vestido midi floral + Echarpe seda',
    valorTotal: 45000,
    dataCompra: addDaysToDateString(today, -30),
    parcelasData: [
      { valor: 22500, valorPago: 0, dataVencimento: today }, // Vence HOJE!
      { valor: 22500, valorPago: 0, dataVencimento: addDaysToDateString(today, 30) }
    ]
  });

  // 4. Roberto Mendes - Vence em 2 dias (R$ 280,00 à vista no fiado)
  addFiadoWithInstallments({
    id: 'f_roberto_1',
    clienteId: c4Id,
    descricao: 'Jaqueta jeans vintage destroyed',
    valorTotal: 28000,
    dataCompra: addDaysToDateString(today, -28),
    parcelasData: [
      { valor: 28000, valorPago: 0, dataVencimento: addDaysToDateString(today, 2) } // Vence em 2 dias!
    ]
  });

  // 5. Juliana Ferreira - R$ 400,00 em 2x (Já pagou a 1ª de R$ 200,00 via PIX)
  const fJulianaId = 'f_juliana_1';
  addFiadoWithInstallments({
    id: fJulianaId,
    clienteId: c5Id,
    descricao: 'Bolsa tiracolo transversal couro nude + Brincos',
    valorTotal: 40000,
    dataCompra: addDaysToDateString(today, -40),
    parcelasData: [
      { valor: 20000, valorPago: 20000, dataVencimento: addDaysToDateString(today, -10), quitadoEm: addDaysToDateString(today, -10) + 'T14:30:00' },
      { valor: 20000, valorPago: 0, dataVencimento: addDaysToDateString(today, 20) }
    ]
  });
  // Pagamento da Juliana registrado
  pagamentos.push({
    id: 'pag_juliana_1',
    cliente_id: c5Id,
    valor: 20000,
    forma_pagamento: 'pix',
    data_pagamento: addDaysToDateString(today, -10),
    observacao: 'Pagamento adiantado da 1ª parcela via chave PIX',
    alocacoes: [
      { parcela_id: `parc_${fJulianaId}_1`, fiado_id: fJulianaId, numero_parcela: 1, valor_abatido: 20000 }
    ],
    criado_em: new Date(addDaysToDateString(today, -10) + 'T14:30:00').toISOString()
  });

  // 6. Marcos Vinicius - Quitado (R$ 680,00 em 2x, 100% pago)
  const fMarcosId = 'f_marcos_1';
  addFiadoWithInstallments({
    id: fMarcosId,
    clienteId: c6Id,
    descricao: 'Terno completo slim fit chumbo + Camisa branca',
    valorTotal: 68000,
    dataCompra: addDaysToDateString(today, -70),
    parcelasData: [
      { valor: 34000, valorPago: 34000, dataVencimento: addDaysToDateString(today, -40), quitadoEm: addDaysToDateString(today, -40) + 'T16:00:00' },
      { valor: 34000, valorPago: 34000, dataVencimento: addDaysToDateString(today, -10), quitadoEm: addDaysToDateString(today, -11) + 'T11:20:00' }
    ]
  });
  pagamentos.push({
    id: 'pag_marcos_1',
    cliente_id: c6Id,
    valor: 34000,
    forma_pagamento: 'cartao',
    data_pagamento: addDaysToDateString(today, -40),
    observacao: '1ª parcela no débito',
    alocacoes: [
      { parcela_id: `parc_${fMarcosId}_1`, fiado_id: fMarcosId, numero_parcela: 1, valor_abatido: 34000 }
    ],
    criado_em: new Date(addDaysToDateString(today, -40) + 'T16:00:00').toISOString()
  });
  pagamentos.push({
    id: 'pag_marcos_2',
    cliente_id: c6Id,
    valor: 34000,
    forma_pagamento: 'dinheiro',
    data_pagamento: addDaysToDateString(today, -11),
    observacao: 'Quitação da 2ª parcela no balcão',
    alocacoes: [
      { parcela_id: `parc_${fMarcosId}_2`, fiado_id: fMarcosId, numero_parcela: 2, valor_abatido: 34000 }
    ],
    criado_em: new Date(addDaysToDateString(today, -11) + 'T11:20:00').toISOString()
  });

  // 8. Felipe Augusto - Atrasado crítico há 32 dias (R$ 380,00)
  addFiadoWithInstallments({
    id: 'f_felipe_1',
    clienteId: c8Id,
    descricao: 'Calça sarja bege + 2 Camisas polo',
    valorTotal: 38000,
    dataCompra: addDaysToDateString(today, -62),
    parcelasData: [
      { valor: 38000, valorPago: 0, dataVencimento: addDaysToDateString(today, -32) }
    ],
    obs: 'Telefone às vezes dá na caixa postal.'
  });

  // 9. Luciana Mendes - 1 compra antiga quitada + 1 compra recente ativa
  const fLucianaQuitadoId = 'f_luciana_antigo';
  addFiadoWithInstallments({
    id: fLucianaQuitadoId,
    clienteId: c9Id,
    descricao: 'Vestido envelope poá',
    valorTotal: 25000,
    dataCompra: addDaysToDateString(today, -60),
    parcelasData: [
      { valor: 25000, valorPago: 25000, dataVencimento: addDaysToDateString(today, -30), quitadoEm: addDaysToDateString(today, -30) + 'T10:00:00' }
    ]
  });
  pagamentos.push({
    id: 'pag_luciana_1',
    cliente_id: c9Id,
    valor: 25000,
    forma_pagamento: 'pix',
    data_pagamento: addDaysToDateString(today, -30),
    observacao: 'Transferência PIX',
    alocacoes: [
      { parcela_id: `parc_${fLucianaQuitadoId}_1`, fiado_id: fLucianaQuitadoId, numero_parcela: 1, valor_abatido: 25000 }
    ],
    criado_em: new Date(addDaysToDateString(today, -30) + 'T10:00:00').toISOString()
  });

  addFiadoWithInstallments({
    id: 'f_luciana_ativo',
    clienteId: c9Id,
    descricao: 'Cardigan de tricot canelado bege',
    valorTotal: 21000,
    dataCompra: addDaysToDateString(today, -5),
    parcelasData: [
      { valor: 21000, valorPago: 0, dataVencimento: addDaysToDateString(today, 25) }
    ]
  });

  return {
    version: 1,
    clientes,
    fiados,
    parcelas,
    pagamentos
  };
}

/**
 * Lê os dados do armazenamento local ou inicializa com semente
 */
function loadDatabase() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.version && Array.isArray(data.clientes)) {
        return data;
      }
    }
  } catch (err) {
    console.error('Erro ao ler do localStorage:', err);
  }

  const initial = createInitialSeedData();
  saveDatabase(initial);
  return initial;
}

/**
 * Persiste dados no localStorage
 */
function saveDatabase(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
  }
}

/**
 * Calcula status da parcela individualmente
 */
export function getParcelaStatus(parcela, fiadoStatus = 'ativo') {
  if (fiadoStatus === 'cancelado') return 'cancelado';
  if (parcela.valor_pago >= parcela.valor) return 'quitado';

  const diffDays = getDaysDiffFromToday(parcela.data_vencimento);
  if (diffDays < 0) return 'atrasado';
  if (diffDays === 0) return 'vence_hoje';
  if (diffDays <= 3) return 'vence_em_breve'; // amarelo
  if (parcela.valor_pago > 0) return 'parcialmente_pago';
  return 'em_aberto';
}

/**
 * Calcula status consolidado do cliente
 */
export function getClienteStatus(cliente, parcelasDoCliente, fiadosDoCliente) {
  const activeFiados = fiadosDoCliente.filter(f => f.status !== 'cancelado');
  if (activeFiados.length === 0) {
    return { status: 'sem_debitos', label: 'Sem débitos', color: 'slate', diasAtraso: 0 };
  }

  const activeParcelas = parcelasDoCliente.filter(p => {
    const parentFiado = fiadosDoCliente.find(f => f.id === p.fiado_id);
    return parentFiado && parentFiado.status !== 'cancelado';
  });

  const unpaidParcelas = activeParcelas.filter(p => p.valor_pago < p.valor);

  if (unpaidParcelas.length === 0) {
    return { status: 'quitado', label: 'Quitado', color: 'emerald', diasAtraso: 0 };
  }

  // Verifica atrasos
  let maxDiasAtraso = 0;
  let hasAtrasado = false;
  let hasVenceHoje = false;
  let hasVenceBreve = false;

  for (const p of unpaidParcelas) {
    const diff = getDaysDiffFromToday(p.data_vencimento);
    if (diff < 0) {
      hasAtrasado = true;
      const dias = Math.abs(diff);
      if (dias > maxDiasAtraso) maxDiasAtraso = dias;
    } else if (diff === 0) {
      hasVenceHoje = true;
    } else if (diff <= 3) {
      hasVenceBreve = true;
    }
  }

  if (hasAtrasado) {
    return { 
      status: 'atrasado', 
      label: `Atrasado (${maxDiasAtraso}d)`, 
      color: 'rose', 
      diasAtraso: maxDiasAtraso 
    };
  }

  if (hasVenceHoje) {
    return { status: 'vence_hoje', label: 'Vence hoje', color: 'amber', diasAtraso: 0 };
  }

  if (hasVenceBreve) {
    return { status: 'vence_em_breve', label: 'Vence em até 3d', color: 'amber', diasAtraso: 0 };
  }

  // Verifica se tem pagamentos parciais
  const hasPartial = unpaidParcelas.some(p => p.valor_pago > 0);
  if (hasPartial) {
    return { status: 'parcialmente_pago', label: 'Parcialmente pago', color: 'blue', diasAtraso: 0 };
  }

  return { status: 'em_aberto', label: 'Em aberto', color: 'blue', diasAtraso: 0 };
}

// ==========================================
// SERVIÇO PRINCIPAL (Isolado e modular)
// ==========================================
export const fiadoService = {
  /**
   * Reseta e restaura os dados de exemplo
   */
  async resetDemoData() {
    const fresh = createInitialSeedData();
    saveDatabase(fresh);
    return fresh;
  },

  /**
   * Retorna lista de clientes enriquecida com saldos e métricas
   */
  async getClientes() {
    const db = loadDatabase();
    
    return db.clientes.map(cliente => {
      const fiadosDoCliente = db.fiados.filter(f => f.cliente_id === cliente.id);
      const parcelasDoCliente = db.parcelas.filter(p => p.cliente_id === cliente.id);

      // Apenas fiados ativos contam para o saldo
      const activeParcelas = parcelasDoCliente.filter(p => {
        const parentFiado = fiadosDoCliente.find(f => f.id === p.fiado_id);
        return parentFiado && parentFiado.status !== 'cancelado';
      });

      const unpaidParcelas = activeParcelas.filter(p => p.valor_pago < p.valor);

      const saldoDevedor = unpaidParcelas.reduce((acc, p) => acc + (p.valor - p.valor_pago), 0);
      const totalJaPago = activeParcelas.reduce((acc, p) => acc + p.valor_pago, 0);
      
      const openFiados = activeFiadosCount(fiadosDoCliente, parcelasDoCliente);

      // Próximo vencimento: menor data_vencimento entre parcelas não pagas
      let proximoVencimento = null;
      if (unpaidParcelas.length > 0) {
        const sortedDue = [...unpaidParcelas].sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento));
        proximoVencimento = sortedDue[0].data_vencimento;
      }

      const statusInfo = getClienteStatus(cliente, parcelasDoCliente, fiadosDoCliente);

      return {
        ...cliente,
        saldo_devedor: saldoDevedor,
        total_pago: totalJaPago,
        quantidade_fiados_abertos: openFiados,
        proximo_vencimento: proximoVencimento,
        status: statusInfo.status,
        status_label: statusInfo.label,
        status_color: statusInfo.color,
        dias_atraso: statusInfo.diasAtraso,
        limite_disponivel: cliente.limite_credito ? Math.max(0, cliente.limite_credito - saldoDevedor) : null
      };
    });
  },

  /**
   * Retorna dados completos de um cliente específico
   */
  async getClienteById(id) {
    const db = loadDatabase();
    const cliente = db.clientes.find(c => c.id === id);
    if (!cliente) return null;

    const fiadosDoCliente = db.fiados.filter(f => f.cliente_id === id);
    const parcelasDoCliente = db.parcelas.filter(p => p.cliente_id === id);
    const pagamentosDoCliente = db.pagamentos.filter(p => p.cliente_id === id);

    // Enriquecer parcelas com status atual
    const parcelasEnriquecidas = parcelasDoCliente.map(p => {
      const parentFiado = fiadosDoCliente.find(f => f.id === p.fiado_id);
      const statusCalculado = getParcelaStatus(p, parentFiado ? parentFiado.status : 'ativo');
      const saldoRestante = Math.max(0, p.valor - p.valor_pago);
      const diasDiff = getDaysDiffFromToday(p.data_vencimento);

      return {
        ...p,
        status_calculado: statusCalculado,
        saldo_restante: saldoRestante,
        dias_diferenca: diasDiff,
        parent_descricao: parentFiado ? parentFiado.descricao : 'Compra'
      };
    });

    // Enriquecer fiados com parcelas
    const fiadosEnriquecidos = fiadosDoCliente.map(f => {
      const parcs = parcelasEnriquecidas.filter(p => p.fiado_id === f.id);
      const totalPagoFiado = parcs.reduce((acc, p) => acc + p.valor_pago, 0);
      const saldoDevedorFiado = f.status === 'cancelado' ? 0 : Math.max(0, f.valor_total - totalPagoFiado);

      let statusConsolidado = f.status;
      if (f.status !== 'cancelado') {
        if (saldoDevedorFiado === 0) statusConsolidado = 'quitado';
        else if (parcs.some(p => p.status_calculado === 'atrasado')) statusConsolidado = 'atrasado';
        else if (parcs.some(p => p.status_calculado === 'vence_hoje')) statusConsolidado = 'vence_hoje';
        else if (totalPagoFiado > 0) statusConsolidado = 'parcialmente_pago';
        else statusConsolidado = 'em_aberto';
      }

      return {
        ...f,
        total_pago: totalPagoFiado,
        saldo_devedor: saldoDevedorFiado,
        status_calculado: statusConsolidado,
        parcelas: parcs.sort((a, b) => a.numero_parcela - b.numero_parcela)
      };
    }).sort((a, b) => b.data_compra.localeCompare(a.data_compra));

    // Métricas
    const activeParcelas = parcelasEnriquecidas.filter(p => {
      const f = fiadosDoCliente.find(item => item.id === p.fiado_id);
      return f && f.status !== 'cancelado';
    });
    const unpaidParcelas = activeParcelas.filter(p => p.valor_pago < p.valor);
    const saldoDevedor = unpaidParcelas.reduce((acc, p) => acc + p.saldo_restante, 0);
    const totalPago = activeParcelas.reduce((acc, p) => acc + p.valor_pago, 0);
    const statusInfo = getClienteStatus(cliente, parcelasDoCliente, fiadosDoCliente);

    let proximoVencimento = null;
    if (unpaidParcelas.length > 0) {
      const sortedDue = [...unpaidParcelas].sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento));
      proximoVencimento = sortedDue[0].data_vencimento;
    }

    // Linha do tempo unificada (compras e pagamentos em ordem cronológica decrescente)
    const timeline = [];

    fiadosDoCliente.forEach(f => {
      timeline.push({
        tipo: 'compra',
        id: f.id,
        data: f.data_compra,
        dataHora: f.criado_em,
        titulo: `Compra a prazo: ${f.descricao}`,
        valor: f.valor_total,
        status: f.status,
        detalhes: `${f.total_parcelas} parcela(s)`,
        objeto: f
      });
    });

    pagamentosDoCliente.forEach(p => {
      timeline.push({
        tipo: 'pagamento',
        id: p.id,
        data: p.data_pagamento,
        dataHora: p.criado_em,
        titulo: `Pagamento recebido (${p.forma_pagamento.toUpperCase()})`,
        valor: p.valor,
        status: 'recebido',
        detalhes: p.observacao || 'Abatimento de parcelas',
        objeto: p
      });
    });

    timeline.sort((a, b) => {
      // Ordena decrescente por data e hora
      const dateA = a.dataHora || a.data;
      const dateB = b.dataHora || b.data;
      return dateB.localeCompare(dateA);
    });

    return {
      ...cliente,
      saldo_devedor: saldoDevedor,
      total_pago: totalPago,
      quantidade_fiados_abertos: fiadosEnriquecidos.filter(f => f.status !== 'cancelado' && f.saldo_devedor > 0).length,
      proximo_vencimento: proximoVencimento,
      status: statusInfo.status,
      status_label: statusInfo.label,
      status_color: statusInfo.color,
      dias_atraso: statusInfo.diasAtraso,
      limite_disponivel: cliente.limite_credito ? Math.max(0, cliente.limite_credito - saldoDevedor) : null,
      fiados: fiadosEnriquecidos,
      parcelas: parcelasEnriquecidas,
      pagamentos: pagamentosDoCliente.sort((a, b) => b.data_pagamento.localeCompare(a.data_pagamento)),
      timeline
    };
  },

  /**
   * Salva ou atualiza um cliente
   */
  async saveCliente(clienteData) {
    const db = loadDatabase();
    const now = new Date().toISOString();

    if (clienteData.id) {
      // Edição
      const idx = db.clientes.findIndex(c => c.id === clienteData.id);
      if (idx === -1) throw new Error('Cliente não encontrado.');

      const updated = {
        ...db.clientes[idx],
        nome: String(clienteData.nome).trim(),
        telefone: String(clienteData.telefone || '').trim(),
        limite_credito: clienteData.limite_credito ? parseInt(clienteData.limite_credito, 10) : null,
        observacoes: String(clienteData.observacoes || '').trim(),
        atualizado_em: now
      };

      db.clientes[idx] = updated;
      saveDatabase(db);
      return updated;
    } else {
      // Novo
      if (!clienteData.nome || !clienteData.nome.trim()) {
        throw new Error('O nome do cliente é obrigatório.');
      }

      const novo = {
        id: generateId(),
        nome: String(clienteData.nome).trim(),
        telefone: String(clienteData.telefone || '').trim(),
        limite_credito: clienteData.limite_credito ? parseInt(clienteData.limite_credito, 10) : null,
        observacoes: String(clienteData.observacoes || '').trim(),
        criado_em: now,
        atualizado_em: now
      };

      db.clientes.push(novo);
      saveDatabase(db);
      return novo;
    }
  },

  /**
   * Cria novo Fiado e gera as parcelas automaticamente
   */
  async createFiado({
    cliente_id,
    descricao,
    valor_total,
    data_compra,
    data_vencimento,
    total_parcelas = 1,
    intervalo_dias = 30,
    observacoes = ''
  }) {
    const db = loadDatabase();
    const cliente = db.clientes.find(c => c.id === cliente_id);
    if (!cliente) throw new Error('Cliente não encontrado.');

    if (!descricao || !descricao.trim()) throw new Error('A descrição da compra é obrigatória.');
    if (!valor_total || valor_total <= 0) throw new Error('O valor deve ser maior que zero.');
    if (!data_compra) throw new Error('A data da compra é obrigatória.');
    if (!data_vencimento) throw new Error('A data de vencimento é obrigatória.');

    if (data_vencimento < data_compra) {
      throw new Error('A data de vencimento não pode ser anterior à data da compra.');
    }

    const count = Math.max(1, parseInt(total_parcelas, 10) || 1);
    const interval = Math.max(1, parseInt(intervalo_dias, 10) || 30);
    const fiadoId = generateId();
    const now = new Date().toISOString();

    // Gera parcelas com centavos perfeitamente ajustados
    const parcelasCalculadas = generateInstallments(
      valor_total,
      count,
      data_compra,
      interval,
      data_vencimento
    );

    const novoFiado = {
      id: fiadoId,
      cliente_id,
      descricao: descricao.trim(),
      valor_total: parseInt(valor_total, 10),
      data_compra,
      data_vencimento: parcelasCalculadas[parcelasCalculadas.length - 1].data_vencimento,
      total_parcelas: count,
      intervalo_dias: interval,
      status: 'ativo',
      observacoes: String(observacoes || '').trim(),
      criado_em: now
    };

    const novasParcelas = parcelasCalculadas.map((p, idx) => ({
      id: generateId(),
      fiado_id: fiadoId,
      cliente_id,
      numero_parcela: p.numero,
      total_parcelas: p.total,
      valor: p.valor,
      valor_pago: 0,
      data_vencimento: p.data_vencimento,
      quitado_em: null
    }));

    db.fiados.push(novoFiado);
    db.parcelas.push(...novasParcelas);
    saveDatabase(db);

    return {
      fiado: novoFiado,
      parcelas: novasParcelas
    };
  },

  /**
   * Cancela fiado (Soft delete, mantém histórico)
   */
  async cancelFiado(fiadoId, motivo = '') {
    const db = loadDatabase();
    const fiado = db.fiados.find(f => f.id === fiadoId);
    if (!fiado) throw new Error('Fiado não encontrado.');

    fiado.status = 'cancelado';
    fiado.motivo_cancelamento = motivo;
    fiado.cancelado_em = new Date().toISOString();

    saveDatabase(db);
    return fiado;
  },

  /**
   * Registra pagamento amortizando primeiro as parcelas mais antigas (FIFO)
   * Validação: valor_pago <= saldo_devedor
   */
  async registrarPagamento({
    cliente_id,
    valor, // centavos
    forma_pagamento = 'dinheiro',
    data_pagamento,
    observacao = ''
  }) {
    const db = loadDatabase();
    const cliente = db.clientes.find(c => c.id === cliente_id);
    if (!cliente) throw new Error('Cliente não encontrado.');

    const valorCentavos = parseInt(valor, 10);
    if (isNaN(valorCentavos) || valorCentavos <= 0) {
      throw new Error('Informe um valor de pagamento válido.');
    }

    // Busca parcelas ativas com saldo em aberto do cliente
    const fiadosAtivosIds = new Set(
      db.fiados.filter(f => f.cliente_id === cliente_id && f.status !== 'cancelado').map(f => f.id)
    );

    const parcelasAbertas = db.parcelas
      .filter(p => p.cliente_id === cliente_id && fiadosAtivosIds.has(p.fiado_id) && p.valor_pago < p.valor)
      .sort((a, b) => {
        // FIFO: Ordena pela data de vencimento mais antiga, depois por número da parcela
        if (a.data_vencimento !== b.data_vencimento) {
          return a.data_vencimento.localeCompare(b.data_vencimento);
        }
        return a.numero_parcela - b.numero_parcela;
      });

    const saldoDevedorTotal = parcelasAbertas.reduce((acc, p) => acc + (p.valor - p.valor_pago), 0);

    if (valorCentavos > saldoDevedorTotal) {
      throw new Error(
        `O valor do pagamento (${centsToCurrency(valorCentavos)}) não pode ser superior ao saldo devedor atual (${centsToCurrency(saldoDevedorTotal)}).`
      );
    }

    const dataPagamentoFinal = data_pagamento || getTodayDateString();
    let restanteAAbater = valorCentavos;
    const alocacoes = [];

    for (const parcela of parcelasAbertas) {
      if (restanteAAbater <= 0) break;

      const dueInParcela = parcela.valor - parcela.valor_pago;
      const abatimento = Math.min(restanteAAbater, dueInParcela);

      parcela.valor_pago += abatimento;
      if (parcela.valor_pago >= parcela.valor) {
        parcela.quitado_em = dataPagamentoFinal + 'T' + new Date().toTimeString().split(' ')[0];
      }

      alocacoes.push({
        parcela_id: parcela.id,
        fiado_id: parcela.fiado_id,
        numero_parcela: parcela.numero_parcela,
        valor_abatido: abatimento
      });

      restanteAAbater -= abatimento;
    }

    const novoPagamento = {
      id: generateId(),
      cliente_id,
      valor: valorCentavos,
      forma_pagamento,
      data_pagamento: dataPagamentoFinal,
      observacao: String(observacao || '').trim(),
      alocacoes,
      criado_em: new Date().toISOString()
    };

    db.pagamentos.push(novoPagamento);
    saveDatabase(db);

    return {
      pagamento: novoPagamento,
      alocacoes
    };
  },

  /**
   * Calcula métricas do Dashboard
   */
  async getDashboardMetrics() {
    const db = loadDatabase();
    const today = getTodayDateString();

    const fiadosAtivosIds = new Set(
      db.fiados.filter(f => f.status !== 'cancelado').map(f => f.id)
    );

    // Parcelas ativas
    const activeParcelas = db.parcelas.filter(p => fiadosAtivosIds.has(p.fiado_id));
    const unpaidParcelas = activeParcelas.filter(p => p.valor_pago < p.valor);

    // 1. Total a receber
    const totalAReceber = unpaidParcelas.reduce((acc, p) => acc + (p.valor - p.valor_pago), 0);

    // 2. Total em atraso
    const parcelasAtrasadas = unpaidParcelas.filter(p => p.data_vencimento < today);
    const totalEmAtraso = parcelasAtrasadas.reduce((acc, p) => acc + (p.valor - p.valor_pago), 0);

    // 3. Recebido no mês corrente
    const currentYearMonth = today.slice(0, 7); // 'YYYY-MM'
    const pagamentosDoMes = db.pagamentos.filter(p => p.data_pagamento && p.data_pagamento.startsWith(currentYearMonth));
    const recebidoNoMes = pagamentosDoMes.reduce((acc, p) => acc + p.valor, 0);

    // 4. Número de clientes devedores (com saldo > 0)
    const clientesDevedoresSet = new Set(unpaidParcelas.map(p => p.cliente_id));
    const numeroClientesDevedores = clientesDevedoresSet.size;

    // Próximos vencimentos (próximos 15 dias ou até vencer, não atrasados)
    const clientesMap = new Map(db.clientes.map(c => [c.id, c]));
    const fiadosMap = new Map(db.fiados.map(f => [f.id, f]));

    const proximosVencimentos = unpaidParcelas
      .filter(p => p.data_vencimento >= today)
      .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))
      .slice(0, 8)
      .map(p => {
        const cliente = clientesMap.get(p.cliente_id);
        const fiado = fiadosMap.get(p.fiado_id);
        const diff = getDaysDiffFromToday(p.data_vencimento);
        return {
          ...p,
          cliente_nome: cliente ? cliente.nome : 'Cliente',
          cliente_telefone: cliente ? cliente.telefone : '',
          fiado_descricao: fiado ? fiado.descricao : 'Compra',
          saldo_restante: p.valor - p.valor_pago,
          dias_restantes: diff,
          is_hoje: diff === 0
        };
      });

    // Em atraso (ordenadas pelo maior atraso primeiro)
    const listaEmAtraso = parcelasAtrasadas
      .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))
      .slice(0, 8)
      .map(p => {
        const cliente = clientesMap.get(p.cliente_id);
        const fiado = fiadosMap.get(p.fiado_id);
        const diff = Math.abs(getDaysDiffFromToday(p.data_vencimento));
        return {
          ...p,
          cliente_nome: cliente ? cliente.nome : 'Cliente',
          cliente_telefone: cliente ? cliente.telefone : '',
          fiado_descricao: fiado ? fiado.descricao : 'Compra',
          saldo_restante: p.valor - p.valor_pago,
          dias_atraso: diff
        };
      });

    return {
      totalAReceber,
      totalEmAtraso,
      recebidoNoMes,
      numeroClientesDevedores,
      proximosVencimentos,
      listaEmAtraso
    };
  },

  /**
   * Calcula previsão de valores a vencer por semana (próximas 8 semanas)
   */
  async getWeeklyForecast(weeksCount = 8) {
    const db = loadDatabase();
    const today = getTodayDateString();

    const fiadosAtivosIds = new Set(
      db.fiados.filter(f => f.status !== 'cancelado').map(f => f.id)
    );

    const unpaidParcelas = db.parcelas.filter(
      p => fiadosAtivosIds.has(p.fiado_id) && p.valor_pago < p.valor
    );

    const weeks = [];
    const [ty, tm, td] = today.split('-').map(Number);
    const baseDate = new Date(ty, tm - 1, td);

    for (let w = 0; w < weeksCount; w++) {
      const start = new Date(baseDate);
      start.setDate(baseDate.getDate() + (w * 7));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

      // Parcelas que vencem nesta semana
      const parcelasSemana = unpaidParcelas.filter(
        p => p.data_vencimento >= startStr && p.data_vencimento <= endStr
      );

      const totalSemana = parcelasSemana.reduce((acc, p) => acc + (p.valor - p.valor_pago), 0);

      // Formatação do label da semana
      const startLabel = `${String(start.getDate()).padStart(2, '0')}/${String(start.getMonth() + 1).padStart(2, '0')}`;
      const endLabel = `${String(end.getDate()).padStart(2, '0')}/${String(end.getMonth() + 1).padStart(2, '0')}`;

      weeks.push({
        semanaIndex: w + 1,
        label: w === 0 ? 'Esta Semana' : `Semana ${w + 1}`,
        periodo: `${startLabel} a ${endLabel}`,
        dataInicio: startStr,
        dataFim: endStr,
        valorCentavos: totalSemana,
        quantidadeParcelas: parcelasSemana.length
      });
    }

    return weeks;
  },

  /**
   * Consulta analítica para Relatórios com filtros por período, cliente e status
   */
  async getRelatorio({ dataInicio = '', dataFim = '', clienteId = 'todos', status = 'todos' }) {
    const db = loadDatabase();
    const today = getTodayDateString();

    const clientesMap = new Map(db.clientes.map(c => [c.id, c]));
    const fiadosMap = new Map(db.fiados.map(f => [f.id, f]));

    let parcelas = db.parcelas.map(p => {
      const fiado = fiadosMap.get(p.fiado_id);
      const cliente = clientesMap.get(p.cliente_id);
      const fiadoStatus = fiado ? fiado.status : 'ativo';
      const statusCalc = getParcelaStatus(p, fiadoStatus);
      const saldoRestante = Math.max(0, p.valor - p.valor_pago);
      const diffDays = getDaysDiffFromToday(p.data_vencimento);

      return {
        ...p,
        cliente_nome: cliente ? cliente.nome : 'Cliente',
        cliente_telefone: cliente ? cliente.telefone : '',
        fiado_descricao: fiado ? fiado.descricao : 'Compra',
        fiado_data_compra: fiado ? fiado.data_compra : '',
        fiado_status: fiadoStatus,
        status_calculado: statusCalc,
        saldo_restante: saldoRestante,
        dias_diferenca: diffDays
      };
    });

    // Filtros
    if (clienteId && clienteId !== 'todos') {
      parcelas = parcelas.filter(p => p.cliente_id === clienteId);
    }

    if (dataInicio) {
      parcelas = parcelas.filter(p => p.data_vencimento >= dataInicio);
    }

    if (dataFim) {
      parcelas = parcelas.filter(p => p.data_vencimento <= dataFim);
    }

    if (status && status !== 'todos') {
      if (status === 'quitado') {
        parcelas = parcelas.filter(p => p.status_calculado === 'quitado');
      } else if (status === 'atrasado') {
        parcelas = parcelas.filter(p => p.status_calculado === 'atrasado');
      } else if (status === 'vence_hoje') {
        parcelas = parcelas.filter(p => p.status_calculado === 'vence_hoje');
      } else if (status === 'em_aberto') {
        parcelas = parcelas.filter(p => p.status_calculado === 'em_aberto' || p.status_calculado === 'vence_em_breve');
      } else if (status === 'parcialmente_pago') {
        parcelas = parcelas.filter(p => p.status_calculado === 'parcialmente_pago');
      } else if (status === 'pendentes') {
        parcelas = parcelas.filter(p => p.status_calculado !== 'quitado' && p.status_calculado !== 'cancelado');
      }
    }

    // Ordenação padrão: vencimento ascendente
    parcelas.sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento));

    // Resumo dos filtrados
    const totalOriginal = parcelas.reduce((acc, p) => acc + p.valor, 0);
    const totalPago = parcelas.reduce((acc, p) => acc + p.valor_pago, 0);
    const totalPendente = parcelas.reduce((acc, p) => acc + p.saldo_restante, 0);

    return {
      itens: parcelas,
      metricas: {
        totalOriginal,
        totalPago,
        totalPendente,
        quantidadeItens: parcelas.length
      }
    };
  }
};

function activeFiadosCount(fiados, parcelas) {
  return fiados.filter(f => {
    if (f.status === 'cancelado') return false;
    const parcs = parcelas.filter(p => p.fiado_id === f.id);
    return parcs.some(p => p.valor_pago < p.valor);
  }).length;
}
