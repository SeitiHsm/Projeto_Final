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

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

async function carregarCategorias() {
  const { data, error } = await supabaseClient
    .from("categorias")
    .select("categoriaid, descricao")
    .order("categoriaid", { ascending: true });
  if (error) {
    tabelaCategorias.innerHTML = `
      <tr>
        <td colspan="2">Erro ao carregar categoria.</td>
      </tr>
    `;

    mostrarMensagem("Erro ao buscar categoria: " + error.message, "erro");
    return;
  }

  /*
    Se a consulta funcionar, mas não houver nenhuma categoria cadastrada,
    mostramos uma mensagem dizendo que não há registros.
  */
  if (data.length === 0) {
    tabelaCategorias.innerHTML = `
      <tr>
        <td colspan="2">Nenhuma categoria cadastrada.</td>
      </tr>
    `;
    return;
  }

  /*
    Limpamos o corpo da tabela antes de preencher.
    Isso evita duplicar linhas quando recarregamos os clientes.
  */
  tabelaCategorias.innerHTML = "";

  /*
    Percorremos a lista de categorias retornada pelo Supabase.

    Para cada categoria, criamos uma linha <tr>.
  */
  data.forEach(function(categoria) {
    const linha = document.createElement("tr");

    /*
      Criamos as colunas principais da linha.

      A última coluna recebe a classe "coluna-acoes".
      Nessa coluna colocaremos os botões Editar e Excluir.
    */
    linha.innerHTML = `
      <td>${categoria.categoriaid}</td>
      <td>${categoria.descricao}</td>
      <td class="coluna-acoes"></td>
    `;

    /*
      ============================================
      BOTÃO EDITAR
      ============================================
    */

    const botaoEditar = document.createElement("button");

    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";

    /*
      Quando clicar no botão Editar,
      chamamos a função prepararEdicao
      passando o cliente da linha atual.
    */
    botaoEditar.addEventListener("click", function() {
      prepararEdicao(categoria);
    });

    /*
      ============================================
      BOTÃO EXCLUIR
      ============================================
    */

    const botaoExcluir = document.createElement("button");

    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";

    /*
      Quando clicar no botão Excluir,
      chamamos a função excluirCliente
      passando o cliente da linha atual.
    */
    botaoExcluir.addEventListener("click", function() {
      excluirCategoria(categoria);
    });

    /*
      Adicionamos os botões dentro da coluna Ações.
    */
    linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
    linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);

    /*
      Adicionamos a linha pronta dentro do tbody da tabela.
    */
    tabelaCategorias.appendChild(linha);
  });
}

/*
  ============================================
  PREPARAR EDIÇÃO
  ============================================

  Essa função é chamada quando o usuário clica no botão Editar.

  Ela pega os dados da categoria selecionada e joga para dentro do formulário.
*/

function prepararEdicao(categoria) {
  /*
    Preenche o campo código.
    Esse campo é importante porque usaremos o ID para saber qual categoria atualizar.
  */
  categoriaIdInput.value = categoria.categoriaid;

  /*
    Preenche os demais campos com os dados da categoria.
  */
  descricaoCategoriaInput.value = categoria.descricao;

  /*
    Neste exemplo, vamos permitir editar apenas a descrição.

    Por isso:
    - bloqueamos o ID;

  */
  categoriaIdInput.disabled = false;
  descricaoCategoriaInput.readOnly = false;

  /*
    Mudamos o texto do botão principal para "Atualizar".
  */
  btnSalvar.textContent = "Atualizar";

  /*
    Mostramos o botão Cancelar edição.
  */
  btnCancelarEdicao.style.display = "inline-block";

  /*
    Mostramos uma mensagem informando que o usuário está editando.
  */
  mostrarMensagem("Editando a categoria: " + categoria.descricao, "sucesso");
}

/*
  ============================================
  CANCELAR EDIÇÃO
  ============================================

  Essa função limpa o formulário e volta para o modo de cadastro.
*/

function cancelarEdicao() {
  /*
    Limpa os campos do formulário.
  */
  formCategoria.reset();

  /*
    Garante que o ID fique vazio.
    Se o ID estiver vazio, o sistema entende que é um novo cadastro.
  */
  categoriaIdInput.value = "";

  /*
    Libera os campos que estavam bloqueados durante a edição.
  */
  categoriaIdInput.disabled = false;
  descricaoCategoriaInput.readOnly = false;

  /*
    Volta o botão principal para "Salvar".
  */
  btnSalvar.textContent = "Salvar";

  /*
    Esconde novamente o botão Cancelar edição.
  */
  btnCancelarEdicao.style.display = "none";

  /*
    Limpa a área de mensagem.
  */
  mensagem.textContent = "";
  mensagem.className = "mensagem";
}

/*
  ============================================
  SALVAR CATEGORIA
  ============================================

  Essa função cadastra uma nova categoria no Supabase.

  Ela será chamada quando o campo categoriaId estiver vazio.
*/

