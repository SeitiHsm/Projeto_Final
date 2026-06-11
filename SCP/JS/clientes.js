const SUPABASE_URL = "https://spfrgjhhisvwqvkdgfll.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2-oeiECzfEJe5iKRjmc9Aw_nAq7Pzbp";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const formCliente = document.getElementById("formCliente");
const tabelaClientes = document.getElementById("tabelaClientes");
const mensagem = document.getElementById("mensagem");

const clienteIdInput = document.getElementById("clienteId");
const tipoClienteInput = document.getElementById("tipoCliente");
const cpfCnpjClienteInput = document.getElementById("cpfCnpjCliente");
const nomeClienteInput = document.getElementById("nomeCliente");

const btnSalvar = document.getElementById("btnSalvar");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
const barraPesquisaCliente = document.getElementById("barraPesquisaCliente");
const btnPesquisarCliente = document.getElementById("btnPesquisarCliente");
const btnLimparPesquisaCliente = document.getElementById("btnLimparPesquisaCliente");

let clientesCache = [];

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

function clienteJaExiste(cpfCnpjCliente, clienteIdIgnorado = null) {
  const termo = normalizarChave(cpfCnpjCliente);

  return clientesCache.some(function(cliente) {
    return (
      cliente.clienteid !== clienteIdIgnorado &&
      normalizarChave(cliente.cpf_cnpj_cliente) === termo
    );
  });
}

