"use strict";  

const els = {
  // Controls
  homeBtn: document.getElementById("homeBtn"),
  searchInput: document.getElementById("searchInput"),
  categorySelect: document.getElementById("categorySelect"),
  yearSelect: document.getElementById("yearSelect"),
  showFavBtn: document.getElementById("showFavBtn"),
  backToListBtn: document.getElementById("backToListBtn"),
  backBtn: document.getElementById("backBtn"),
  detailFavBtn: document.getElementById("detailFavBtn"),

  // Views
  views: document.querySelectorAll(".view"),
  listView: document.getElementById("listView"),
  detailView: document.getElementById("detailView"),
  favView: document.getElementById("favView"),

  // Grids
  booksGrid: document.getElementById("booksGrid"),
  favGrid: document.getElementById("favGrid"),

  // Empty texts
  emptyState: document.getElementById("emptyState"),
  favEmpty: document.getElementById("favEmpty"),

  // Detail fields 
  dCover: document.getElementById("detailCover"),
  dTitle: document.getElementById("detailTitle"),
  dAuthor: document.getElementById("detailAuthor"),
  dYear: document.getElementById("detailYear"),
  dCategory: document.getElementById("detailCategory"),
  dPages: document.getElementById("detailPages"),
  dRating: document.getElementById("detailRating"),
  dSummary: document.getElementById("detailSummary"),

  // Template
  cardTpl: document.getElementById("bookCardTpl"),
};

let allBooks = [];
let currentDetailId = null;

const LS_KEY = "favoriteBookIds";

/* ---------- localStorage helpers ---------- */
function getFavIds() {
  const raw = localStorage.getItem(LS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function setFavIds(ids) {
  localStorage.setItem(LS_KEY, JSON.stringify(ids));
}
function isFav(id) {
  return getFavIds().includes(id);
}
function toggleFav(id) {
  const ids = getFavIds();
  const next = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
  setFavIds(next);
}

/* ---------- View management (Bootstrap d-none) ---------- */
function showView(viewEl) {
  els.views.forEach(v => v.classList.add("d-none"));
  viewEl.classList.remove("d-none");
  window.scrollTo({ top: 0, behavior: "smooth" });
}


/* ---------- fetch + async/await---------- */
async function loadBooks() {
  const res = await fetch("data/books.json");
  if (!res.ok) throw new Error("JSON okunamadı!");
  return await res.json();
}

/* ---------- Fill filters ---------- */
function fillFilters(books) {
  const categories = [...new Set(books.map(b => b.category))].sort();
  categories.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    els.categorySelect.appendChild(opt);
  });

  const years = [...new Set(books.map(b => b.year))].sort((a, b) => b - a);
  years.forEach(y => {
    const opt = document.createElement("option");
    opt.value = String(y);
    opt.textContent = String(y);
    els.yearSelect.appendChild(opt);
  });
}

/* ---------- Filtering ---------- */
function getFilteredBooks() {
  const q = els.searchInput.value.trim().toLowerCase();
  const cat = els.categorySelect.value;
  const year = els.yearSelect.value;

  let list = allBooks;

  if (q) list = list.filter(b => b.title.toLowerCase().includes(q));
  if (cat !== "all") list = list.filter(b => b.category === cat);
  if (year !== "all") list = list.filter(b => String(b.year) === year);

  return list;
}

/* ---------- Card creation from template ---------- */
function createBookCard(book, mode = "list") {
  const node = els.cardTpl.content.firstElementChild.cloneNode(true);

  node.querySelector(".card-cover").src = book.cover;
  node.querySelector(".card-cover").alt = book.title;

  node.querySelector(".card-titlex").textContent = book.title;
  node.querySelector(".card-author").textContent = book.author;
  node.querySelector(".card-year").textContent = String(book.year);
  node.querySelector(".card-category").textContent = book.category;
  node.querySelector(".card-rating").textContent = `⭐ ${book.rating}`;

  const btnDetails = node.querySelector(".btn-details");
  const btnFav = node.querySelector(".btn-fav");
  const favBadge = node.querySelector(".fav-badge");

  btnDetails.dataset.id = String(book.id);
  btnFav.dataset.id = String(book.id);

  // Favori buton yazısı
  btnFav.textContent = isFav(book.id) ? "★ Favoride" : "☆ Favori";
  // Kart üstünde küçük yıldız (favori işareti)
  if (favBadge) favBadge.classList.toggle("d-none", !isFav(book.id));


  // Favoriler ekranında "Sil" olsun
  if (mode === "fav") {
    btnFav.dataset.action = "remove";
    btnFav.textContent = "Sil";
    btnFav.classList.remove("btn-outline-warning");
    btnFav.classList.add("btn-outline-dark");
  }
// Kategoriye göre kart stili (class ekleme)
const catClassMap = {
  "Novel": "cat-novel",
  "Fantasy": "cat-fantasy",
  "Psychology": "cat-psychology",
  "History": "cat-history",
  "Business": "cat-business",
  "Software": "cat-software",
  "Self-Help": "cat-selfhelp",
  "Science Fiction": "cat-scifi",
  "Classic": "cat-classic",
  "Philosophy": "cat-philosophy"
};

// Card'a kategori class'ı ekle (eşleşme yoksa eklemez)
const cardEl = node.querySelector(".classic-card");
const cls = catClassMap[book.category];
if (cardEl && cls) cardEl.classList.add(cls);
  return node;
}

