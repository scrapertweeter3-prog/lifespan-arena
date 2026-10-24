/* Lifespan Arena: draft two products, roll years, lowest cost per served year wins. */
var DUELS = [
  {name: "espresso machine",
   A: [{n:" thermo block", p:180, y:4, fail:"pump seal"},
       {n:" bargain dual boiler", p:520, y:6, fail:"solenoid"}],
   B: [{n:" brass E61 single boiler", p:1450, y:22, fail:"group gasket"},
       {n:" copper boiler flagship", p:2400, y:26, fail:"pressure stat"}]},
  {name: "daily backpack",
   A: [{n:" mall-brand pack", p:45, y:2, fail:"zipper"},
       {n:" department-store pack", p:70, y:3, fail:"strap stitch"}],
   B: [{n:" ballistic nylon pack", p:260, y:18, fail:"buckle"},
       {n:" waxed canvas pack", p:320, y:24, fail:"tackle box chew"}]},
  {name: "cast iron pan",
   A: [{n:" discount pan", p:22, y:5, fail:"warp on induction"},
       {n:" coated aluminum pan", p:55, y:3, fail:"coating wear"}],
   B: [{n:" sand-cast skillet", p:120, y:60, fail:"handle bolt"},
       {n:" vintage-grain skillet", p:180, y:80, fail:"spider crack"}]}
];

/* hazard dimension per duel: random failure pressure rises after the peak year */
var DIMS = {
  castIron: {label:"routine care", peak:35},
  warranty: {label:"warranty",     peak:10},
  trendy:   {label:"tech cycle",   peak:14}
};

var state = null;

function start(duelIdx, rng) {
  rng = rng || Math.random;
  var duel = DUELS[duelIdx];
  state = {
    duel: duel, rng: rng, year: 0, over: false,
    A: null, B: null,
    aliveA: true, aliveB: true,
    unitsA: 1, yearsA: 0, yearsB: 0, lastDeathA: 0,
    dim: pickDim(duel.name, rng), log: []
  };
  return state;
}

function pickDim(duelName, rng) {
  if (duelName === "cast iron pan") {
    return (rng() < 0.5) ? DIMS.castIron : DIMS.trendy;
  }
  return (rng() < 0.5) ? DIMS.warranty : DIMS.trendy;
}

/* annual random-failure probability; wear-out pressure climbs past the peak year */
function tv(x, dim) {
  if (x <= 0) { return 0; }
  if (x < dim.peak) { return 0.01 + 0.01 * x / dim.peak; }
  return Math.min(0.52, 0.02 + 0.5 * (x - dim.peak) / (40 - dim.peak));
}

function lockA(optIdx) {
  state.A = state.duel.A[optIdx];
  state.unitsA = 1;
  return state.A;
}

function lockB(optIdx) {
  state.B = state.duel.B[optIdx];
  return state.B;
}

function yearStep() {
  if (state.over) { return state; }
  state.year += 1;
  var y = state.year, dim = state.dim, note = "";

  if (state.aliveA) { state.yearsA = y; }
  if (state.aliveB) { state.yearsB = y; }

  var aGone = false, bGone = false;

  /* budget lane: the slot can hold zero or one live unit. A unit dies at its
     rated life counted from its own install year, OR on a random-failure roll
     (infant + wear-out shape). The BIFL unit is overbuilt against exactly that
     random failure mode, so it only faces its rated life. After the 4th budget
     purchase the slot retires empty; the run then ends when the BIFL unit dies. */
  var canFail = state.aliveA && state.unitsA <= 4;
  var ageDeath = state.lastDeathA + state.A.y;
  if (canFail && (ageDeath <= y || state.rng() < tv(y, dim))) {
    aGone = true;
  }
  if (state.aliveB && state.B.y <= y) {
    bGone = true;
  }

  if (aGone) {
    state.lastDeathA = y;
    if (state.unitsA < 4) {
      state.unitsA += 1;
      note = "budget unit " + state.unitsA + " died at year " + y + " (" +
             state.A.fail + "); a fresh one took the slot. ";
    } else {
      state.aliveA = false;
      note = "fourth budget unit failed at year " + y + " (" + state.A.fail +
             "); the slot retires empty. ";
    }
  }
  if (bGone) {
    state.aliveB = false;
    note += "BIFL unit failed at year " + y + " (" + state.B.fail + ").";
  }
  if (!state.aliveA || !state.aliveB) {
    state.over = true;
  }
  state.log.push(logline(note));
  return state;
}

function logline(note) {
  var a = state.aliveA ? "serving" : "retired";
  var b = state.aliveB ? "serving" : "retired";
  return "yr " + state.year + ": budget " + a + " (units " + state.unitsA + ", spent $" +
         spent().A + ") | bifl " + b + " (spent $" + spent().B + "). " + note;
}

function spent() {
  return {
    A: state.unitsA * state.A.p,
    B: state.B.p
  };
}

function tally() {
  var s = spent();
  return {
    A: {name: "Budget" + state.A.n, spent: s.A, years: state.yearsA,
        cpp: s.A / state.yearsA},
    B: {name: "BIFL" + state.B.n, spent: s.B, years: state.yearsB,
        cpp: s.B / state.yearsB}
  };
}

