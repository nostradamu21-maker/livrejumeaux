"use strict";

const etat = {
  archetypes: [],
  choix: { 1: null, 2: null },
  prenoms: { 1: "", 2: "" },
  filtre: "tous",
};

// pages d'exemple (exemplaire réel test-filles) pour le livre feuilletable :
// la couverture d'abord, puis un choix de pages intérieures.
const FLIP_IMAGES = [
  "/apercu/test-filles/couverture.jpg",
  "/apercu/test-filles/page-01.jpg",
  "/apercu/test-filles/page-02.jpg",
  "/apercu/test-filles/page-05.jpg",
  "/apercu/test-filles/page-08.jpg",
  "/apercu/test-filles/page-11.jpg",
  "/apercu/test-filles/page-14.jpg",
  "/apercu/test-filles/page-17.jpg",
  "/apercu/test-filles/page-20.jpg",
  "/apercu/test-filles/page-27.jpg",
];

async function init() {
  buildFlipbook(FLIP_IMAGES);
  cyclerPrenoms();
  const r = await fetch("/api/archetypes");
  etat.archetypes = await r.json();
  rendreGrilles();
  brancherFiltres();
  brancherPrenoms();
  document.getElementById("commande").addEventListener("submit", commander);
}

function buildFlipbook(images) {
  const book = document.getElementById("fb-book");
  const prev = document.getElementById("fb-prev");
  const next = document.getElementById("fb-next");
  const hint = document.getElementById("fb-hint");
  if (!book) return;

  // une feuille = 2 faces (recto = page de droite, verso = page de gauche du tour suivant)
  const leaves = [];
  book.innerHTML = "";
  for (let i = 0; i < images.length; i += 2) {
    const leaf = document.createElement("div");
    leaf.className = "fb-leaf";
    const front = images[i];
    const back = images[i + 1];
    const coverCls = i === 0 ? " is-cover" : "";
    leaf.innerHTML =
      `<div class="fb-face fb-front${coverCls}"><img src="${front}" alt=""></div>` +
      (back
        ? `<div class="fb-face fb-back"><img src="${back}" alt=""></div>`
        : `<div class="fb-face fb-back"></div>`);
    book.appendChild(leaf);
    leaves.push(leaf);
  }

  const N = leaves.length;
  // on tourne au plus N-1 feuilles : la dernière garde toujours une page à droite
  const MAX = Math.max(0, N - 1);
  let turned = 0;

  function update() {
    leaves.forEach((leaf, k) => {
      const isT = k < turned;
      leaf.classList.toggle("turned", isT);
      leaf.style.zIndex = isT ? k + 1 : N - k;
    });
    prev.disabled = turned === 0;
    next.disabled = turned >= MAX;
    if (hint) hint.textContent = turned === 0 ? "Cliquez pour tourner les pages" : `Page ${turned * 2}`;
  }

  next.onclick = () => { if (turned < MAX) { turned++; update(); } };
  prev.onclick = () => { if (turned > 0) { turned--; update(); } };
  book.addEventListener("click", (e) => {
    const rect = book.getBoundingClientRect();
    if (e.clientX - rect.left > rect.width / 2) next.onclick();
    else prev.onclick();
  });

  update();
}

// petit défilé de prénoms d'exemple pour montrer la personnalisation
function cyclerPrenoms() {
  const a = document.getElementById("perso-a");
  const b = document.getElementById("perso-b");
  if (!a || !b) return;
  const paires = [
    ["Léo", "Emma"],
    ["Jade", "Tom"],
    ["Noah", "Lina"],
    ["Gabin", "Rose"],
    ["Sacha", "Alix"],
    ["Maël", "Nina"],
  ];
  let i = 0;
  setInterval(() => {
    i = (i + 1) % paires.length;
    a.classList.add("perso-swap");
    b.classList.add("perso-swap");
    setTimeout(() => {
      a.textContent = paires[i][0];
      b.textContent = paires[i][1];
      a.classList.remove("perso-swap");
      b.classList.remove("perso-swap");
    }, 350);
  }, 2200);
}

