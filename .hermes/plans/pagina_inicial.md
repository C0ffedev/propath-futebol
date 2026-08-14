# Plano: Página Inicial (4 telas) — ProPath Futebol

Objetivo: dar ao jogo uma ENTRADA de verdade, unindo 4 ideias do usuário:
1) Landing pública (antes do login)
2) Hub central pós-login (dashboard do jogador + ações)
3) Menu de escolha (carreiras / nova / ranking / sobre)
4) Intro narrativa Pânico × Obsessão

Arquivo novo: home.js (estende UI; incluído após ui.js, antes de main.js).
Navegação:
- Boot: loadSession → logado? afterLogin (topbar+tabs+UI.hub no #app) : UI.landing (esconde tudo)
- Landing CTA "Entrar/Criar" → showLogin(); "A Premissa" → UI.premise()
- afterLogin: substitui loadList(modal) por UI.hub() no #app
- Hub unifica menu+dashboard; btn-menu (☰) reabre hub

Fases:
A) home.js: UI.landing + UI.premise + UI.hub (estrutura + busca saves)
B) CSS em styles.css (landing, hub, premise, pills)
C) index.html: div #landing + <script home.js>
D) main.js: boot redireciona p/ landing; afterLogin chama UI.hub; keep loadList p/ compat
E) Verificar: jsdom e2e (landing→login→hub) + syntax check
