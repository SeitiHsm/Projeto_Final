const SUPABASE_URL = "https://spfrgjhhisvwqvkdgfll.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2-oeiECzfEJe5iKRjmc9Aw_nAq7Pzbp";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const tituloOrcamento = document.getElementById("tituloOrcamento");
const descricaoOrcamento = document.getElementById("descricaoOrcamento");
const detalhesResumo = document.getElementById("detalhesResumo");
const conteudoItens = document.getElementById("conteudoItens");
const resumoTotal = document.getElementById("resumoTotal");
const btnImprimirPdf = document.getElementById("btnImprimirPdf");

function formatarMoeda(valor) {
  const numero = Number(valor || 0);
  return "R$ " + numero.toFixed(2).replace(".", ",");
}

function montarResumo(orcamento) {
  const detalhes = [
    { label: "Código", valor: orcamento.orcamentoid },
    { label: "Cliente", valor: orcamento.clientes?.nome_cliente || "—" },
    { label: "Data do orçamento", valor: orcamento.data_orcamento || "—" },
    { label: "Data de validade", valor: orcamento.data_validade || "—" },
    { label: "Valor total", valor: formatarMoeda(orcamento.valor_total) },
    { label: "Status", valor: "Em revisão" }
  ];

  detalhesResumo.innerHTML = detalhes
    .map(
      (item) => `
        <article class="detalhe-box">
          <div class="detalhe-label">${item.label}</div>
          <div class="detalhe-valor">${item.valor}</div>
        </article>
      `
    )
    .join("");

  tituloOrcamento.textContent = `Orçamento #${orcamento.orcamentoid}`;
  descricaoOrcamento.textContent = `Cliente: ${orcamento.clientes?.nome_cliente || "—"} • Valor total: ${formatarMoeda(orcamento.valor_total)}`;
}

function montarTabelaItens(itens) {
  if (!itens.length) {
    conteudoItens.innerHTML = "<p class='text-muted mb-0'>Nenhum item encontrado para este orçamento.</p>";
    resumoTotal.textContent = "Total: R$ 0,00";
    return;
  }

  const linhas = itens
    .map((item) => {
      const produto = item.produtos?.descricao || `Produto ${item.produtoid}`;
      const valorUnitario = formatarMoeda(item.valor_unitario);
      const valorTotalItem = formatarMoeda(item.valor_total_item);

      return `
        <tr>
          <td>${produto}</td>
          <td>${item.quantidade}</td>
          <td>${valorUnitario}</td>
          <td>${valorTotalItem}</td>
        </tr>
      `;
    })
    .join("");

  conteudoItens.innerHTML = `
    <table class="tabela-items">
      <thead>
        <tr>
          <th>Produto</th>
          <th>Quantidade</th>
          <th>Valor unitário</th>
          <th>Total do item</th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>
  `;

  const total = itens.reduce((soma, item) => soma + Number(item.valor_total_item || 0), 0);
  resumoTotal.textContent = `Total: ${formatarMoeda(total)}`;
}

async function carregarOrcamentoVisualizacao() {
  const orcamentoId = Number(sessionStorage.getItem("orcamentoSelecionado") || 0);

  if (!orcamentoId) {
    tituloOrcamento.textContent = "Orçamento não encontrado";
    descricaoOrcamento.textContent = "Selecione um orçamento na tela anterior para visualizar os detalhes.";
    detalhesResumo.innerHTML = "";
    conteudoItens.innerHTML = "";
    resumoTotal.textContent = "Total: R$ 0,00";
    return;
  }

  const { data: orcamento, error: erroOrcamento } = await supabaseClient
    .from("orcamentos")
    .select("*, clientes(nome_cliente)")
    .eq("orcamentoid", orcamentoId)
    .single();

  if (erroOrcamento || !orcamento) {
    tituloOrcamento.textContent = "Não foi possível carregar o orçamento";
    descricaoOrcamento.textContent = "Verifique o link ou tente novamente.";
    return;
  }

  const { data: itens, error: erroItens } = await supabaseClient
    .from("itens_orcamento")
    .select("*, produtos(descricao)")
    .eq("orcamentoid", orcamentoId)
    .order("produtoid", { ascending: true });

  if (erroItens) {
    conteudoItens.innerHTML = "<p class='text-danger mb-0'>Não foi possível carregar os itens do orçamento.</p>";
  }

  montarResumo(orcamento);
  montarTabelaItens(itens || []);
}

btnImprimirPdf?.addEventListener("click", () => {
  window.print();
});

carregarOrcamentoVisualizacao();