function rendreGrilles() {
  for (const j of [1, 2]) {
    const grille = document.querySelector(`[data-grille="${j}"]`);
    grille.innerHTML = "";
    for (const a of etat.archetypes) {
      if (etat.filtre !== "tous" && a.genre !== etat.filtre) continue;
      const carte = document.createElement("div");
      carte.className = "carte" + (a.disponible ? "" : " indispo") +
        (etat.choix[j] === a.id ? " actif" : "");
      carte.innerHTML =
        `<img src="${a.fiche}" alt="${a.description}" loading="lazy">` +
        `<div class="legende">${a.description}</div>`;
      if (a.disponible) carte.addEventListener("click", () => choisir(j, a.id));
      grille.appendChild(carte);
    }
  }
}

function choisir(jumeau, aid) {
  etat.choix[jumeau] = aid;
  rendreGrilles();
  majApercu();
}

function brancherFiltres() {
  for (const b of document.querySelectorAll(".filtre")) {
    b.addEventListener("click", () => {
      document.querySelector(".filtre.actif").classList.remove("actif");
      b.classList.add("actif");
      etat.filtre = b.dataset.genre;
      rendreGrilles();
    });
  }
}

function brancherPrenoms() {
  for (const input of document.querySelectorAll(".prenom")) {
    input.addEventListener("input", () => {
      etat.prenoms[input.dataset.jumeau] = input.value.trim();
      majApercu();
    });
  }
}

function fichePar(id) {
  return etat.archetypes.find((a) => a.id === id);
}

async function majApercu() {
  for (const j of [1, 2]) {
    const slot = document.getElementById(`couv-fiche-${j}`);
    const a = fichePar(etat.choix[j]);
    slot.innerHTML = a
      ? `<img src="${a.fiche}" alt="">`
      : `<span class="vide">Enfant ${j}</span>`;
  }

  const p1 = etat.prenoms[1], p2 = etat.prenoms[2];
  const zone = document.getElementById("couv-prenoms");
  if (p1 && p2) zone.textContent = `${p1} & ${p2}`;
  else if (p1 || p2) zone.textContent = p1 || p2;
  else zone.textContent = etat.choix[1] && etat.choix[2] ? "Ajoutez les prénoms" : "Choisissez deux archétypes";

  const note = document.getElementById("note-distinctif");
  if (etat.choix[1] && etat.choix[1] === etat.choix[2]) {
    const a = fichePar(etat.choix[1]);
    note.hidden = false;
    note.textContent = a.distinctif
      ? `Vos enfants ont le même archétype : pour les distinguer, ${a.distinctif}.`
      : "Vos enfants ont le même archétype ; un petit détail les distinguera.";
  } else {
    note.hidden = true;
  }

  majCommande();
  await majApercusReels();
}

function majCommande() {
  const pret = etat.choix[1] && etat.choix[2] && etat.prenoms[1] && etat.prenoms[2];
  document.getElementById("btn-commander").disabled = !pret;
}

async function majApercusReels() {
  const bloc = document.getElementById("apercus-reels");
  const bandeau = document.getElementById("bandeau-apercus");
  if (!(etat.choix[1] && etat.choix[2])) {
    bloc.hidden = true;
    return;
  }
  const r = await fetch(`/api/combo/${etat.choix[1]}/${etat.choix[2]}`);
  const data = await r.json();
  if (data.cache && data.apercus.length) {
    bandeau.innerHTML = data.apercus.map((u) => `<img src="${u}" alt="">`).join("");
    bloc.hidden = false;
  } else {
    bloc.hidden = true;
  }
}

async function commander(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-commander");
  const statut = document.getElementById("statut");
  btn.disabled = true;
  statut.className = "statut";
  statut.textContent = "Traitement…";
  try {
    const r = await fetch("/api/commander", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        archetype1: etat.choix[1],
        archetype2: etat.choix[2],
        prenom1: etat.prenoms[1],
        prenom2: etat.prenoms[2],
        email: document.getElementById("email").value.trim(),
      }),
    });
    const data = await r.json();
    if (data.ok && data.url) {
      // paiement réel : redirection vers Stripe Checkout
      statut.className = "statut ok";
      statut.textContent = "Redirection vers le paiement sécurisé…";
      window.location.href = data.url;
      return;
    }
    if (data.ok) {
      // repli sans Stripe : commande simulée
      statut.className = "statut ok";
      statut.textContent = data.message;
    } else {
      statut.className = "statut erreur";
      statut.textContent = data.erreur || "Une erreur est survenue.";
      btn.disabled = false;
    }
  } catch (err) {
    statut.className = "statut erreur";
    statut.textContent = "Serveur injoignable.";
    btn.disabled = false;
  }
}

init();
