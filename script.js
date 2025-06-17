let gastos = JSON.parse(localStorage.getItem("gastos")) || [];
let saldoBanco = 3000; // Defina seu saldo aqui
let limiteMensal = 2000;

function processInput() {
  const input = document.getElementById("user-input").value.trim();
  if (!input) return;

  const log = document.getElementById("chat-log");
  log.innerHTML += `<div><strong>Você:</strong> ${input}</div>`;

  const regex = /gastei\s*(\d+)[^\d]*(pix|crédito|débito)[^\d]*no\s*(.+?)\s*\((Leonardo|Camila)\)/i;
  const match = input.match(regex);

  if (match) {
    const valor = parseFloat(match[1]);
    const tipo = match[2].toLowerCase();
    const categoria = match[3];
    const quem = match[4];

    const registro = {
      valor,
      tipo,
      categoria,
      quem,
      data: new Date().toLocaleDateString()
    };

    gastos.push(registro);
    localStorage.setItem("gastos", JSON.stringify(gastos));
    log.innerHTML += `<div><strong>Bot:</strong> Gasto de R$${valor.toFixed(2)} em ${categoria} por ${quem} registrado com ${tipo}.</div>`;
    atualizarResumo();
  } else {
    log.innerHTML += `<div><strong>Bot:</strong> Não entendi. Tente: "Gastei 150 no débito no mercado (Leonardo)"</div>`;
  }

  document.getElementById("user-input").value = "";
  log.scrollTop = log.scrollHeight;
}

function atualizarResumo() {
  const resumoDiv = document.getElementById("resumo");
  const totalGasto = gastos.reduce((sum, g) => sum + g.valor, 0);
  const porCategoria = {};

  gastos.forEach(g => {
    if (!porCategoria[g.categoria]) porCategoria[g.categoria] = 0;
    porCategoria[g.categoria] += g.valor;
  });

  let resumo = `<p><strong>Total Gasto:</strong> R$${totalGasto.toFixed(2)} / R$${limiteMensal.toFixed(2)}</p>`;
  resumo += `<p><strong>Saldo no Banco:</strong> R$${(saldoBanco - totalGasto).toFixed(2)}</p>`;
  resumo += `<ul>`;
  for (let cat in porCategoria) {
    resumo += `<li>${cat}: R$${porCategoria[cat].toFixed(2)}</li>`;
  }
  resumo += `</ul>`;

  resumoDiv.innerHTML = resumo;
}

window.onload = atualizarResumo;
