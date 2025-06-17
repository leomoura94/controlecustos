document.getElementById("importarArquivo").addEventListener("change", async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

reader.onload = async function (event) {
  const ext = file.name.split(".").pop().toLowerCase();

  try {
    entradas = [];
    gastos = [];

    if (ext === "xlsx") {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

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

    } else if (ext === "json") {
      const dados = JSON.parse(event.target.result);
      entradas = dados.entradas || [];
      gastos = dados.gastos || [];
    } else if (ext === "csv") {
      const linhas = event.target.result.split("\\n").slice(1);
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
    } else {
      return alert("Tipo de arquivo não suportado.");
    }

    // Garantir estrutura dos dados
    entradas = entradas.map(e => ({
      quem: e.quem,
      valor: Number(e.valor),
      descricao: e.descricao || "",
      data: e.data || new Date().toISOString()
    }));

    gastos = gastos.map(g => ({
      quem: g.quem,
      valor: Number(g.valor),
      categoria: g.categoria || "",
      tipo: g.tipo || "pix",
      data: g.data || new Date().toISOString()
    }));

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