function money(x) { return "$" + x.toFixed(2); }

function verdictLine() {
  var t = tally();
  if (t.A.cpp < t.B.cpp) {
    return "Budget won this run: " + money(t.A.cpp) + "/yr vs " + money(t.B.cpp) + "/yr.";
  }
  if (t.B.cpp < t.A.cpp) {
    return "BIFL won this run: " + money(t.B.cpp) + "/yr vs " + money(t.A.cpp) + "/yr.";
  }
  return "Dead heat at " + money(t.A.cpp) + "/yr.";
}

/* UI wiring below; game logic above is DOM-free for the harness. */
if (typeof document !== "undefined" && document.getElementById("duel")) {
  var rngUI = Math.random;
  var currentDuel = Math.floor(rngUI() * DUELS.length);
  var chosen = {A: 0, B: 0};

  function showPanel(id) {
    var ids = ["m0", "m1", "m2", "m3"];
    for (var i = 0; i < ids.length; i++) {
      document.getElementById(ids[i]).style.display = (ids[i] === id) ? "block" : "none";
    }
  }

  function optCard(o) {
    return "<b>" + o.n.trim() + "</b><span>$" + o.p + " - rated life " + o.y +
           " yrs - typical failure: " + o.fail + "</span>";
  }

  function renderDuel() {
    var d = DUELS[currentDuel];
    document.getElementById("duelname").textContent = d.name;
    var box = document.getElementById("duel");
    box.innerHTML = "<div class='row'>" +
      d.A.concat(d.B).map(function (o) {
        return "<div class='card'>" + optCard(o) + "</div>";
      }).join("") + "</div>";
  }

  function renderDraft(side) {
    var d = DUELS[currentDuel];
    var opts = side === "A" ? d.A : d.B;
    var row = document.getElementById(side === "A" ? "rowA" : "rowB");
    row.innerHTML = "";
    opts.forEach(function (o, i) {
      var div = document.createElement("div");
      div.className = (i === chosen[side]) ? "card sel" : "card";
      div.innerHTML = optCard(o);
      div.onclick = function () { choose(side, i, div); };
      row.appendChild(div);
    });
  }

  function choose(side, i, div) {
    chosen[side] = i;
    var cards = document.getElementById(side === "A" ? "rowA" : "rowB")
                  .querySelectorAll(".card");
    for (var k = 0; k < cards.length; k++) { cards[k].className = "card"; }
    div.className = "card sel";
  }

  function beginDrafts() {
    start(currentDuel, rngUI);
    chosen = {A: 0, B: 0};
    renderDraft("A");
    showPanel("m1");
  }

  function renderScores() {
    var s = spent();
    document.getElementById("scores").innerHTML =
      "<div class='kv'>Year " + state.year + " - hazard dim: " + state.dim.label + "</div>" +
      "<div class='kv'>Budget" + state.A.n + ": units " + state.unitsA + ", spent $" +
        s.A + " - " + (state.aliveA ? "serving" : "retired") + "</div>" +
      "<div class='kv'>BIFL" + state.B.n + ": spent $" + s.B + " - " +
        (state.aliveB ? "serving" : "retired") + "</div>";
  }

  function addLog(line) {
    var el = document.getElementById("log");
    var d = document.createElement("div");
    d.textContent = line;
    el.appendChild(d);
    el.scrollTop = el.scrollHeight;
  }

  function finish() {
    var t = tally();
    document.getElementById("verdict").textContent = verdictLine();
    document.getElementById("board").innerHTML =
      "<tr><th></th><th>spent</th><th>years served</th><th>cost per served year</th></tr>" +
      "<tr><td>" + t.A.name + "</td><td>$" + t.A.spent + "</td><td>" + t.A.years +
      "</td><td>" + money(t.A.cpp) + "/yr</td></tr>" +
      "<tr><td>" + t.B.name + "</td><td>$" + t.B.spent + "</td><td>" + t.B.years +
      "</td><td>" + money(t.B.cpp) + "/yr</td></tr>";
    document.getElementById("nextYear").disabled = true;
    document.getElementById("end").style.display = "block";
  }

  document.getElementById("duelStart").onclick = beginDrafts;
  document.getElementById("lockA").onclick = function () {
    lockA(chosen.A); renderDraft("B"); showPanel("m2");
  };
  document.getElementById("lockB").onclick = function () {
    lockB(chosen.B); renderScores(); showPanel("m3");
  };
  document.getElementById("nextYear").onclick = function () {
    yearStep();
    renderScores();
    addLog(state.log[state.log.length - 1]);
    if (state.over) { finish(); }
  };
  document.getElementById("again").onclick = function () {
    chosen = {A: 0, B: 0};
    document.getElementById("log").innerHTML = "";
    document.getElementById("nextYear").disabled = false;
    document.getElementById("end").style.display = "none";
    currentDuel = Math.floor(rngUI() * DUELS.length);
    renderDuel();
    showPanel("m0");
  };

  renderDuel();
}
