let saldoInicial = 5000; // você pode alterar aqui o valor inicial
let gastos = [];

const form = document.getElementById("gastoForm");
const saldoBancoEl = document.getElementById("saldoBanco");
const totalGastoEl = document.getElementById("totalGasto");
const ctx = document.getElementById("graficoGastos").getContext("2d");

// Carregar dados do localStorage
if (localStorage.getItem("gastos")) {
  gastos = JSON.parse(localStorage.getItem("gastos"));
}
if (localStorage.getItem("saldo")) {
  saldoInicial = parseFloat(localStorage.getItem("saldo"));
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function atualizarPainel() {
  const totalGasto = gastos.reduce((acc, g) => acc + g.valor, 0);
  const saldoAtual = saldoInicial - totalGasto;

  saldoBancoEl.textContent = formatarMoeda(saldoAtual);
  totalGastoEl.textContent = formatarMoeda(totalGasto);

  atualizarGrafico();
  localStorage.setItem("gastos", JSON.stringify(gastos));
  localStorage.setItem("saldo", saldoInicial.toString());
}

// Gráfico de categorias
let grafico = new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: [],
    datasets: [
      {
        label: "Gastos por Categoria",
        data: [],
        backgroundColor: [
          "#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#fb7185",
        ],
        borderWidth: 1,
      },
    ],
  },
  options: {
    plugins: {
      legend: {
        labels: { color: "#ccc" }
      }
    }
  }
});

function atualizarGrafico() {
  const categorias = {};
  gastos.forEach((g) => {
    categorias[g.categoria] = (categorias[g.categoria] || 0) + g.valor;
  });

  grafico.data.labels = Object.keys(categorias);
  grafico.data.datasets[0].data = Object.values(categorias);
  grafico.update();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const quem = document.getElementById("quem").value;
  const valor = parseFloat(document.getElementById("valor").value);
  const categoria = document.getElementById("categoria").value.trim();
  const tipo = document.getElementById("tipo").value;

  if (!valor || valor <= 0 || categoria === "") {
    alert("Preencha os campos corretamente.");
    return;
  }

  gastos.push({ quem, valor, categoria, tipo, data: new Date().toISOString() });

  form.reset();
  atualizarPainel();
});

atualizarPainel();
const saldoForm = document.getElementById("saldoForm");
const historicoEl = document.getElementById("historico");

// Novo array de saldos adicionados (depósitos)
let entradas = [];
if (localStorage.getItem("entradas")) {
  entradas = JSON.parse(localStorage.getItem("entradas"));
}

saldoForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const valor = parseFloat(document.getElementById("valorSaldo").value);
  const descricao = document.getElementById("descricaoSaldo").value.trim();

  if (!valor || valor <= 0 || descricao === "") {
    alert("Preencha os campos corretamente.");
    return;
  }

  entradas.push({ valor, descricao, data: new Date().toISOString() });
  saldoInicial += valor;

  localStorage.setItem("entradas", JSON.stringify(entradas));
  localStorage.setItem("saldo", saldoInicial.toString());

  saldoForm.reset();
  atualizarPainel();
  renderizarHistorico();
});

// Mostra histórico organizado por mês
function renderizarHistorico() {
  historicoEl.innerHTML = "";

  const todosMovimentos = [
    ...entradas.map((e) => ({
      tipo: "entrada",
      valor: e.valor,
      descricao: e.descricao,
      data: new Date(e.data),
    })),
    ...gastos.map((g) => ({
      tipo: "gasto",
      quem: g.quem,
      valor: g.valor,
      categoria: g.categoria,
      pagamento: g.tipo,
      data: new Date(g.data),
    })),
  ];

  todosMovimentos.sort((a, b) => b.data - a.data);

  const porMes = {};

  todosMovimentos.forEach((mov) => {
    const mes = mov.data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    if (!porMes[mes]) porMes[mes] = [];
    porMes[mes].push(mov);
  });

  for (const mes in porMes) {
    const bloco = document.createElement("div");
    bloco.innerHTML = `<h3 class="font-bold mb-2">${mes}</h3>`;

    porMes[mes].forEach((mov) => {
      let texto = "";

      if (mov.tipo === "entrada") {
        texto = `<span class="text-green-500">+ ${formatarMoeda(mov.valor)}</span> – ${mov.descricao}`;
      } else {
        texto = `<span class="text-red-500">- ${formatarMoeda(mov.valor)}</span> – ${mov.quem} | ${mov.categoria} (${mov.pagamento})`;
      }

      const linha = document.createElement("p");
      linha.className = "text-gray-700 dark:text-gray-300";
      linha.textContent = `${mov.data.toLocaleDateString("pt-BR")} - `;
      linha.innerHTML += texto;

      bloco.appendChild(linha);
    });

    historicoEl.appendChild(bloco);
  }
}

