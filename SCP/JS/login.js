const SUPABASE_URL = "https://spfrgjhhisvwqvkdgfll.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2-oeiECzfEJe5iKRjmc9Aw_nAq7Pzbp";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

const formLogin = document.getElementById("formLogin");

const emailUsuarioInput = document.getElementById("emailUsuario");
const senhaUsuarioInput = document.getElementById("senhaUsuario");

const mensagemLogin = document.getElementById("mensagemLogin");

function mostrarMensagem(texto, tipo) {

    mensagemLogin.textContent = texto;

    if (tipo === "erro") {
        mensagemLogin.style.color = "red";
    } else {
        mensagemLogin.style.color = "green";
    }
}

async function realizarLogin() {

    const email = emailUsuarioInput.value.trim();
    const senha = senhaUsuarioInput.value;

    const { data, error } = await supabaseClient
        .from("usuarios")
        .select("*")
        .eq("email_usuario", email)
        .eq("senha_usuario", senha);

    console.log("Email digitado:", email);
    console.log("Senha digitada:", senha);
    console.log("Data:", data);
    console.log("Error:", error);

    if (error) {
        mostrarMensagem(
            "Erro ao realizar login.",
            "erro"
        );
        return;
    }

    if (data.length === 0) {

        mostrarMensagem(
            "Usuário ou senha inválidos.",
            "erro"
        );

        return;
    }

    localStorage.setItem(
        "usuarioLogado",
        JSON.stringify(data[0])
    );

    window.location.href = "homepage.html";
}

formLogin.addEventListener(
    "submit",
    async function (evento) {

        evento.preventDefault();

        await realizarLogin();
    }
);