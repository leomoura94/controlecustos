
let gastos = JSON.parse(localStorage.getItem("gastos")) || [];
let entradas = JSON.parse(localStorage.getItem("entradas")) || [];

if (!Array.isArray(gastos)) gastos = [];
if (!Array.isArray(entradas)) entradas = [];

const form = document.getElementById("gastoForm");
const saldoForm = document.getElementById("saldoForm");
const resetarBtn = document.getElementById("resetar");
const saldoBancoEl = document.getElementById("saldoBanco");
const totalGastoEl = document.getElementById("totalGasto");
const historicoEl = document.getElementById("historico");
const ctx = document.getElementById("graficoGastos").getContext("2d");

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcularTotais() {
  const totalEntradas = entradas.reduce((acc, e) => acc + e.valor, 0);
  const totalGastos = gastos.reduce((acc, g) => acc + g.valor, 0);
  const saldoAtual = totalEntradas - totalGastos;
  return { totalEntradas, totalGastos, saldoAtual };
}

function atualizarPainel() {
  const { totalEntradas, totalGastos, saldoAtual } = calcularTotais();
  saldoBancoEl.textContent = formatarMoeda(saldoAtual);
  totalGastoEl.textContent = formatarMoeda(totalGastos);
  localStorage.setItem("gastos", JSON.stringify(gastos));
  localStorage.setItem("entradas", JSON.stringify(entradas));
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
  gastos.forEach((g) => {
    categorias[g.categoria] = (categorias[g.categoria] || 0) + g.valor;
  });
  grafico.data.labels = Object.keys(categorias);
  grafico.data.datasets[0].data = Object.values(categorias);
  grafico.update();
}

function renderizarHistorico() {
  historicoEl.innerHTML = "";
  const todosMovimentos = [
    ...entradas.map((e) => ({ tipo: "entrada", quem: e.quem, valor: e.valor, descricao: e.descricao, data: new Date(e.data) })),
    ...gastos.map((g) => ({ tipo: "gasto", quem: g.quem, valor: g.valor, categoria: g.categoria, pagamento: g.tipo, data: new Date(g.data) })),
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
        texto = `<span class="text-green-500">+ ${formatarMoeda(mov.valor)}</span> – ${mov.quem} | ${mov.descricao}`;
      } else {
        texto = `<span class="text-red-500">- ${formatarMoeda(mov.valor)}</span> – ${mov.quem} | ${mov.categoria} (${mov.pagamento})`;
      }
      const linha = document.createElement("p");
      linha.className = "text-gray-300";
      linha.innerHTML = `${mov.data.toLocaleDateString("pt-BR")} - ${texto}`;
      bloco.appendChild(linha);
    });
    historicoEl.appendChild(bloco);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const quem = document.getElementById("quem").value;
  const valor = parseFloat(document.getElementById("valor").value);
  const categoria = document.getElementById("categoria").value.trim();
  const tipo = document.getElementById("tipo").value;
  if (!valor || valor <= 0 || categoria === "") return alert("Preencha corretamente.");
  gastos.push({ quem, valor, categoria, tipo, data: new Date().toISOString() });
  form.reset();
  atualizarPainel();
});

saldoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const quem = document.getElementById("quemSaldo").value;
  const valor = parseFloat(document.getElementById("valorSaldo").value);
  const descricao = document.getElementById("descricaoSaldo").value.trim();
  if (!valor || valor <= 0 || descricao === "") return alert("Preencha corretamente.");
  entradas.push({ quem, valor, descricao, data: new Date().toISOString() });
  saldoForm.reset();
  atualizarPainel();
});

resetarBtn.addEventListener("click", () => {
  if (confirm("Tem certeza que deseja resetar tudo?")) {
    gastos = [];
    entradas = [];
    localStorage.clear();
    atualizarPainel();
  }
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

function exportarCSV() {
  const linhas = [];
  linhas.push("Tipo,Quem,Valor,Descrição/Categoria,Forma de Pagamento,Data");

  entradas.forEach((e) => {
    linhas.push(`entrada,${e.quem},${e.valor},"${e.descricao}",,"${e.data}"`);
  });

  gastos.forEach((g) => {
    linhas.push(`gasto,${g.quem},${g.valor},"${g.categoria}",${g.tipo},"${g.data}"`);
  });

  const csv = linhas.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "controle-de-gastos.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportarExcel() {
  if (typeof XLSX === "undefined") {
    alert("Biblioteca Excel não carregada!");
    return;
  }

  const dados = [];
  dados.push(["Tipo", "Quem", "Valor", "Descrição/Categoria", "Forma de Pagamento", "Data"]);

  entradas.forEach((e) => {
    dados.push(["entrada", e.quem, e.valor, e.descricao, "", e.data]);
  });

  gastos.forEach((g) => {
    dados.push(["gasto", g.quem, g.valor, g.categoria, g.tipo, g.data]);
  });

  const ws = XLSX.utils.aoa_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Movimentações");
  XLSX.writeFile(wb, "controle-de-gastos.xlsx");
}

atualizarPainel();
// ... (todo o conteúdo anterior do script permanece igual)

// Adicione este final abaixo do atualizarPainel()

document.getElementById("importarArquivo").addEventListener("change", async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async function (event) {
    const ext = file.name.split(".").pop().toLowerCase();
    try {
      if (ext === "json") {
        const dados = JSON.parse(event.target.result);
        if (dados.entradas && dados.gastos) {
          entradas = dados.entradas;
          gastos = dados.gastos;
        } else {
          alert("Arquivo JSON inválido.");
          return;
        }
      } else if (ext === "csv") {
        const linhas = event.target.result.split("\\n").slice(1);
        entradas = [];
        gastos = [];
        for (const linha of linhas) {
          const [tipo, quem, valor, descricaoOuCategoria, formaPagamento, data] = linha.split(",");
          const item = {
            quem: quem,
            valor: parseFloat(valor),
            data: data?.replaceAll('"', "")
          };
          if (tipo === "entrada") {
            item.descricao = descricaoOuCategoria?.replaceAll('"', "");
            entradas.push(item);
          } else if (tipo === "gasto") {
            item.categoria = descricaoOuCategoria?.replaceAll('"', "");
            item.tipo = formaPagamento;
            gastos.push(item);
          }
        }
      } else if (ext === "xlsx") {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        entradas = [];
        gastos = [];

        rows.slice(1).forEach(row => {
          const [tipo, quem, valor, descricaoOuCategoria, formaPagamento, data] = row;
          const item = {
            quem: quem,
            valor: parseFloat(valor),
            data: data
          };
          if (tipo === "entrada") {
            item.descricao = descricaoOuCategoria;
            entradas.push(item);
          } else if (tipo === "gasto") {
            item.categoria = descricaoOuCategoria;
            item.tipo = formaPagamento;
            gastos.push(item);
          }
        });
      } else {
        alert("Tipo de arquivo não suportado.");
        return;
      }

      localStorage.setItem("gastos", JSON.stringify(gastos));
      localStorage.setItem("entradas", JSON.stringify(entradas));
      atualizarPainel();
      alert("Importação concluída com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao importar. Verifique se o arquivo está correto.");
    }
  };

  if (file.name.endsWith(".xlsx")) {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }
});

