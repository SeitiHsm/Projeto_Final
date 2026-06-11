const SUPABASE_URL = "https://spfrgjhhisvwqvkdgfll.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2-oeiECzfEJe5iKRjmc9Aw_nAq7Pzbp";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

console.log("Supabase conectado");
console.log(supabaseClient);

const formCategoria = document.getElementById("formCategoria");
const tabelaCategorias = document.getElementById("tabelaCategorias");
const mensagem = document.getElementById("mensagem");

const categoriaIdInput = document.getElementById("categoriaId");
const descricaoCategoriaInput = document.getElementById("descricaoCategoria");

const btnSalvar = document.getElementById("btnSalvar");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
const barraPesquisaCategoria = document.getElementById("barraPesquisaCategoria");
const btnPesquisarCategoria = document.getElementById("btnPesquisarCategoria");
const btnLimparPesquisaCategoria = document.getElementById("btnLimparPesquisaCategoria");

let categoriasCache = [];

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

function normalizarChave(texto) {
  return normalizarTexto(texto)
    .replace(/[^a-z0-9]/g, "");
}

function categoriaJaExiste(descricao, categoriaIdIgnorada = null) {
  const termo = normalizarChave(descricao);

  return categoriasCache.some(function(categoria) {
    return (
      categoria.categoriaid !== categoriaIdIgnorada &&
      normalizarChave(categoria.descricao) === termo
    );
  });
}

function renderizarCategorias(lista) {
  tabelaCategorias.innerHTML = "";

  if (lista.length === 0) {
    tabelaCategorias.innerHTML = `
      <tr>
        <td colspan="3">Nenhuma categoria encontrada.</td>
      </tr>
    `;
    return;
  }

  lista.forEach(function(categoria) {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${categoria.categoriaid}</td>
      <td>${categoria.descricao}</td>
      <td class="coluna-acoes"></td>
    `;

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", function() {
      prepararEdicao(categoria);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", function() {
      excluirCategoria(categoria);
    });

    linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
    linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);

    tabelaCategorias.appendChild(linha);
  });
}

function aplicarFiltroCategorias() {
  const termo = normalizarTexto(barraPesquisaCategoria?.value || "");

  if (!termo) {
    renderizarCategorias(categoriasCache);
    return;
  }

  const filtradas = categoriasCache.filter(function(categoria) {
    return [categoria.categoriaid, categoria.descricao].some(function(valor) {
      return normalizarTexto(valor).includes(termo);
    });
  });

  renderizarCategorias(filtradas);
}

async function carregarCategorias() {
  const { data, error } = await supabaseClient
    .from("categorias")
    .select("categoriaid, descricao")
    .order("categoriaid", { ascending: true });

  if (error) {
    tabelaCategorias.innerHTML = `
      <tr>
        <td colspan="3">Erro ao carregar categoria.</td>
      </tr>
    `;

    mostrarMensagem("Erro ao buscar categoria: " + error.message, "erro");
    return;
  }

  categoriasCache = data || [];

  if (categoriasCache.length === 0) {
    tabelaCategorias.innerHTML = `
      <tr>
        <td colspan="3">Nenhuma categoria cadastrada.</td>
      </tr>
    `;
    return;
  }

  renderizarCategorias(categoriasCache);
}

function prepararEdicao(categoria) {

  categoriaIdInput.value = categoria.categoriaid;

  descricaoCategoriaInput.value = categoria.descricao;

  categoriaIdInput.disabled = false;
  descricaoCategoriaInput.readOnly = false;

  btnSalvar.textContent = "Atualizar";

  btnCancelarEdicao.style.display = "inline-block";

  mostrarMensagem("Editando a categoria: " + categoria.descricao, "sucesso");
}

function cancelarEdicao() {

  formCategoria.reset();

  categoriaIdInput.value = "";

  categoriaIdInput.disabled = false;
  descricaoCategoriaInput.readOnly = false;

  btnSalvar.textContent = "Salvar";

  btnCancelarEdicao.style.display = "none";

  mensagem.textContent = "";
  mensagem.className = "mensagem";
}

async function salvarCategoria() {
  const descricaoCategoria = descricaoCategoriaInput.value.trim();

  if (!descricaoCategoria) {
    mostrarMensagem("Informe a descrição da categoria.", "erro");
    return;
  }

  if (categoriaJaExiste(descricaoCategoria)) {
    mostrarMensagem("Já existe uma categoria com essa descrição.", "erro");
    return;
  }


  const novaCategoria = {
    descricao: descricaoCategoria
  };

  const { error } = await supabaseClient
    .from("categorias")
    .insert(novaCategoria);

  if (error) {
    mostrarMensagem("Erro ao salvar categoria: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Categoria salva com sucesso!", "sucesso");

  formCategoria.reset();

  carregarCategorias();
}

async function atualizarDescricaoCategoria() {
  const categoriaId = categoriaIdInput.value;
  const descricaoCategoria = descricaoCategoriaInput.value.trim();

  if (!descricaoCategoria) {
    mostrarMensagem("Informe a descrição da categoria.", "erro");
    return;
  }

  if (categoriaJaExiste(descricaoCategoria, Number(categoriaId))) {
    mostrarMensagem("Já existe uma categoria com essa descrição.", "erro");
    return;
  }

  const { error } = await supabaseClient
    .from("categorias")
    .update({
      descricao: descricaoCategoria
    })
    .eq("categoriaid", categoriaId);

  if (error) {
    mostrarMensagem("Erro ao atualizar categoria: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Descrição atualizada com sucesso!", "sucesso");

  cancelarEdicao();

  carregarCategorias();
}

async function excluirCategoria(categoria) {
  const confirmou = confirm(
    "Tem certeza que deseja excluir a categoria " + categoria.descricao + "?"
  );

  if (!confirmou) {
    return;
  }

  const { error } = await supabaseClient
    .from("categorias")
    .delete()
    .eq("categoriaid", categoria.categoriaid);

  if (error) {
    mostrarMensagem("Erro ao excluir categoria: " + error.message, "erro");
    return;
  }

  if (categoriaIdInput.value == categoria.categoriaid) {
    cancelarEdicao();
  }

  mostrarMensagem("Categoria excluída com sucesso!", "sucesso");

  carregarCategorias();
}

formCategoria.addEventListener("submit", async function(evento) {
  
  evento.preventDefault();

  const estaEditando = categoriaIdInput.value !== "";

  if (estaEditando) {
    await atualizarDescricaoCategoria();
  } else {
    await salvarCategoria();
  }
});

btnCancelarEdicao.addEventListener("click", function() {
  cancelarEdicao();
});

if (btnPesquisarCategoria) {
  btnPesquisarCategoria.addEventListener("click", aplicarFiltroCategorias);
}

if (btnLimparPesquisaCategoria) {
  btnLimparPesquisaCategoria.addEventListener("click", function() {
    barraPesquisaCategoria.value = "";
    aplicarFiltroCategorias();
  });
}

if (barraPesquisaCategoria) {
  barraPesquisaCategoria.addEventListener("keydown", function(evento) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      aplicarFiltroCategorias();
    }
  });
}

carregarCategorias();
