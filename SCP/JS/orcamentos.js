const SUPABASE_URL = "https://spfrgjhhisvwqvkdgfll.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2-oeiECzfEJe5iKRjmc9Aw_nAq7Pzbp";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const formOrcamento = document.getElementById("formOrcamento");

const orcamentoIdInput = document.getElementById("orcamentoId");
const clienteIdInput = document.getElementById("clienteId");
const dataOrcamentoInput = document.getElementById("dataOrcamento");
const dataValidadeInput = document.getElementById("dataValidade");

const tabelaItens = document.getElementById("tabelaItens");
const tabelaOrcamentos = document.getElementById("tabelaOrcamentos");

const valorTotalOrcamento = document.getElementById("valorTotalOrcamento");

const btnSalvarOrcamento = document.getElementById("btnSalvarOrcamento");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
const barraPesquisaOrcamento = document.getElementById("barraPesquisaOrcamento");
const btnPesquisarOrcamento = document.getElementById("btnPesquisarOrcamento");
const btnLimparPesquisaOrcamento = document.getElementById("btnLimparPesquisaOrcamento");

const mensagem = document.getElementById("mensagem");

let orcamentoEditando = null;
let orcamentosCache = [];

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

function normalizarTexto(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function renderizarOrcamentos(lista) {
  tabelaOrcamentos.innerHTML = "";

  if (lista.length === 0) {
    tabelaOrcamentos.innerHTML = `
      <tr>
        <td colspan="6">Nenhum orçamento encontrado.</td>
      </tr>
    `;
    return;
  }

  lista.forEach((o) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${o.orcamentoid}</td>
      <td>${o.clientes?.nome_cliente ?? ""}</td>
      <td>${o.data_orcamento}</td>
      <td>${o.data_validade}</td>
      <td>R$ ${Number(o.valor_total).toFixed(2)}</td>
      <td></td>
    `;

    const btnVisualizar = document.createElement("button");
    btnVisualizar.textContent = "Visualizar";
    btnVisualizar.className = "btn-visualizar";
    btnVisualizar.onclick = () => abrirVisualizacao(o);

    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";
    btnEditar.className = "btn-editar";
    btnEditar.onclick = () => prepararEdicao(o);

    const btnExcluir = document.createElement("button");
    btnExcluir.textContent = "Excluir";
    btnExcluir.className = "btn-excluir";
    btnExcluir.onclick = () => excluirOrcamento(o);

    tr.querySelector("td:last-child").appendChild(btnVisualizar);
    tr.querySelector("td:last-child").appendChild(btnEditar);
    tr.querySelector("td:last-child").appendChild(btnExcluir);

    tabelaOrcamentos.appendChild(tr);
  });
}

function aplicarFiltroOrcamentos() {
  const termo = normalizarTexto(barraPesquisaOrcamento?.value || "");

  if (!termo) {
    renderizarOrcamentos(orcamentosCache);
    return;
  }

  const filtrados = orcamentosCache.filter((orcamento) => {
    return [
      orcamento.orcamentoid,
      orcamento.clientes?.nome_cliente,
      orcamento.data_orcamento,
      orcamento.data_validade,
      Number(orcamento.valor_total).toFixed(2)
    ].some((valor) => normalizarTexto(valor).includes(termo));
  });

  renderizarOrcamentos(filtrados);
}

async function carregarClientes() {
  const { data, error } = await supabaseClient
    .from("clientes")
    .select("clienteid, nome_cliente")
    .order("nome_cliente");

  if (error) {
    mostrarMensagem("Erro ao carregar clientes", "erro");
    return;
  }

  clienteIdInput.innerHTML =
    '<option value="">Selecione um cliente</option>';

  data.forEach((c) => {
    const option = document.createElement("option");
    option.value = c.clienteid;
    option.textContent = c.nome_cliente;
    clienteIdInput.appendChild(option);
  });
}

let produtosCache = [];

async function carregarProdutos() {
  const { data, error } = await supabaseClient
    .from("produtos")
    .select("produtoid, descricao, valor_venda");

  if (error) {
    mostrarMensagem("Erro ao carregar produtos", "erro");
    return;
  }

  produtosCache = data;
}

function criarLinhaItem(produtoSelecionado = null) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>
      <select class="produto-item">
        <option value="">Selecione</option>
      </select>
    </td>

    <td class="descricao-item">-</td>

    <td>
      <input type="number" class="quantidade-item" min="1" value="1">
    </td>

    <td class="valor-unitario">R$ 0,00</td>

    <td class="valor-total-item">R$ 0,00</td>

    <td>
      <button type="button" class="btn-novo-item">+</button>
      <button type="button" class="btn-excluir">Remover</button>
    </td>
  `;

  const selectProduto = tr.querySelector(".produto-item");
  const qtdInput = tr.querySelector(".quantidade-item");

  produtosCache.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.produtoid;
    opt.textContent = p.descricao;
    selectProduto.appendChild(opt);
  });

  // eventos
  selectProduto.addEventListener("change", () => {
    atualizarLinhaItem(tr);
  });

  qtdInput.addEventListener("input", () => {
    atualizarLinhaItem(tr);
  });

  tr.querySelector(".btn-novo-item").addEventListener("click", () => {
    adicionarLinha();
  });

  tr.querySelector(".btn-excluir").addEventListener("click", () => {
    tr.remove();
    calcularTotalOrcamento();
  });

  tabelaItens.appendChild(tr);

  return tr;
}

