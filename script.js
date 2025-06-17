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