async function salvarCategoria() {
  /*
    Pegamos os valores digitados no formulário.
  */
  const descricaoCategoria = descricaoCategoriaInput.value;

  /*
    Montamos o objeto que será enviado para o Supabase.

    As propriedades precisam ter o mesmo nome das colunas da tabela.
  */
  const novaCategoria = {
    descricao: descricaoCategoria
  };

  /*
    Insere a nova categoria na tabela categoria.
  */
  const { error } = await supabaseClient
    .from("categorias")
    .insert(novaCategoria);

  /*
    Se houver erro, mostramos a mensagem e paramos a função.
  */
  if (error) {
    mostrarMensagem("Erro ao salvar categoria: " + error.message, "erro");
    return;
  }

  /*
    Se deu certo, mostramos mensagem de sucesso.
  */
  mostrarMensagem("Categoria salva com sucesso!", "sucesso");

  /*
    Limpamos o formulário.
  */
  formCategoria.reset();

  /*
    Recarregamos a listagem para mostrar a nova categoria na tabela.
  */
  carregarCategorias();
}

/*
  ============================================
  ATUALIZAR DESCRIÇÃO DA CATEGORIA
  ============================================

  Essa função atualiza apenas a descrição da categoria.

  Ela será chamada quando o campo categoriaId estiver preenchido.
*/

async function atualizarDescricaoCategoria() {
  /*
    Pegamos o ID da categoria que está sendo editada.
  */
  const categoriaId = categoriaIdInput.value;

  /*
    Pegamos a nova descrição digitada.
  */
  const descricaoCategoria = descricaoCategoriaInput.value;

  /*
    Atualizamos somente a coluna descricao.

    O filtro .eq("categoriaid", categoriaId) é essencial.
    Ele informa qual registro será atualizado.
  */
  const { error } = await supabaseClient
    .from("categorias")
    .update({
      descricao: descricaoCategoria
    })
    .eq("categoriaid", categoriaId);

  /*
    Se houver erro, mostramos a mensagem e paramos.
  */
  if (error) {
    mostrarMensagem("Erro ao atualizar categoria: " + error.message, "erro");
    return;
  }

  /*
    Se deu certo, mostramos mensagem de sucesso.
  */
  mostrarMensagem("Descrição atualizada com sucesso!", "sucesso");

  /*
    Saímos do modo edição.
  */
  cancelarEdicao();

  /*
    Recarregamos a tabela para mostrar a descrição atualizada.
  */
  carregarCategorias();
}

/*
  ============================================
  EXCLUIR CATEGORIA
  ============================================

  Essa função exclui uma categoria do Supabase.

  Ela recebe o objeto categoria inteiro para poder usar:
  - categoria.categoriaid
  - categoria.descricao
*/

async function excluirCategoria(categoria) {
  /*
    Antes de excluir, pedimos confirmação.

    O confirm retorna:
    - true se o usuário clicar em OK;
    - false se o usuário clicar em Cancelar.
  */
  const confirmou = confirm(
    "Tem certeza que deseja excluir a categoria " + categoria.descricao + "?"
  );

  /*
    Se o usuário cancelar, paramos a função.
  */
  if (!confirmou) {
    return;
  }

  /*
    Executa o DELETE na tabela categoria.

    O filtro .eq("categoriaid", categoria.categoriaid) garante que apenas
    a categoria selecionada será excluída.
  */
  const { error } = await supabaseClient
    .from("categorias")
    .delete()
    .eq("categoriaid", categoria.categoriaid);

  /*
    Se houver erro, mostramos uma mensagem.
  */
  if (error) {
    mostrarMensagem("Erro ao excluir categoria: " + error.message, "erro");
    return;
  }

  /*
    Se a categoria excluída era a mesma que estava sendo editada,
    cancelamos a edição para limpar o formulário.
  */
  if (categoriaIdInput.value == categoria.categoriaid) {
    cancelarEdicao();
  }

  /*
    Mostra mensagem de sucesso.
  */
  mostrarMensagem("Categoria excluída com sucesso!", "sucesso");

  /*
    Recarrega a tabela para remover visualmente a categoria excluída.
  */
  carregarCategorias();
}

/*
  ============================================
  EVENTO DE ENVIO DO FORMULÁRIO
  ============================================

  Este evento acontece quando o usuário clica em Salvar ou Atualizar.
*/

formCategoria.addEventListener("submit", async function(evento) {
  /*
    Impede a página de recarregar ao enviar o formulário.
  */
  evento.preventDefault();

  /*
    Verificamos se o campo categoriaId está preenchido.

    Se estiver vazio:
    - é um cadastro novo.

    Se estiver preenchido:
    - é uma edição.
  */
  const estaEditando = categoriaIdInput.value !== "";

  if (estaEditando) {
    await atualizarDescricaoCategoria();
  } else {
    await salvarCategoria();
  }
});

/*
  ============================================
  EVENTO DO BOTÃO CANCELAR EDIÇÃO
  ============================================

  Quando o usuário clicar em "Cancelar edição",
  chamamos a função cancelarEdicao.
*/

btnCancelarEdicao.addEventListener("click", function() {
  cancelarEdicao();
});

/*
  ============================================
  CARREGAMENTO INICIAL DA PÁGINA
  ============================================

  Assim que o arquivo JavaScript é carregado,
  buscamos as categorias no Supabase.
*/

carregarCategorias();