/* ---------- Render list ---------- */
function renderList() {
  const books = getFilteredBooks();

  els.booksGrid.innerHTML = "";
  els.emptyState.classList.toggle("d-none", books.length !== 0);

  const frag = document.createDocumentFragment();
  books.forEach(b => frag.appendChild(createBookCard(b, "list")));
  els.booksGrid.appendChild(frag);
}

/* ---------- Render detail (HTML hazır) ---------- */
function renderDetail(id) {
  const book = allBooks.find(b => b.id === id);
  if (!book) return;

  currentDetailId = id;

  els.dCover.src = book.cover;
  els.dCover.alt = book.title;

  els.dTitle.textContent = book.title;
  els.dAuthor.textContent = book.author;
  els.dYear.textContent = String(book.year);
  els.dCategory.textContent = book.category;
  els.dPages.textContent = String(book.pages);
  els.dRating.textContent = String(book.rating);
  els.dSummary.textContent = book.summary;

  els.detailFavBtn.textContent = isFav(id) ? "★ Favoriden Çıkar" : "☆ Favoriye Ekle";
}

/* ---------- Render favorites ---------- */
function renderFavorites() {
  const ids = getFavIds();
  const favBooks = allBooks.filter(b => ids.includes(b.id));

  els.favGrid.innerHTML = "";
  els.favEmpty.classList.toggle("d-none", favBooks.length !== 0);

  const frag = document.createDocumentFragment();
  favBooks.forEach(b => frag.appendChild(createBookCard(b, "fav")));
  els.favGrid.appendChild(frag);
}

/* ---------- Event Delegation (required & clean) ---------- */
function handleGridClick(e) {
  const btn = e.target.closest("button");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);

  if (action === "details") {
    renderDetail(id);
    showView(els.detailView);
    return;
  }

  if (action === "fav") {
    toggleFav(id);
    renderList();
    return;
  }

  if (action === "remove") {
    toggleFav(id);
    renderFavorites();
    return;
  }
}

/* ---------- Init ---------- */
async function init() {
  allBooks = await loadBooks();
  fillFilters(allBooks);

  renderList();
  showView(els.listView);

  // Filters
  els.searchInput.addEventListener("input", renderList);
  els.categorySelect.addEventListener("change", renderList);
  els.yearSelect.addEventListener("change", renderList);

  // Go favorites
  els.showFavBtn.addEventListener("click", () => {
    renderFavorites();
    showView(els.favView);
  });

  // Back to list from favorites
  els.backToListBtn.addEventListener("click", () => {
    renderList();
    showView(els.listView);
  });

  // Back from detail
  els.backBtn.addEventListener("click", () => {
    renderList();
    showView(els.listView);
  });

  // Detail favorite toggle
  els.detailFavBtn.addEventListener("click", () => {
    if (currentDetailId == null) return;
    toggleFav(currentDetailId);
    renderDetail(currentDetailId);
  });

  // Delegation
  els.booksGrid.addEventListener("click", handleGridClick);
  els.favGrid.addEventListener("click", handleGridClick);
  // Site başlığına tıklanınca ana sayfaya dön
els.homeBtn.addEventListener("click", () => {
  // filtreleri sıfırla
  els.searchInput.value = "";
  els.categorySelect.value = "all";
  els.yearSelect.value = "all";

  renderList();
  showView(els.listView);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
});

}

init().catch(err => {
  console.error(err);
  els.booksGrid.innerHTML = `<p class="text-danger">Hata: ${err.message}</p>`;
});


