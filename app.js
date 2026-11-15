"use strict";

/* Seleciona um elemento pelo seu ID. */
const $ = (id) => document.getElementById(id);

/* Formata números no padrão brasileiro. */
const fmt = (numero, casas = 1) =>
  numero.toLocaleString("pt-BR", {
    maximumFractionDigits: casas,
    minimumFractionDigits: casas
  });

/* =========================================
   SIMULADOR DE REFRAÇÃO
   ========================================= */

function updateRay() {
  const angle = Number($("angle").value);
  const n = Number($("medium").value);

  // O meio de origem é o ar, com índice aproximado de 1.
  const a = angle * Math.PI / 180;
  const r = Math.asin(Math.sin(a) / n);

  $("angleValue").textContent = angle + "°";
  $("refraction").textContent =
    fmt(r * 180 / Math.PI) + "°";

  // Desenha o raio incidente.
  $("incoming").setAttribute(
    "d",
    `M${300 - 180 * Math.sin(a)} ${200 - 180 * Math.cos(a)}
     L300 200`
  );

  // Desenha o raio refratado.
  $("outgoing").setAttribute(
    "d",
    `M300 200
     L${300 + 180 * Math.sin(r)} ${200 + 180 * Math.cos(r)}`
  );

  const name = $("medium").selectedOptions[0].text;
  $("mediumLabel").textContent = name.toUpperCase();

  let text;

  if (angle === 0) {
    text = "Incidência perpendicular: a direção permanece a mesma.";
  } else if (n === 1) {
    text = "Índices iguais: o raio continua em linha reta.";
  } else {
    text =
      "Ao entrar em um meio de maior índice, " +
      "o raio se aproxima da normal.";
  }

  $("rayText").textContent = text;

  $("rayDesc").textContent =
    `Incidência ${angle} graus, ` +
    `refração ${fmt(r * 180 / Math.PI)} graus. ${text}`;
}

["angle", "medium"].forEach((id) => {
  $(id).addEventListener("input", updateRay);
});

$("reset").addEventListener("click", () => {
  $("angle").value = 45;
  $("medium").value = "1.333";
  updateRay();
});

/* =========================================
   SIMULADOR DE AQUECIMENTO
   ========================================= */

function updateHeat() {
  const hours = Number($("hours").value);

  const irradiance = 800;  // W/m²
  const area = 10;         // m²
  const efficiency = 0.6;
  const mass = 10000;      // kg
  const specificHeat = 4186; // J/(kg·°C)

  const energy =
    irradiance * area * efficiency * hours * 3600;

  const temperatureChange =
    energy / (mass * specificHeat);

  $("hoursValue").textContent =
    hours + (hours === 1 ? " hora" : " horas");

  $("ideal").textContent =
    "+" + fmt(temperatureChange, 2) + " °C";

  $("real").textContent = $("loss").checked
    ? "+" + fmt(temperatureChange * 0.7, 2) + " °C"
    : "Comparação desativada";
}

["hours", "loss"].forEach((id) => {
  $(id).addEventListener("input", updateHeat);
});

/* =========================================
   SIMULADOR DO CONTROLADOR DA BOMBA
   ========================================= */

let pump = false;

function updateRobot() {
  const poolTemperature = Number($("pool").value);
  const collectorTemperature = Number($("collector").value);
  const adequateLevel = $("level").checked;

  const difference =
    collectorTemperature - poolTemperature;

  let reason = "";

  if (!adequateLevel) {
    pump = false;
    reason = "Nível inadequado: circulação bloqueada.";
  } else if (poolTemperature >= 28) {
    pump = false;
    reason = "Meta de 28 °C atingida.";
  } else if (difference <= 2) {
    pump = false;
    reason = "Diferença térmica insuficiente (≤ 2 °C).";
  } else if (difference >= 5) {
    pump = true;
    reason =
      "Coletor pelo menos 5 °C mais quente; " +
      "piscina abaixo da meta.";
  } else {
    // Entre 2 e 5 °C, mantém o estado anterior.
    reason =
      "Faixa de histerese: mantém o estado anterior.";
  }

  $("poolValue").textContent =
    poolTemperature + " °C";

  $("collectorValue").textContent =
    collectorTemperature + " °C";

  $("pump").replaceChildren(
    document.createTextNode(
      pump ? "● Bomba ligada" : "○ Bomba desligada"
    )
  );

  const explanation = document.createElement("small");
  explanation.textContent = reason;
  $("pump").appendChild(explanation);
}

["pool", "collector", "level"].forEach((id) => {
  $(id).addEventListener("input", updateRobot);
});

/* =========================================
   PAINEL DE ACESSIBILIDADE
   ========================================= */

$("access").addEventListener("click", () => {
  const isOpen =
    $("access").getAttribute("aria-expanded") === "true";

  $("access").setAttribute(
    "aria-expanded",
    String(!isOpen)
  );

  $("access-panel").hidden = isOpen;
});

/*
  Ativa ou desativa um recurso.
  Quando possível, salva a preferência no navegador.
*/
function toggle(id, className) {
  $(id).addEventListener("click", () => {
    const active =
      document.body.classList.toggle(className);

    $(id).setAttribute("aria-pressed", String(active));

    // Aplica a redução de rolagem também ao elemento HTML.
    if (className === "reduced") {
      document.documentElement.classList.toggle(
        "reduced",
        active
      );
    }

    try {
      localStorage.setItem(className, String(active));
    } catch {
      // O site continua funcionando sem armazenamento local.
    }
  });

  try {
    if (localStorage.getItem(className) === "true") {
      document.body.classList.add(className);
      $(id).setAttribute("aria-pressed", "true");

      if (className === "reduced") {
        document.documentElement.classList.add("reduced");
      }
    }
  } catch {
    // Alguns navegadores bloqueiam o armazenamento local.
  }
}

toggle("contrast", "contrast");
toggle("reading", "reading");
toggle("motion", "reduced");

/* Alterna entre 100%, 112,5% e 125%. */
let size = 0;

$("size").addEventListener("click", () => {
  size = (size + 1) % 3;

  document.documentElement.style.setProperty(
    "--scale",
    1 + size * 0.125
  );

  $("size").textContent = size
    ? "Texto: " + fmt(100 + size * 12.5) + "%"
    : "Aumentar texto";
});

/* Mostra os resultados iniciais ao abrir a página. */
updateRay();
updateHeat();
updateRobot();
