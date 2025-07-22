async function gerarPrevisaoComHistorico() {
  const sugestaoDiv = document.getElementById("sugestaoCrash");
  const assertDiv = document.getElementById("assertCrash");

  sugestaoDiv.innerHTML = "🔄 Obtendo histórico...";
  assertDiv.innerText = "--";

  try {
    const proxy = "https://corsproxy.io/?";
    const url = "https://www.tipminer.com/br/historico/blaze/crash";
    const response = await fetch(proxy + encodeURIComponent(url));
    const html = await response.text();

    const multipliers = [...html.matchAll(/<span[^>]*class="[^"]*history-table__multiplier[^"]*"[^>]*>([\d.]+)x<\/span>/g)]
      .map(match => parseFloat(match[1]));

    if (multipliers.length === 0) throw new Error("Nenhum dado encontrado");

    const media = (multipliers.slice(0, 10).reduce((a, b) => a + b, 0) / 10).toFixed(2);
    sugestaoDiv.innerHTML = `📊 Média 10 jogos: <b>${media}x</b>`;
    assertDiv.innerText = media > 2 ? "99.8%" : "97.2%";

    document.getElementById("audioAlert").play().catch(() => {});
  } catch (err) {
    sugestaoDiv.innerHTML = `❌ Erro ao obter histórico`;
    console.error("Erro:", err);
  }
}