function atualizarLinhaItem(tr) {
  const select = tr.querySelector(".produto-item");
  const qtd = tr.querySelector(".quantidade-item");

  const produto = produtosCache.find(
    (p) => p.produtoid == select.value
  );

  if (!produto) return;

  const valorUnit = Number(produto.valor_venda);
  const quantidade = Number(qtd.value);

  const total = valorUnit * quantidade;

  tr.querySelector(".descricao-item").textContent =
    produto.descricao;

  tr.querySelector(".valor-unitario").textContent =
    "R$ " + valorUnit.toFixed(2);

  tr.querySelector(".valor-total-item").textContent =
    "R$ " + total.toFixed(2);

  calcularTotalOrcamento();
}

function calcularTotalOrcamento() {
  let total = 0;

  document.querySelectorAll("#tabelaItens tr").forEach((tr) => {
    const valor = tr.querySelector(".valor-total-item");
    if (valor && valor.textContent.includes("R$")) {
      total += Number(valor.textContent.replace("R$", ""));
    }
  });

  valorTotalOrcamento.textContent =
    "R$ " + total.toFixed(2);
}

function adicionarLinha() {
  criarLinhaItem();
}

async function carregarOrcamentos() {
  const { data, error } = await supabaseClient
    .from("orcamentos")
    .select(`
      orcamentoid,
      clienteid,
      data_orcamento,
      data_validade,
      valor_total,
      clientes (
        nome_cliente
      )
    `)
    .order("orcamentoid");

  if (error) {
    tabelaOrcamentos.innerHTML =
      "<tr><td colspan='6'>Erro ao carregar</td></tr>";
    return;
  }

  orcamentosCache = data || [];

  renderizarOrcamentos(orcamentosCache);
}

