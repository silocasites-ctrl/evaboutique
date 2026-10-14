import { Database } from "bun:sqlite";

// Cria ou abre o banco de dados na pasta atual
export const db = new Database("database.sqlite", { create: true });

export function initDatabase() {
  // Configurações para maior performance e integridade
  db.run("PRAGMA journal_mode = WAL;");
  db.run("PRAGMA foreign_keys = ON;");

  // Tabela: Produto
  db.run(`
    CREATE TABLE IF NOT EXISTS Produto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      preco REAL NOT NULL CHECK(preco > 0),
      quantidade_estoque INTEGER NOT NULL CHECK(quantidade_estoque >= 0),
      ativo BOOLEAN NOT NULL DEFAULT 1,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Tabela: Caixa
  db.run(`
    CREATE TABLE IF NOT EXISTS Caixa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
      valor_abertura REAL NOT NULL,
      data_fechamento DATETIME,
      valor_fechamento_informado REAL,
      total_vendido_dinheiro REAL DEFAULT 0,
      total_vendido_pix REAL DEFAULT 0,
      total_vendido_cartao REAL DEFAULT 0,
      total_geral REAL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('aberto', 'fechado')) DEFAULT 'aberto'
    );
  `);

  // Tabela: Venda
  db.run(`
    CREATE TABLE IF NOT EXISTS Venda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      subtotal REAL NOT NULL,
      desconto_tipo TEXT NOT NULL CHECK(desconto_tipo IN ('percentual', 'valor_fixo', 'nenhum')),
      desconto_valor REAL DEFAULT 0,
      total REAL NOT NULL,
      forma_pagamento TEXT NOT NULL CHECK(forma_pagamento IN ('dinheiro', 'pix', 'cartao')),
      caixa_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('concluida', 'cancelada')) DEFAULT 'concluida',
      FOREIGN KEY (caixa_id) REFERENCES Caixa(id)
    );
  `);

  // Tabela: ItemVenda
  db.run(`
    CREATE TABLE IF NOT EXISTS ItemVenda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venda_id INTEGER NOT NULL,
      produto_id INTEGER NOT NULL,
      nome_produto TEXT NOT NULL,
      quantidade INTEGER NOT NULL CHECK(quantidade > 0),
      preco_unitario REAL NOT NULL,
      subtotal_item REAL NOT NULL,
      FOREIGN KEY (venda_id) REFERENCES Venda(id),
      FOREIGN KEY (produto_id) REFERENCES Produto(id)
    );
  `);

  console.log("Banco de dados inicializado com sucesso.");
}
