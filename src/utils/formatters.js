// Utilitários de formatação e regras de cálculo para o módulo de Fiado

/**
 * Converte centavos (inteiro) para formato de moeda brasileira (R$ 1.250,50)
 * @param {number} cents 
 * @returns {string}
 */
export function centsToCurrency(cents) {
  if (cents === null || cents === undefined || isNaN(cents)) return 'R$ 0,00';
  const val = Number(cents) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
}

/**
 * Converte valor digitado (string ou float) em centavos inteiros
 * Ex: "150,50" -> 15050; 150.5 -> 15050; "1.250,90" -> 125090
 * @param {string|number} value 
 * @returns {number}
 */
export function currencyToCents(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') {
    return Math.round(value * 100);
  }
  
  // Limpa espaços
  let clean = String(value).trim();
  // Remove símbolos de moeda
  clean = clean.replace(/[R$\s]/g, '');
  
  // Trata formato brasileiro (1.250,50) ou internacional (1250.50)
  if (clean.includes(',') && clean.includes('.')) {
    // 1.250,50 -> 1250.50
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    // 150,50 -> 150.50
    clean = clean.replace(',', '.');
  }
  
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Formata data no formato dd/mm/aaaa
 * @param {string|Date} dateStr (YYYY-MM-DD ou ISO string)
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    // Se for string YYYY-MM-DD
    if (typeof dateStr === 'string' && dateStr.length === 10 && dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
}

/**
 * Formata data e hora no formato dd/mm/aaaa às HH:mm
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const dateFormatted = formatDate(d);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${dateFormatted} às ${hours}:${minutes}`;
  } catch {
    return '-';
  }
}

/**
 * Retorna data atual no formato YYYY-MM-DD (local)
 * @returns {string}
 */
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adiciona dias a uma data YYYY-MM-DD
 * @param {string} dateStr 
 * @param {number} days 
 * @returns {string} YYYY-MM-DD
 */
export function addDaysToDateString(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcula diferença em dias entre uma data e hoje
 * Positivo = dias restantes para vencer
 * Negativo = dias de atraso
 * Zero = vence hoje
 * @param {string} dateStr (YYYY-MM-DD)
 * @returns {number}
 */
export function getDaysDiffFromToday(dateStr) {
  if (!dateStr) return 0;
  const todayStr = getTodayDateString();
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const [dy, dm, dd] = dateStr.split('-').map(Number);
  
  const todayDate = new Date(ty, tm - 1, td);
  const targetDate = new Date(dy, dm - 1, dd);
  
  const diffTime = targetDate.getTime() - todayDate.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formata telefone brasileiro para (99) 99999-9999 ou (99) 9999-9999
 * @param {string} phone 
 * @returns {string}
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Valida formato do telefone brasileiro
 * @param {string} phone 
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone) return false;
  const digits = String(phone).replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
}

/**
 * Gera parcelas dividindo centavos e ajustando a diferença de centavos na ÚLTIMA parcela.
 * @param {number} totalCents - Valor total em centavos
 * @param {number} installmentsCount - Número de parcelas (ex: 3)
 * @param {string} startDateStr - Data base da compra (YYYY-MM-DD)
 * @param {number} intervalDays - Intervalo em dias (ex: 30)
 * @param {string} firstDueDateStr - Opcional: data de vencimento da primeira parcela
 * @returns {Array<{ numero: number, total: number, valor: number, data_vencimento: string }>}
 */
export function generateInstallments(totalCents, installmentsCount, startDateStr, intervalDays = 30, firstDueDateStr = null) {
  const count = Math.max(1, parseInt(installmentsCount, 10) || 1);
  const total = Math.max(0, parseInt(totalCents, 10) || 0);
  
  if (count === 1) {
    const due = firstDueDateStr || addDaysToDateString(startDateStr, intervalDays);
    return [{
      numero: 1,
      total: 1,
      valor: total,
      data_vencimento: due
    }];
  }
  
  const baseValue = Math.floor(total / count);
  const remainder = total - (baseValue * (count - 1));
  const result = [];
  
  for (let i = 1; i <= count; i++) {
    const isLast = i === count;
    const parcelaValor = isLast ? remainder : baseValue;
    
    let parcelaDueDate;
    if (i === 1 && firstDueDateStr) {
      parcelaDueDate = firstDueDateStr;
    } else {
      const daysToAdd = firstDueDateStr 
        ? getDaysDiffFromToday(firstDueDateStr) + ((i - 1) * intervalDays)
        : (i * intervalDays);
      parcelaDueDate = addDaysToDateString(startDateStr, daysToAdd);
    }
    
    result.push({
      numero: i,
      total: count,
      valor: parcelaValor,
      data_vencimento: parcelaDueDate
    });
  }
  
  return result;
}

/**
 * Constrói URL para cobrança no WhatsApp com texto amigável
 * "Olá, [nome]! Passando para lembrar do valor de R$ [saldo], com vencimento em [data]. Qualquer dúvida, estou à disposição."
 * @param {string} nome 
 * @param {string} telefone 
 * @param {number} saldoCentavos 
 * @param {string} proximoVencimento (YYYY-MM-DD)
 * @returns {string}
 */
export function buildWhatsAppLink(nome, telefone, saldoCentavos, proximoVencimento) {
  const cleanPhone = String(telefone || '').replace(/\D/g, '');
  if (!cleanPhone) return '#';
  
  const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const saldoFormatado = centsToCurrency(saldoCentavos);
  const dataFormatada = formatDate(proximoVencimento);
  
  const msg = `Olá, ${nome}! Passando para lembrar do valor de ${saldoFormatado}, com vencimento em ${dataFormatada}. Qualquer dúvida, estou à disposição.`;
  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
}
