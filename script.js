const API_URL = "https://script.google.com/macros/library/d/1HTbEUwgKKO1x0zaDqCfSbU_cXUnCcHvuR6PsAcF6Y8G61rpvOxBQESmo/1";

let gastos = [];
let entradas = [];

const form = document.getElementById("gastoForm");
const saldoForm = document.getElementById("saldoForm");
const resetarBtn = document.getElementById("resetar");
const saldoBancoEl = document.getElementById("saldoBanco");
const totalGastoEl = document.getElementById("totalGasto");
const historicoEl = document.getElementById("historico");
const ctx = document.getElementById("graficoGastos").getContext("2d");

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function carregarDados() {
  const [dadosGastos, dadosEntradas] = await Promise.all([
    fetch(`${API_URL}?tipo=gastos`).then(r => r.json()),
    fetch(`${API_URL}?tipo=entradas`).then(r => r.json())
  ]);
  gastos = dadosGastos.map(g => ({ ...g, valor: parseFloat(g.valor), data: new Date(g.data) }));
  entradas = dadosEntradas.map(e => ({ ...e, valor: parseFloat(e.valor), data: new Date(e.data) }));
  atualizarPainel();
}

function calcularTotais() {
  const totalEntradas = entradas.reduce((acc, e) => acc + e.valor, 0);
  const totalGastos = gastos.reduce((acc, g) => acc + g.valor, 0);
  return {
    totalEntradas,
    totalGastos,
    saldoAtual: totalEntradas - totalGastos
  };
}

function atualizarPainel() {
  const { totalEntradas, totalGastos, saldoAtual } = calcularTotais();
  saldoBancoEl.textContent = formatarMoeda(saldoAtual);
  totalGastoEl.textContent = formatarMoeda(totalGastos);
  atualizarGrafico();
  renderizarHistorico();
}

let grafico = new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: [],
    datasets: [{
      label: "Gastos por Categoria",
      data: [],
      backgroundColor: ["#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#fb7185"],
    }],
  },
  options: {
    plugins: {
      legend: { labels: { color: "#ccc" } },
    },
  },
});

function atualizarGrafico() {
  const categorias = {};
  gastos.forEach(g => {
    categorias[g.categoria] = (categorias[g.categoria] || 0) + g.valor;
  });
  grafico.data.labels = Object.keys(categorias);
  grafico.data.datasets[0].data = Object.values(categorias);
  grafico.update();
}

function renderizarHistorico() {
  historicoEl.innerHTML = "";
  const todos = [...entradas, ...gastos].sort((a, b) => b.data - a.data);
  const porMes = {};

  todos.forEach(mov => {
    const mes = mov.data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    if (!porMes[mes]) porMes[mes] = [];
    porMes[mes].push(mov);
  });

  for (const mes in porMes) {
    const bloco = document.createElement("div");
    bloco.innerHTML = `<h3 class="font-bold mb-2">${mes}</h3>`;
    porMes[mes].forEach(mov => {
      const texto = mov.descricao
        ? `<span class="text-green-500">+ ${formatarMoeda(mov.valor)}</span> – ${mov.quem} | ${mov.descricao}`
        : `<span class="text-red-500">- ${formatarMoeda(mov.valor)}</span> – ${mov.quem} | ${mov.categoria} (${mov.tipo})`;
      const linha = document.createElement("p");
      linha.className = "text-gray-300";
      linha.innerHTML = `${mov.data.toLocaleDateString("pt-BR")} - ${texto}`;
      bloco.appendChild(linha);
    });
    historicoEl.appendChild(bloco);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const quem = document.getElementById("quem").value;
  const valor = parseFloat(document.getElementById("valor").value);
  const categoria = document.getElementById("categoria").value;
  const tipo = document.getElementById("tipo").value;
  if (!valor || valor <= 0 || !categoria) return alert("Preencha corretamente.");
  const gasto = { quem, valor, categoria, tipo, data: new Date().toISOString() };
  await fetch(`${API_URL}?tipo=gastos`, {
    method: "POST",
    body: JSON.stringify(gasto)
  });
  form.reset();
  carregarDados();
});

saldoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const quem = document.getElementById("quemSaldo").value;
  const valor = parseFloat(document.getElementById("valorSaldo").value);
  const descricao = document.getElementById("descricaoSaldo").value.trim();
  if (!valor || valor <= 0 || descricao === "") return alert("Preencha corretamente.");
  const entrada = { quem, valor, descricao, data: new Date().toISOString() };
  await fetch(`${API_URL}?tipo=entradas`, {
    method: "POST",
    body: JSON.stringify(entrada)
  });
  saldoForm.reset();
  carregarDados();
});

resetarBtn.addEventListener("click", () => {
  alert("Resetar tudo com Google Sheets não é automático.\nVocê precisa limpar os dados manualmente na planilha.");
});

function exportarDados() {
  const dados = { gastos, entradas };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "controle-de-gastos.json";
  link.click();
  URL.revokeObjectURL(url);
}

carregarDados();
