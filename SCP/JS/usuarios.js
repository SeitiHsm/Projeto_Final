const SUPABASE_URL = "https://spfrgjhhisvwqvkdgfll.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2-oeiECzfEJe5iKRjmc9Aw_nAq7Pzbp";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const formUsuario = document.getElementById("formUsuario");

const nomeUsuarioInput = document.getElementById("nomeUsuario");
const emailUsuarioInput = document.getElementById("emailUsuario");
const senhaUsuarioInput = document.getElementById("senhaUsuario");
const confirmarSenhaInput = document.getElementById("confirmarSenha");

const mensagemUsuario = document.getElementById("mensagemUsuario");

function mostrarMensagem(texto, tipo) {

    mensagemUsuario.textContent = texto;

    if(tipo === "erro"){
        mensagemUsuario.style.color = "red";
    }
    else{
        mensagemUsuario.style.color = "green";
    }
}

async function cadastrarUsuario() {

    console.log("Botão clicado");

    const nome = nomeUsuarioInput.value.trim();
    const email = emailUsuarioInput.value.trim();
    const senha = senhaUsuarioInput.value;
    const confirmarSenha = confirmarSenhaInput.value;

    console.log(nome);
    console.log(email);
    console.log(senha);
    console.log(confirmarSenha);

    if(senha !== confirmarSenha){
        mostrarMensagem("As senhas não coincidem.", "erro");
        return;
    }

    const novoUsuario = {
        nome_usuario: nome,
        email_usuario: email,
        senha_usuario: senha
    };

    console.log(novoUsuario);

    const { data, error } = await supabaseClient
        .from("usuarios")
        .insert(novoUsuario)
        .select();

    console.log(data);
    console.log(error);

    if(error){
        mostrarMensagem(
            "Erro ao cadastrar usuário: " + error.message,
            "erro"
        );
        return;
    }

    mostrarMensagem(
        "Usuário cadastrado com sucesso!",
        "sucesso"
    );

    formUsuario.reset();
}

formUsuario.addEventListener(
    "submit",
    async function(evento){

        evento.preventDefault();

        await cadastrarUsuario();

    }
);