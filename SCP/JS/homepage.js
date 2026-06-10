function carregarPerfil() {
  const usuario = JSON.parse(localStorage.getItem('usuarioLogado') || 'null');

  const nomeEl = document.getElementById('nomeUsuarioLogado');
  const emailEl = document.getElementById('emailUsuarioLogado');

  if (!usuario) {
    if (nomeEl) nomeEl.textContent = 'Nome do usuário';
    if (emailEl) emailEl.textContent = 'Perfil';
    return;
  }

  if (nomeEl) {
    nomeEl.textContent = usuario.nome_usuario || 'Nome do usuário';
  }

  if (emailEl) {
    emailEl.textContent = usuario.email_usuario || 'Perfil';
  }
}

carregarPerfil();