function renderizarClientes(lista) {
  tabelaClientes.innerHTML = "";

  if (lista.length === 0) {
    tabelaClientes.innerHTML = `
      <tr>
        <td colspan="5">Nenhum cliente encontrado.</td>
      </tr>
    `;
    return;
  }

  lista.forEach(function(cliente) {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${cliente.clienteid}</td>
      <td>${formatarTipoCliente(cliente.tipo_cliente)}</td>
      <td>${cliente.cpf_cnpj_cliente}</td>
      <td>${cliente.nome_cliente}</td>
      <td class="coluna-acoes"></td>
    `;

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", function() {
      prepararEdicao(cliente);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", function() {
      excluirCliente(cliente);
    });

    linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
    linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);

    tabelaClientes.appendChild(linha);
  });
}

function aplicarFiltroClientes() {
  const termo = normalizarTexto(barraPesquisaCliente?.value || "");

  if (!termo) {
    renderizarClientes(clientesCache);
    return;
  }

  const filtrados = clientesCache.filter(function(cliente) {
    return [
      cliente.clienteid,
      formatarTipoCliente(cliente.tipo_cliente),
      cliente.cpf_cnpj_cliente,
      cliente.nome_cliente
    ].some(function(valor) {
      return normalizarTexto(valor).includes(termo);
    });
  });

  renderizarClientes(filtrados);
}

function formatarTipoCliente(tipoCliente) {
  if (tipoCliente === "F") {
    return "Pessoa Física";
  }

  if (tipoCliente === "J") {
    return "Pessoa Jurídica";
  }

  return "Não informado";
}

async function carregarClientes() {

  const { data, error } = await supabaseClient
    .from("clientes")
    .select("clienteid, tipo_cliente, cpf_cnpj_cliente, nome_cliente")
    .order("clienteid", { ascending: true });

  if (error) {
    tabelaClientes.innerHTML = `
      <tr>
        <td colspan="5">Erro ao carregar clientes.</td>
      </tr>
    `;

    mostrarMensagem("Erro ao buscar clientes: " + error.message, "erro");
    return;
  }

  clientesCache = data || [];

  if (clientesCache.length === 0) {
    tabelaClientes.innerHTML = `
      <tr>
        <td colspan="5">Nenhum cliente cadastrado.</td>
      </tr>
    `;
    return;
  }

  renderizarClientes(clientesCache);
}

function prepararEdicao(cliente) {

  clienteIdInput.value = cliente.clienteid;

  tipoClienteInput.value = cliente.tipo_cliente;
  cpfCnpjClienteInput.value = cliente.cpf_cnpj_cliente;
  nomeClienteInput.value = cliente.nome_cliente;

  tipoClienteInput.disabled = true;
  cpfCnpjClienteInput.readOnly = true;

  btnSalvar.textContent = "Atualizar";

  btnCancelarEdicao.style.display = "inline-block";

  mostrarMensagem("Editando o cliente: " + cliente.nome_cliente, "sucesso");
}

function cancelarEdicao() {

  formCliente.reset();

  clienteIdInput.value = "";

  tipoClienteInput.disabled = false;
  cpfCnpjClienteInput.readOnly = false;

  btnSalvar.textContent = "Salvar";

  btnCancelarEdicao.style.display = "none";

  mensagem.textContent = "";
  mensagem.className = "mensagem";
}

async function salvarCliente() {
  const tipoCliente = tipoClienteInput.value;
  const cpfCnpjCliente = cpfCnpjClienteInput.value.trim();
  const nomeCliente = nomeClienteInput.value.trim();

  if (!tipoCliente || !cpfCnpjCliente || !nomeCliente) {
    mostrarMensagem("Preencha todos os campos obrigatórios.", "erro");
    return;
  }

  if (clienteJaExiste(cpfCnpjCliente)) {
    mostrarMensagem("Já existe um cliente cadastrado com esse CPF/CNPJ.", "erro");
    return;
  }

  const novoCliente = {
    tipo_cliente: tipoCliente,
    cpf_cnpj_cliente: cpfCnpjCliente,
    nome_cliente: nomeCliente
  };

  const { error } = await supabaseClient
    .from("clientes")
    .insert(novoCliente);

  if (error) {
    mostrarMensagem("Erro ao salvar cliente: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Cliente salvo com sucesso!", "sucesso");

  formCliente.reset();

  carregarClientes();
}

async function atualizarNomeCliente() {

  const clienteId = clienteIdInput.value;

  const nomeCliente = nomeClienteInput.value;

  const { error } = await supabaseClient
    .from("clientes")
    .update({
      nome_cliente: nomeCliente
    })
    .eq("clienteid", clienteId);

  if (error) {
    mostrarMensagem("Erro ao atualizar cliente: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Nome atualizado com sucesso!", "sucesso");

  cancelarEdicao();

  carregarClientes();
}

async function excluirCliente(cliente) {
  
  const confirmou = confirm(
    "Tem certeza que deseja excluir o cliente " + cliente.nome_cliente + "?"
  );

  if (!confirmou) {
    return;
  }

  const { error } = await supabaseClient
    .from("clientes")
    .delete()
    .eq("clienteid", cliente.clienteid);

  if (error) {
    mostrarMensagem("Erro ao excluir cliente: " + error.message, "erro");
    return;
  }

  if (clienteIdInput.value == cliente.clienteid) {
    cancelarEdicao();
  }

  
  mostrarMensagem("Cliente excluído com sucesso!", "sucesso");

  carregarClientes();
}

formCliente.addEventListener("submit", async function(evento) {
 
  evento.preventDefault();

  const estaEditando = clienteIdInput.value !== "";

  if (estaEditando) {
    await atualizarNomeCliente();
  } else {
    await salvarCliente();
  }
});

btnCancelarEdicao.addEventListener("click", function() {
  cancelarEdicao();
});

if (btnPesquisarCliente) {
  btnPesquisarCliente.addEventListener("click", aplicarFiltroClientes);
}

if (btnLimparPesquisaCliente) {
  btnLimparPesquisaCliente.addEventListener("click", function() {
    barraPesquisaCliente.value = "";
    aplicarFiltroClientes();
  });
}

if (barraPesquisaCliente) {
  barraPesquisaCliente.addEventListener("keydown", function(evento) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      aplicarFiltroClientes();
    }
  });
}

carregarClientes();
