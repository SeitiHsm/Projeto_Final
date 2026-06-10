const SUPABASE_URL = "https://spfrgjhhisvwqvkdgfll.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2-oeiECzfEJe5iKRjmc9Aw_nAq7Pzbp";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const formProduto = document.getElementById("formProduto");
const tabelaProdutos = document.getElementById("tabelaProdutos");
const mensagem = document.getElementById("mensagem");
const buscaProdutos = document.getElementById("buscaProdutos");

const produtoIdInput = document.getElementById("produtoId");
const categoriaIdInput = document.getElementById("categoriaId");
const descricaoProdutoInput = document.getElementById("descricaoProduto");
const observacaoProdutoInput = document.getElementById("observacaoProduto");
const valorVendaInput = document.getElementById("valorVenda");
const dataCadastroInput = document.getElementById("dataCadastro");
const statusProdutoInput = document.getElementById("statusProduto");

const btnSalvar = document.getElementById("btnSalvar");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

function filtrarProdutos() {
  if (!tabelaProdutos || !buscaProdutos) return;

  const termo = buscaProdutos.value.toLowerCase().trim();

  tabelaProdutos.querySelectorAll("tr").forEach((linha) => {
    const textoLinha = linha.textContent.toLowerCase();
    linha.style.display = textoLinha.includes(termo) ? "" : "none";
  });
}

function formatarStatus(status) {
  if (status === "A") return "Ativo";
  if (status === "I") return "Inativo";
  return "";
}

async function carregarCategorias() {
  const { data, error } = await supabaseClient
    .from("categorias")
    .select("categoriaid, descricao")
    .order("descricao");

  if (error) {
    mostrarMensagem(
      "Erro ao carregar categorias: " + error.message,
      "erro"
    );
    return;
  }

  categoriaIdInput.innerHTML =
    '<option value="">Selecione uma categoria</option>';

  data.forEach(function(categoria) {
    const option = document.createElement("option");

    option.value = categoria.categoriaid;
    option.textContent = categoria.descricao;

    categoriaIdInput.appendChild(option);
  });
}

async function carregarProdutos() {
  const { data, error } = await supabaseClient
    .from("produtos")
    .select(`
      produtoid,
      descricao,
      observacao,
      valor_venda,
      data_cadastro,
      status,
      categoriaid,
      categorias (
        descricao
      )
    `)
    .order("produtoid", { ascending: true });

  if (error) {
    tabelaProdutos.innerHTML = `
      <tr>
        <td colspan="8">Erro ao carregar produtos.</td>
      </tr>
    `;

    mostrarMensagem(
      "Erro ao buscar produtos: " + error.message,
      "erro"
    );

    return;
  }

  if (data.length === 0) {
    tabelaProdutos.innerHTML = `
      <tr>
        <td colspan="8">Nenhum produto cadastrado.</td>
      </tr>
    `;
    return;
  }

  tabelaProdutos.innerHTML = "";

  data.forEach(function(produto) {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${produto.produtoid}</td>
      <td>${produto.categorias?.descricao ?? ""}</td>
      <td>${produto.descricao}</td>
      <td>${produto.observacao ?? ""}</td>
      <td>R$ ${Number(produto.valor_venda).toFixed(2)}</td>
      <td>${produto.data_cadastro}</td>
      <td>${formatarStatus(produto.status)}</td>
      <td class="coluna-acoes"></td>
    `;

    const botaoEditar = document.createElement("button");

    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";

    botaoEditar.addEventListener("click", function() {
      prepararEdicao(produto);
    });

    const botaoExcluir = document.createElement("button");

    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";

    botaoExcluir.addEventListener("click", function() {
      excluirProduto(produto);
    });

    linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
    linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);

    tabelaProdutos.appendChild(linha);
  });
}

function prepararEdicao(produto) {
  produtoIdInput.value = produto.produtoid;
  categoriaIdInput.value = produto.categoriaid;
  descricaoProdutoInput.value = produto.descricao;
  observacaoProdutoInput.value = produto.observacao;
  valorVendaInput.value = produto.valor_venda;
  dataCadastroInput.value = produto.data_cadastro;
  statusProdutoInput.value = produto.status;

  btnSalvar.textContent = "Atualizar";
  btnCancelarEdicao.style.display = "inline-block";

  mostrarMensagem(
    "Editando o produto: " + produto.descricao,
    "sucesso"
  );
}

function cancelarEdicao() {
  formProduto.reset();

  produtoIdInput.value = "";

  btnSalvar.textContent = "Salvar";
  btnCancelarEdicao.style.display = "none";

  mensagem.textContent = "";
  mensagem.className = "mensagem";
}

async function salvarProduto() {
  const novoProduto = {
    categoriaid: categoriaIdInput.value,
    descricao: descricaoProdutoInput.value,
    observacao: observacaoProdutoInput.value,
    valor_venda: valorVendaInput.value,
    data_cadastro: dataCadastroInput.value,
    status: statusProdutoInput.value
  };

  const { error } = await supabaseClient
    .from("produtos")
    .insert(novoProduto);

  if (error) {
    mostrarMensagem(
      "Erro ao salvar produto: " + error.message,
      "erro"
    );
    return;
  }

  mostrarMensagem(
    "Produto salvo com sucesso!",
    "sucesso"
  );

  formProduto.reset();

  carregarProdutos();
}

async function atualizarProduto() {
  const produtoId = produtoIdInput.value;

  const { error } = await supabaseClient
    .from("produtos")
    .update({
      categoriaid: categoriaIdInput.value,
      descricao: descricaoProdutoInput.value,
      observacao: observacaoProdutoInput.value,
      valor_venda: valorVendaInput.value,
      data_cadastro: dataCadastroInput.value,
      status: statusProdutoInput.value
    })
    .eq("produtoid", produtoId);

  if (error) {
    mostrarMensagem(
      "Erro ao atualizar produto: " + error.message,
      "erro"
    );
    return;
  }

  mostrarMensagem(
    "Produto atualizado com sucesso!",
    "sucesso"
  );

  cancelarEdicao();
  carregarProdutos();
}

async function excluirProduto(produto) {
  const confirmou = confirm(
    "Tem certeza que deseja excluir o produto " +
      produto.descricao +
      "?"
  );

  if (!confirmou) {
    return;
  }

  const { error } = await supabaseClient
    .from("produtos")
    .delete()
    .eq("produtoid", produto.produtoid);

  if (error) {
    mostrarMensagem(
      "Erro ao excluir produto: " + error.message,
      "erro"
    );
    return;
  }

  if (produtoIdInput.value == produto.produtoid) {
    cancelarEdicao();
  }

  mostrarMensagem(
    "Produto excluído com sucesso!",
    "sucesso"
  );

  carregarProdutos();
}

formProduto.addEventListener(
  "submit",
  async function(evento) {
    evento.preventDefault();

    const estaEditando =
      produtoIdInput.value !== "";

    if (estaEditando) {
      await atualizarProduto();
    } else {
      await salvarProduto();
    }
  }
);

btnCancelarEdicao.addEventListener(
  "click",
  function() {
    cancelarEdicao();
  }
);

if (buscaProdutos) {
  buscaProdutos.addEventListener("input", filtrarProdutos);
}

carregarCategorias();
carregarProdutos();