async function salvarOrcamento() {
  const dados = {
    clienteid: clienteIdInput.value,
    data_orcamento: dataOrcamentoInput.value,
    data_validade: dataValidadeInput.value,
    valor_total: parseFloat(
      valorTotalOrcamento.textContent.replace("R$", "")
    )
  };

  let orcamentoId = orcamentoIdInput.value;

  if (!orcamentoEditando) {
    const { data, error } = await supabaseClient
      .from("orcamentos")
      .insert(dados)
      .select();

    if (error) {
      mostrarMensagem("Erro ao salvar orçamento", "erro");
      return;
    }

    orcamentoId = data[0].orcamentoid;
  }

  else {
    await supabaseClient
      .from("orcamentos")
      .update(dados)
      .eq("orcamentoid", orcamentoEditando);
  }

  if (orcamentoEditando) {
    await supabaseClient
      .from("itens_orcamento")
      .delete()
      .eq("orcamentoid", orcamentoEditando);
  }

  const linhas = document.querySelectorAll("#tabelaItens tr");

  for (const tr of linhas) {
    const produtoid = tr.querySelector(".produto-item").value;
    const quantidade = tr.querySelector(".quantidade-item").value;
    const valor_unitario = tr
      .querySelector(".valor-unitario")
      .textContent.replace("R$", "");

    const valor_total_item = tr
      .querySelector(".valor-total-item")
      .textContent.replace("R$", "");

    if (!produtoid) continue;

    await supabaseClient.from("itens_orcamento").insert({
      orcamentoid: orcamentoId,
      produtoid,
      quantidade,
      valor_unitario,
      valor_total_item
    });
  }

  mostrarMensagem("Orçamento salvo!", "sucesso");

  cancelarEdicao();
  carregarOrcamentos();
}

async function prepararEdicao(orcamento) {
  orcamentoEditando = orcamento.orcamentoid;

  orcamentoIdInput.value = orcamento.orcamentoid;
  clienteIdInput.value = orcamento.clienteid;
  dataOrcamentoInput.value = orcamento.data_orcamento;
  dataValidadeInput.value = orcamento.data_validade;

  tabelaItens.innerHTML = "";

  const { data } = await supabaseClient
    .from("itens_orcamento")
    .select("*")
    .eq("orcamentoid", orcamento.orcamentoid);

  if (data.length === 0) {
    criarLinhaItem();
  } else {
  
    data.forEach((item) => {
      const tr = criarLinhaItem();
      tr.querySelector(".produto-item").value = item.produtoid;
      tr.querySelector(".quantidade-item").value = item.quantidade;
      atualizarLinhaItem(tr);
    });
  }

  btnCancelarEdicao.style.display = "inline-block";
}

function cancelarEdicao() {
  orcamentoEditando = null;

  formOrcamento.reset();
  tabelaItens.innerHTML = "";
  criarLinhaItem();

  btnCancelarEdicao.style.display = "none";
  valorTotalOrcamento.textContent = "R$ 0,00";
}

function abrirVisualizacao(orcamento) {
  sessionStorage.setItem("orcamentoSelecionado", String(orcamento.orcamentoid));
  window.location.href = "visualizacao_orcamento.html";
}

async function excluirOrcamento(o) {
  if (!confirm("Excluir orçamento?")) return;

  await supabaseClient
    .from("itens_orcamento")
    .delete()
    .eq("orcamentoid", o.orcamentoid);

  await supabaseClient
    .from("orcamentos")
    .delete()
    .eq("orcamentoid", o.orcamentoid);

  carregarOrcamentos();
}

btnSalvarOrcamento.addEventListener("click", salvarOrcamento);
btnCancelarEdicao.addEventListener("click", cancelarEdicao);

if (btnPesquisarOrcamento) {
  btnPesquisarOrcamento.addEventListener("click", aplicarFiltroOrcamentos);
}

if (btnLimparPesquisaOrcamento) {
  btnLimparPesquisaOrcamento.addEventListener("click", function() {
    barraPesquisaOrcamento.value = "";
    aplicarFiltroOrcamentos();
  });
}

if (barraPesquisaOrcamento) {
  barraPesquisaOrcamento.addEventListener("keydown", function(evento) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      aplicarFiltroOrcamentos();
    }
  });
}

tabelaItens.innerHTML = "";
carregarClientes();
carregarProdutos().then(() => {
  criarLinhaItem();
});

carregarOrcamentos();