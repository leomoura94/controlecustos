// Configuração do Firebase - substitua com a sua config do passo 2
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  databaseURL: "https://SEU_PROJETO-default-rtdb.firebaseio.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const form = document.getElementById('gastoForm');
const listaGastos = document.getElementById('listaGastos');
const saldoSpan = document.getElementById('saldo');
const exportarBtn = document.getElementById('exportarBtn');

let gastos = {};

// Referência no DB para os gastos
const gastosRef = db.ref('gastos');

// Escuta alterações no banco e atualiza lista
gastosRef.on('value', snapshot => {
  gastos = snapshot.val() || {};
  atualizarLista();
  atualizarSaldo();
});

form.addEventListener('submit', e => {
  e.preventDefault();

  const descricao = form.descricao.value.trim();
  const valor = parseFloat(form.valor.value);

  if (!descricao || isNaN(valor)) {
    alert('Preencha os campos corretamente.');
    return;
  }

  // Gerar ID único
  const id = Date.now();

  // Salvar no Firebase
  gastosRef.child(id).set({ descricao, valor })
    .then(() => {
      form.reset();
    })
    .catch(err => alert('Erro ao salvar: ' + err));
});

function atualizarLista() {
  listaGastos.innerHTML = '';

  for (const id in gastos) {
    const gasto = gastos[id];
    const li = document.createElement('li');

    li.textContent = gasto.descricao;
    const span = document.createElement('span');
    span.textContent = `R$ ${gasto.valor.toFixed(2)}`;
    li.appendChild(span);

    listaGastos.appendChild(li);
  }
}

function atualizarSaldo() {
  let total = 0;
  for (const id in gastos) {
    total += gastos[id].valor;
  }
  saldoSpan.textContent = total.toFixed(2);
}

exportarBtn.addEventListener('click', () => {
  const dataStr = JSON.stringify(gastos, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'gastos.json';
  a.click();

  URL.revokeObjectURL(url);
});
