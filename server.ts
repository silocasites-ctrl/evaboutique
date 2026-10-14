import { serve, file } from "bun";
import { join } from "path";
import { initDatabase, db } from "./database";

// Inicializa o banco de dados
initDatabase();

// Utilitário para enviar respostas JSON
const json = (data: any, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json" }
});

const server = serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;

    // ----- API ROUTES -----
    if (url.pathname.startsWith("/api/")) {
      try {
        // --- PRODUTOS ---
        if (url.pathname === "/api/produtos") {
          if (method === "GET") {
            const ativos = url.searchParams.get("ativos");
            let query = "SELECT * FROM Produto ORDER BY nome";
            if (ativos === "true") {
              query = "SELECT * FROM Produto WHERE ativo = 1 ORDER BY nome";
            }
            return json(db.query(query).all());
          }
          if (method === "POST") {
            const body = await req.json();
            const { nome, categoria, preco, quantidade_estoque } = body;
            const insert = db.prepare("INSERT INTO Produto (nome, categoria, preco, quantidade_estoque) VALUES (?, ?, ?, ?) RETURNING *");
            const prod = insert.get(nome, categoria, preco, quantidade_estoque);
            return json(prod, 201);
          }
        }
        
        const prodMatch = url.pathname.match(/^\/api\/produtos\/(\d+)$/);
        if (prodMatch && method === "PUT") {
          const id = prodMatch[1];
          const body = await req.json();
          const update = db.prepare("UPDATE Produto SET nome = ?, categoria = ?, preco = ?, quantidade_estoque = ?, ativo = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ? RETURNING *");
          const prod = update.get(body.nome, body.categoria, body.preco, body.quantidade_estoque, body.ativo, id);
          return json(prod);
        }

        // --- CAIXA ---
        if (url.pathname === "/api/caixa/status" && method === "GET") {
          const caixa = db.query("SELECT * FROM Caixa WHERE status = 'aberto' ORDER BY id DESC LIMIT 1").get();
          return json(caixa || null);
        }
        
        if (url.pathname === "/api/caixa/abrir" && method === "POST") {
          const { valor_abertura } = await req.json();
          const aberto = db.query("SELECT id FROM Caixa WHERE status = 'aberto'").get();
          if (aberto) return json({ error: "Já existe um caixa aberto." }, 400);
          
          const insert = db.prepare("INSERT INTO Caixa (valor_abertura) VALUES (?) RETURNING *");
          return json(insert.get(valor_abertura), 201);
        }
        
        if (url.pathname === "/api/caixa/fechar" && method === "POST") {
          const { valor_fechamento_informado } = await req.json();
          const caixa: any = db.query("SELECT * FROM Caixa WHERE status = 'aberto' ORDER BY id DESC LIMIT 1").get();
          if (!caixa) return json({ error: "Nenhum caixa aberto encontrado." }, 400);
          
          const update = db.prepare(`
            UPDATE Caixa SET 
              status = 'fechado',
              data_fechamento = CURRENT_TIMESTAMP,
              valor_fechamento_informado = ?
            WHERE id = ? RETURNING *
          `);
          return json(update.get(valor_fechamento_informado, caixa.id));
        }

        // --- VENDAS ---
        if (url.pathname === "/api/vendas" && method === "POST") {
          const { subtotal, desconto_tipo, desconto_valor, total, forma_pagamento, itens } = await req.json();
          const caixa: any = db.query("SELECT id FROM Caixa WHERE status = 'aberto' ORDER BY id DESC LIMIT 1").get();
          if (!caixa) return json({ error: "Nenhum caixa aberto para realizar a venda." }, 400);

          let vendaRetorno = null;
          
          db.transaction(() => {
            // Insere venda
            const vendaInsert = db.prepare(`
              INSERT INTO Venda (subtotal, desconto_tipo, desconto_valor, total, forma_pagamento, caixa_id) 
              VALUES (?, ?, ?, ?, ?, ?) RETURNING id
            `);
            const vendaId = (vendaInsert.get(subtotal, desconto_tipo, desconto_valor, total, forma_pagamento, caixa.id) as any).id;
            
            // Insere itens e dá baixa no estoque
            const itemInsert = db.prepare(`
              INSERT INTO ItemVenda (venda_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal_item)
              VALUES (?, ?, ?, ?, ?, ?)
            `);
            const estoqueUpdate = db.prepare(`UPDATE Produto SET quantidade_estoque = quantidade_estoque - ? WHERE id = ?`);
            
            for (const item of itens) {
              itemInsert.run(vendaId, item.produto_id, item.nome_produto, item.quantidade, item.preco_unitario, item.subtotal_item);
              estoqueUpdate.run(item.quantidade, item.produto_id);
            }
            
            // Atualiza totais do caixa
            let campoCaixa = "";
            if (forma_pagamento === "dinheiro") campoCaixa = "total_vendido_dinheiro";
            else if (forma_pagamento === "pix") campoCaixa = "total_vendido_pix";
            else if (forma_pagamento === "cartao") campoCaixa = "total_vendido_cartao";
            
            if (campoCaixa) {
              db.run(`UPDATE Caixa SET ${campoCaixa} = ${campoCaixa} + ?, total_geral = total_geral + ? WHERE id = ?`, 
                [total, total, caixa.id]);
            }
            
            vendaRetorno = db.query("SELECT * FROM Venda WHERE id = ?").get(vendaId);
          })();
          
          return json(vendaRetorno, 201);
        }

        if (url.pathname === "/api/vendas" && method === "GET") {
          const vendas = db.query(`
            SELECT v.*, c.data_abertura as caixa_data 
            FROM Venda v 
            JOIN Caixa c ON v.caixa_id = c.id 
            ORDER BY v.data_hora DESC
          `).all();
          
          // Anexar itens
          for (let v of vendas as any[]) {
            v.itens = db.query("SELECT * FROM ItemVenda WHERE venda_id = ?").all(v.id);
          }
          return json(vendas);
        }
        
        const vendaCancelMatch = url.pathname.match(/^\/api\/vendas\/(\d+)\/cancelar$/);
        if (vendaCancelMatch && method === "POST") {
          const vendaId = vendaCancelMatch[1];
          const venda: any = db.query("SELECT * FROM Venda WHERE id = ?").get(vendaId);
          if (!venda) return json({ error: "Venda não encontrada" }, 404);
          if (venda.status === "cancelada") return json({ error: "Venda já está cancelada" }, 400);

          db.transaction(() => {
            // Estorna itens pro estoque
            const itens: any[] = db.query("SELECT * FROM ItemVenda WHERE venda_id = ?").all(vendaId);
            const estoqueUpdate = db.prepare(`UPDATE Produto SET quantidade_estoque = quantidade_estoque + ? WHERE id = ?`);
            for (const item of itens) {
              estoqueUpdate.run(item.quantidade, item.produto_id);
            }
            // Marca como cancelada
            db.run(`UPDATE Venda SET status = 'cancelada' WHERE id = ?`, [vendaId]);
            
            // Subtrai do caixa
            const caixaId = venda.caixa_id;
            const fp = venda.forma_pagamento;
            let campoCaixa = "";
            if (fp === "dinheiro") campoCaixa = "total_vendido_dinheiro";
            else if (fp === "pix") campoCaixa = "total_vendido_pix";
            else if (fp === "cartao") campoCaixa = "total_vendido_cartao";
            
            if (campoCaixa) {
              db.run(`UPDATE Caixa SET ${campoCaixa} = ${campoCaixa} - ?, total_geral = total_geral - ? WHERE id = ?`, 
                [venda.total, venda.total, caixaId]);
            }
          })();
          return json({ success: true });
        }

        return json({ error: "Not Found" }, 404);
      } catch (err: any) {
        console.error("API Error:", err);
        return json({ error: err.message }, 500);
      }
    }

    // ----- STATIC FILE SERVING (Vite Dist) -----
    // Em produção (executável), serve arquivos da pasta 'dist'
    // Em dev, isso pode não ser alcançado se usarmos o Vite dev server com proxy
    const staticDir = join(process.cwd(), "dist");
    let reqPath = url.pathname;
    if (reqPath === "/") reqPath = "/index.html";
    
    let filePath = join(staticDir, reqPath);
    let f = file(filePath);
    
    // Fallback pra SPA (React Router)
    if (!(await f.exists())) {
      filePath = join(staticDir, "index.html");
      f = file(filePath);
      if (!(await f.exists())) {
        return new Response("Not found (dist folder missing). Run 'bun run build' first.", { status: 404 });
      }
    }
    
    return new Response(f);
  },
});

console.log(`Backend server running at http://localhost:${server.port}`);

// Abre o navegador automaticamente
import { exec } from "child_process";
exec(`start http://localhost:${server.port}`);

