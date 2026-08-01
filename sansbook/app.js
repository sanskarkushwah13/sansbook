const seedBooks = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Gitanjali",
    author: "Rabindranath Tagore",
    category: "Poetry",
    description: "A public-domain collection of devotional poems.",
    status: "approved",
    owner_id: "system",
    views: 0,
    downloads: 0,
    chapters: [
      { title: "Opening", text: "Gitanjali\nRabindranath Tagore\n\nThis SansBook demo includes short public-domain reading samples so the reader works instantly." },
      { title: "Freedom", text: "Where the mind is without fear and the head is held high, where knowledge is free, reading becomes a quiet act of courage." },
      { title: "Builder Notes", text: "Use this area for EPUB text, PDF preview, bookmarks, notes, highlights, and saved reading progress." }
    ]
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    category: "Mystery",
    description: "Classic detective fiction for testing search, library, and reader flows.",
    status: "approved",
    owner_id: "system",
    views: 0,
    downloads: 0,
    chapters: [
      { title: "The Woman", text: "To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name." },
      { title: "SansBook Reader", text: "This sample shows how long-form book content can be rendered cleanly in SansBook." }
    ]
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "The Time Machine",
    author: "H. G. Wells",
    category: "Science Fiction",
    description: "A famous science-fiction classic, useful as a sample public-domain title.",
    status: "approved",
    owner_id: "system",
    views: 0,
    downloads: 0,
    chapters: [
      { title: "The Time Traveller", text: "The Time Traveller was expounding a recondite matter to us. His grey eyes shone and twinkled." },
      { title: "Marketplace Path", text: "SansBook can grow from free legal reading into an author marketplace with payments, reviews, and private storage." }
    ]
  }
];

const coverPairs = [
  ["#1f7a5b", "#d89d2b"],
  ["#375f8c", "#b84d31"],
  ["#17201d", "#1f7a5b"],
  ["#b84d31", "#d89d2b"],
  ["#375f8c", "#1f7a5b"]
];

const config = window.SANSBOOK_CONFIG || {};
const hasSupabaseConfig = Boolean(
  config.supabaseUrl &&
  config.supabaseAnonKey &&
  !String(config.supabaseUrl).includes("YOUR_")
);
const supabaseClient = hasSupabaseConfig && window.supabase
  ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

const state = {
  books: [],
  library: [],
  reports: [],
  bookmarks: [],
  notes: [],
  highlights: [],
  progress: {},
  currentBookId: null,
  currentPage: 0,
  readerSize: 18,
  theme: "light",
  readerSearchQuery: "",
  readerSearchMatches: [],
  readerSearchIndex: 0,
  user: null,
  profile: null
};

const els = {
  toast: document.querySelector("#toast"),
  backendStatus: document.querySelector("#backendStatus"),
  pageTitle: document.querySelector("#pageTitle"),
  navLinks: document.querySelectorAll(".nav-link"),
  views: document.querySelectorAll(".view"),
  accountLabel: document.querySelector("#accountLabel"),
  openAuthBtn: document.querySelector("#openAuthBtn"),
  logoutBtn: document.querySelector("#logoutBtn"),
  authDialog: document.querySelector("#authDialog"),
  authForm: document.querySelector("#authForm"),
  closeAuthBtn: document.querySelector("#closeAuthBtn"),
  authName: document.querySelector("#authName"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  authRole: document.querySelector("#authRole"),
  loginBtn: document.querySelector("#loginBtn"),
  signupBtn: document.querySelector("#signupBtn"),
  searchInput: document.querySelector("#searchInput"),
  globalSearchInput: document.querySelector("#globalSearchInput"),
  librarySearchHint: document.querySelector("#librarySearchHint"),
  readerSearchInput: document.querySelector("#readerSearchInput"),
  readerSearchNav: document.querySelector("#readerSearchNav"),
  readerSearchCount: document.querySelector("#readerSearchCount"),
  readerSearchPrev: document.querySelector("#readerSearchPrev"),
  readerSearchNext: document.querySelector("#readerSearchNext"),
  readerSearchClear: document.querySelector("#readerSearchClear"),
  categoryFilter: document.querySelector("#categoryFilter"),
  bookGrid: document.querySelector("#bookGrid"),
  libraryGrid: document.querySelector("#libraryGrid"),
  bookCount: document.querySelector("#bookCount"),
  libraryCount: document.querySelector("#libraryCount"),
  heroShelfCount: document.querySelector("#heroShelfCount"),
  emptyLibrary: document.querySelector("#emptyLibrary"),
  readerTitle: document.querySelector("#readerTitle"),
  readerMeta: document.querySelector("#readerMeta"),
  readerPane: document.querySelector("#readerPane"),
  chapterList: document.querySelector("#chapterList"),
  bookmarkList: document.querySelector("#bookmarkList"),
  noteForm: document.querySelector("#noteForm"),
  noteText: document.querySelector("#noteText"),
  noteList: document.querySelector("#noteList"),
  generateSummaryBtn: document.querySelector("#generateSummaryBtn"),
  summaryBox: document.querySelector("#summaryBox"),
  bookForm: document.querySelector("#bookForm"),
  bookTitle: document.querySelector("#bookTitle"),
  bookAuthor: document.querySelector("#bookAuthor"),
  bookCategory: document.querySelector("#bookCategory"),
  bookDescription: document.querySelector("#bookDescription"),
  bookFile: document.querySelector("#bookFile"),
  rightsCheck: document.querySelector("#rightsCheck"),
  authorBooks: document.querySelector("#authorBooks"),
  authorBookCount: document.querySelector("#authorBookCount"),
  pendingBooks: document.querySelector("#pendingBooks"),
  pendingCount: document.querySelector("#pendingCount"),
  statBooks: document.querySelector("#statBooks"),
  statSaved: document.querySelector("#statSaved"),
  statReports: document.querySelector("#statReports"),
  makeAdminBtn: document.querySelector("#makeAdminBtn"),
  reportForm: document.querySelector("#reportForm"),
  reportBook: document.querySelector("#reportBook"),
  reportEmail: document.querySelector("#reportEmail"),
  reportReason: document.querySelector("#reportReason"),
  reportList: document.querySelector("#reportList"),
  themeToggleBtn: document.querySelector("#themeToggleBtn"),
  continueSection: document.querySelector("#continueSection"),
  continueGrid: document.querySelector("#continueGrid"),
  continueCount: document.querySelector("#continueCount"),
  readerProgressBar: document.querySelector("#readerProgressBar")
};

const currentUserId = () => state.user?.id || "guest";
const isAdmin = () => state.profile?.role === "admin";
const canAuthor = () => ["author", "admin"].includes(state.profile?.role);
const storageKey = (name) => `sansbook.${currentUserId()}.${name}`;
const localProfileKey = (email) => `sansbook.localProfile.${String(email || "").toLowerCase()}`;

function validateAuthFields() {
  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;
  if (!email) {
    toast("Enter your email");
    els.authEmail.focus();
    return null;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    toast("Enter a valid email address");
    els.authEmail.focus();
    return null;
  }
  if (password.length < 6) {
    toast("Password must be at least 6 characters");
    els.authPassword.focus();
    return null;
  }
  return { email, password };
}

function bookProgress(book) {
  const chapters = book.chapters?.length || 1;
  const page = Number(state.progress[book.id]?.page || 0);
  return Math.round(((page + 1) / chapters) * 100);
}

function applyTheme(theme) {
  state.theme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = state.theme;
  els.themeToggleBtn.textContent = state.theme === "dark" ? "☾" : "☀";
  els.themeToggleBtn.title = state.theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
}

function toggleTheme() {
  applyTheme(state.theme === "dark" ? "light" : "dark");
  localStorage.setItem("sansbook.theme", state.theme);
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function normalizeBook(book) {
  return {
    ...book,
    status: book.status || "pending",
    chapters: book.chapters || [{ title: "Start", text: book.text || "No reading text was added yet." }],
    views: Number(book.views || 0),
    downloads: Number(book.downloads || 0)
  };
}

async function loadState() {
  els.backendStatus.textContent = supabaseClient ? "Supabase ready" : "Local mode";

  if (supabaseClient) {
    const { data } = await supabaseClient.auth.getUser();
    if (data?.user) {
      state.user = data.user;
      await loadProfile();
    }
    await loadRemoteData();
  } else {
    loadLocalUser();
    loadLocalData();
  }

  state.readerSize = Number(localStorage.getItem("sansbook.readerSize") || 18);
  applyTheme(localStorage.getItem("sansbook.theme") || "light");
  state.currentBookId = localStorage.getItem(storageKey("currentBookId"));
  document.documentElement.style.setProperty("--reader-size", `${state.readerSize}px`);
  updateAccount();
}

function loadLocalUser() {
  state.user = JSON.parse(localStorage.getItem("sansbook.localUser") || "null");
  if (state.user?.email) {
    state.profile = JSON.parse(localStorage.getItem(localProfileKey(state.user.email)) || "null");
  } else {
    state.profile = null;
  }
  if (!state.user) {
    state.user = { id: "guest", email: "guest@sansbook.local" };
    state.profile = { id: "guest", display_name: "Guest", role: "reader" };
  } else if (!state.profile) {
    state.profile = {
      id: state.user.id,
      display_name: state.user.email,
      role: "reader"
    };
  }
}

function loadLocalData() {
  const books = JSON.parse(localStorage.getItem("sansbook.books") || "null");
  state.books = (books?.length ? books : seedBooks).map(normalizeBook);
  state.library = JSON.parse(localStorage.getItem(storageKey("library")) || "[]");
  state.reports = JSON.parse(localStorage.getItem("sansbook.reports") || "[]");
  state.bookmarks = JSON.parse(localStorage.getItem(storageKey("bookmarks")) || "[]");
  state.notes = JSON.parse(localStorage.getItem(storageKey("notes")) || "[]");
  state.highlights = JSON.parse(localStorage.getItem(storageKey("highlights")) || "[]");
  state.progress = JSON.parse(localStorage.getItem(storageKey("progress")) || "{}");
}

function saveLocalData() {
  localStorage.setItem("sansbook.books", JSON.stringify(state.books));
  localStorage.setItem(storageKey("library"), JSON.stringify(state.library));
  localStorage.setItem("sansbook.reports", JSON.stringify(state.reports));
  localStorage.setItem(storageKey("bookmarks"), JSON.stringify(state.bookmarks));
  localStorage.setItem(storageKey("notes"), JSON.stringify(state.notes));
  localStorage.setItem(storageKey("highlights"), JSON.stringify(state.highlights));
  localStorage.setItem(storageKey("progress"), JSON.stringify(state.progress));
  localStorage.setItem("sansbook.readerSize", String(state.readerSize));
  if (state.currentBookId) localStorage.setItem(storageKey("currentBookId"), state.currentBookId);
}

async function loadProfile() {
  if (!supabaseClient || !state.user) return;
  const { data } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", state.user.id)
    .maybeSingle();
  state.profile = data || { id: state.user.id, display_name: state.user.email, role: "reader" };
}

async function loadRemoteData() {
  const [{ data: books }, { data: library }, { data: reports }, { data: bookmarks }, { data: notes }, { data: highlights }, { data: progress }] = await Promise.all([
    supabaseClient.from("books").select("*").order("created_at", { ascending: false }),
    state.user ? supabaseClient.from("library_items").select("book_id").eq("user_id", state.user.id) : { data: [] },
    supabaseClient.from("reports").select("*").order("created_at", { ascending: false }),
    state.user ? supabaseClient.from("bookmarks").select("*").eq("user_id", state.user.id) : { data: [] },
    state.user ? supabaseClient.from("notes").select("*").eq("user_id", state.user.id) : { data: [] },
    state.user ? supabaseClient.from("highlights").select("*").eq("user_id", state.user.id) : { data: [] },
    state.user ? supabaseClient.from("reading_progress").select("*").eq("user_id", state.user.id) : { data: [] }
  ]);

  state.books = (books?.length ? books : seedBooks).map(normalizeBook);
  state.library = (library || []).map((item) => item.book_id);
  state.reports = reports || [];
  state.bookmarks = bookmarks || [];
  state.notes = notes || [];
  state.highlights = highlights || [];
  state.progress = Object.fromEntries((progress || []).map((item) => [item.book_id, item]));
}

function updateAccount() {
  const label = `${state.profile?.display_name || state.user?.email || "Guest"} - ${state.profile?.role || "reader"}`;
  els.accountLabel.textContent = label;
  els.openAuthBtn.textContent = state.user?.id === "guest" ? "Login" : "Switch";
  els.logoutBtn.classList.toggle("hidden", state.user?.id === "guest");
}

function setView(viewName) {
  if (viewName === "admin" && !isAdmin()) {
    toast("Admin role required. Use Make Me Admin in local mode or set role in Supabase.");
  }
  if (viewName === "author" && !canAuthor()) {
    toast("Author role required. Signup as author or admin.");
  }
  els.views.forEach((view) => view.classList.toggle("active", view.id === `${viewName}View`));
  els.navLinks.forEach((link) => link.classList.toggle("active", link.dataset.view === viewName));
  const titles = {
    home: "SansBook Library",
    library: "My Library",
    reader: "Reader",
    author: "Author Dashboard",
    admin: "Admin",
    legal: "Legal"
  };
  els.pageTitle.textContent = titles[viewName] || "SansBook";
  location.hash = viewName;
}

function approvedBooks() {
  return state.books.filter((book) => book.status === "approved");
}

function currentSearchQuery() {
  return (els.globalSearchInput?.value || els.searchInput?.value || "").trim().toLowerCase();
}

function bookMatchesQuery(book, query) {
  if (!query) return true;
  const haystack = `${book.title} ${book.author} ${book.category} ${book.description}`.toLowerCase();
  if (haystack.includes(query)) return true;
  return (book.chapters || []).some((chapter) => String(chapter.text || "").toLowerCase().includes(query));
}

function filteredBooks() {
  const query = currentSearchQuery();
  const category = els.categoryFilter.value;
  return approvedBooks().filter((book) => {
    const inCategory = category === "all" || book.category === category;
    return inCategory && bookMatchesQuery(book, query);
  });
}

function filteredLibraryBooks() {
  const query = currentSearchQuery();
  return state.books.filter((book) => isSaved(book.id) && book.status === "approved" && bookMatchesQuery(book, query));
}

function findInBook(book, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const chapters = book.chapters?.length ? book.chapters : [{ title: "Start", text: book.text || "" }];
  const matches = [];
  chapters.forEach((chapter, pageIndex) => {
    const text = String(chapter.text || book.text || "");
    const lower = text.toLowerCase();
    let pos = 0;
    while ((pos = lower.indexOf(needle, pos)) !== -1) {
      matches.push({ pageIndex, start: pos, end: pos + needle.length });
      pos += needle.length || 1;
    }
  });
  return matches;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlightedText(text, query, activeMatchIndex = -1) {
  const safeText = escapeHtml(text);
  const needle = query.trim();
  if (!needle) return safeText;
  const regex = new RegExp(escapeRegExp(needle), "gi");
  let matchIndex = 0;
  return safeText.replace(regex, (match) => {
    const isActive = matchIndex === activeMatchIndex;
    const html = `<mark class="search-hit${isActive ? " active-hit" : ""}">${match}</mark>`;
    matchIndex += 1;
    return html;
  });
}

function runReaderSearch(jumpToFirst = true) {
  const book = state.books.find((item) => item.id === state.currentBookId);
  if (!book) return;
  state.readerSearchQuery = els.readerSearchInput.value.trim();
  state.readerSearchMatches = findInBook(book, state.readerSearchQuery);
  state.readerSearchIndex = jumpToFirst && state.readerSearchMatches.length ? 0 : Math.min(state.readerSearchIndex, Math.max(0, state.readerSearchMatches.length - 1));

  const hasQuery = Boolean(state.readerSearchQuery);
  els.readerSearchNav.classList.toggle("hidden", !hasQuery);
  if (!hasQuery) {
    renderReaderBook(book);
    return;
  }

  if (!state.readerSearchMatches.length) {
    els.readerSearchCount.textContent = "No matches";
    renderReaderBook(book);
    return;
  }

  const active = state.readerSearchMatches[state.readerSearchIndex];
  els.readerSearchCount.textContent = `${state.readerSearchIndex + 1} of ${state.readerSearchMatches.length}`;
  if (active && state.currentPage !== active.pageIndex) {
    state.currentPage = active.pageIndex;
  }
  renderReaderBook(book, active);
  saveProgress();
}

function stepReaderSearch(step) {
  if (!state.readerSearchMatches.length) return;
  state.readerSearchIndex = (state.readerSearchIndex + step + state.readerSearchMatches.length) % state.readerSearchMatches.length;
  runReaderSearch(false);
}

function clearReaderSearch() {
  els.readerSearchInput.value = "";
  state.readerSearchQuery = "";
  state.readerSearchMatches = [];
  state.readerSearchIndex = 0;
  els.readerSearchNav.classList.add("hidden");
  const book = state.books.find((item) => item.id === state.currentBookId);
  if (book) renderReaderBook(book);
}

function isSaved(bookId) {
  return state.library.includes(bookId);
}

function renderCategories() {
  const selected = els.categoryFilter.value || "all";
  const categories = [...new Set(approvedBooks().map((book) => book.category))].sort();
  els.categoryFilter.innerHTML = '<option value="all">All categories</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    els.categoryFilter.append(option);
  });
  els.categoryFilter.value = categories.includes(selected) ? selected : "all";
}

function makeBookCard(book, index, mode = "browse") {
  const node = document.querySelector("#bookCardTemplate").content.firstElementChild.cloneNode(true);
  const pair = coverPairs[index % coverPairs.length];
  node.querySelector(".cover").style.setProperty("--cover-a", pair[0]);
  node.querySelector(".cover").style.setProperty("--cover-b", pair[1]);
  node.querySelector(".cover-category").textContent = book.category;
  node.querySelector(".cover-title").textContent = book.title;
  node.querySelector(".book-category").textContent = book.category;
  node.querySelector("h3").textContent = book.title;
  node.querySelector(".book-author").textContent = `by ${book.author}`;
  node.querySelector(".book-description").textContent = book.description;
  node.querySelector(".status-line").textContent = `${book.status} - ${book.views || 0} views`;

  const addBtn = node.querySelector(".add-btn");
  const readBtn = node.querySelector(".read-btn");
  const reportBtn = node.querySelector(".report-btn");
  addBtn.textContent = isSaved(book.id) ? "Saved" : "Add";
  addBtn.disabled = isSaved(book.id);
  addBtn.addEventListener("click", () => addToLibrary(book.id));
  readBtn.addEventListener("click", () => openReader(book.id));
  reportBtn.addEventListener("click", () => {
    els.reportBook.value = book.id;
    setView("legal");
  });

  if (mode === "library") {
    addBtn.textContent = "Remove";
    addBtn.disabled = false;
    addBtn.classList.add("secondary");
    addBtn.onclick = () => removeFromLibrary(book.id);
  }

  return node;
}

function renderBooks() {
  const books = filteredBooks();
  const query = currentSearchQuery();
  els.bookGrid.innerHTML = "";
  if (!books.length && query) {
    els.bookGrid.innerHTML = '<div class="empty-inline">No books match your search.</div>';
  } else {
    books.forEach((book, index) => els.bookGrid.append(makeBookCard(book, index)));
  }
  els.bookCount.textContent = `${books.length} ${books.length === 1 ? "book" : "books"}`;
}

function renderLibrary() {
  const allSaved = state.books.filter((book) => isSaved(book.id) && book.status === "approved");
  const books = filteredLibraryBooks();
  const query = currentSearchQuery();
  els.libraryGrid.innerHTML = "";
  books.forEach((book, index) => els.libraryGrid.append(makeBookCard(book, index, "library")));
  els.libraryCount.textContent = `${allSaved.length} saved`;
  els.heroShelfCount.textContent = `${allSaved.length} saved`;
  els.emptyLibrary.style.display = allSaved.length ? "none" : "grid";
  if (query && allSaved.length) {
    els.librarySearchHint.textContent = `Showing ${books.length} of ${allSaved.length} saved books for "${query}"`;
    els.librarySearchHint.classList.remove("hidden");
  } else {
    els.librarySearchHint.classList.add("hidden");
  }
  if (query && !books.length && allSaved.length) {
    els.libraryGrid.innerHTML = '<div class="empty-inline">No saved books match your search.</div>';
  }
}

function renderContinueReading() {
  const inProgress = state.books
    .filter((book) => isSaved(book.id) && book.status === "approved" && state.progress[book.id])
    .sort((a, b) => {
      const aTime = state.progress[a.id]?.updated_at || "";
      const bTime = state.progress[b.id]?.updated_at || "";
      return bTime.localeCompare(aTime);
    });

  els.continueSection.classList.toggle("hidden", !inProgress.length);
  els.continueGrid.innerHTML = "";
  els.continueCount.textContent = `${inProgress.length} in progress`;

  inProgress.forEach((book) => {
    const percent = bookProgress(book);
    const page = Number(state.progress[book.id]?.page || 0);
    const card = document.createElement("article");
    card.className = "continue-card";
    card.innerHTML = `
      <div>
        <strong>${escapeHtml(book.title)}</strong>
        <span>${escapeHtml(book.author)} · Page ${page + 1}</span>
      </div>
      <div class="continue-progress">
        <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
        <span>${percent}%</span>
      </div>
      <button type="button">Continue</button>
    `;
    card.querySelector("button").addEventListener("click", () => openReader(book.id));
    els.continueGrid.append(card);
  });
}

function renderAuthor() {
  const owned = state.books.filter((book) => book.owner_id === currentUserId());
  els.authorBooks.innerHTML = "";
  els.authorBookCount.textContent = `${owned.length} books`;
  if (!owned.length) {
    els.authorBooks.innerHTML = '<div class="empty-inline">No uploaded books yet.</div>';
    return;
  }
  owned.forEach((book) => {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <strong>${escapeHtml(book.title)}</strong>
      <span>${escapeHtml(book.status)} - ${book.views || 0} views - ${book.downloads || 0} downloads</span>
      <button class="secondary" type="button">Edit</button>
    `;
    item.querySelector("button").addEventListener("click", () => editBook(book.id));
    els.authorBooks.append(item);
  });
}

function renderAdmin() {
  const pending = state.books.filter((book) => book.status === "pending");
  els.pendingBooks.innerHTML = "";
  els.pendingCount.textContent = `${pending.length} pending`;
  if (!pending.length) {
    els.pendingBooks.innerHTML = '<div class="empty-inline">No pending books.</div>';
  }
  pending.forEach((book) => {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <strong>${escapeHtml(book.title)}</strong>
      <span>${escapeHtml(book.author)} - ${escapeHtml(book.category)}</span>
      <div class="button-row">
        <button type="button" data-action="approve">Approve</button>
        <button class="danger compact" type="button" data-action="reject">Reject</button>
      </div>
    `;
    item.querySelector('[data-action="approve"]').addEventListener("click", () => updateBookStatus(book.id, "approved"));
    item.querySelector('[data-action="reject"]').addEventListener("click", () => updateBookStatus(book.id, "rejected"));
    els.pendingBooks.append(item);
  });
}

function renderLegal() {
  els.reportBook.innerHTML = "";
  state.books.forEach((book) => {
    const option = document.createElement("option");
    option.value = book.id;
    option.textContent = book.title;
    els.reportBook.append(option);
  });
  els.reportList.innerHTML = "";
  if (!state.reports.length) {
    els.reportList.innerHTML = '<div class="empty-inline">No reports yet.</div>';
    return;
  }
  state.reports.forEach((report) => {
    const book = state.books.find((item) => item.id === report.book_id);
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <strong>${escapeHtml(book?.title || "Unknown book")}</strong>
      <span>${escapeHtml(report.email || report.reporter_email)} - ${escapeHtml(report.reason)}</span>
    `;
    els.reportList.append(item);
  });
}

function renderStats() {
  els.statBooks.textContent = String(state.books.length);
  els.statSaved.textContent = String(state.library.length);
  els.statReports.textContent = String(state.reports.length);
}

function renderAll() {
  updateAccount();
  renderCategories();
  renderContinueReading();
  renderBooks();
  renderLibrary();
  renderAuthor();
  renderAdmin();
  renderLegal();
  renderStats();
}

async function addToLibrary(bookId) {
  if (isSaved(bookId)) return;
  state.library.push(bookId);
  if (supabaseClient && state.user) {
    await supabaseClient.from("library_items").insert({ user_id: state.user.id, book_id: bookId });
  } else {
    saveLocalData();
  }
  renderAll();
  toast("Added to your library");
}

async function removeFromLibrary(bookId) {
  state.library = state.library.filter((id) => id !== bookId);
  if (supabaseClient && state.user) {
    await supabaseClient.from("library_items").delete().eq("user_id", state.user.id).eq("book_id", bookId);
  } else {
    saveLocalData();
  }
  renderAll();
}

async function updateBookStatus(bookId, status) {
  if (!isAdmin()) return toast("Admin role required");
  const book = state.books.find((item) => item.id === bookId);
  if (!book) return;
  book.status = status;
  if (supabaseClient) {
    await supabaseClient.from("books").update({ status }).eq("id", bookId);
    await loadRemoteData();
  } else {
    saveLocalData();
  }
  renderAll();
  toast(`Book ${status}`);
}

function editBook(bookId) {
  const book = state.books.find((item) => item.id === bookId);
  if (!book) return;
  els.bookTitle.value = book.title;
  els.bookAuthor.value = book.author;
  els.bookCategory.value = book.category;
  els.bookDescription.value = book.description;
  els.rightsCheck.checked = true;
  els.bookForm.dataset.editId = bookId;
  toast("Edit loaded. Submit to save changes.");
}

function renderReaderBook(book, activeMatch = null) {
  const chapters = book.chapters?.length ? book.chapters : [{ title: "Start", text: book.text || "" }];
  state.currentPage = Math.max(0, Math.min(state.currentPage, chapters.length - 1));
  const chapter = chapters[state.currentPage];

  els.readerTitle.textContent = book.title;
  const percent = bookProgress(book);
  els.readerMeta.textContent = `${book.author} | ${book.category} | Page ${state.currentPage + 1} of ${chapters.length} (${percent}%)`;
  els.readerProgressBar.style.width = `${percent}%`;
  els.readerPane.innerHTML = "";
  els.chapterList.innerHTML = "";

  chapters.forEach((item, index) => {
    const button = document.createElement("button");
    const hasSearchHit = state.readerSearchQuery && findInBook(book, state.readerSearchQuery).some((match) => match.pageIndex === index);
    button.className = `${index === state.currentPage ? "secondary active-chip" : "secondary"}${hasSearchHit ? " search-chapter" : ""}`;
    button.type = "button";
    button.textContent = item.title || `Chapter ${index + 1}`;
    button.addEventListener("click", () => {
      state.currentPage = index;
      renderReaderBook(book, activeMatch);
      saveProgress();
    });
    els.chapterList.append(button);
  });

  if (book.file_data && book.file_type === "application/pdf") {
    const iframe = document.createElement("iframe");
    iframe.src = `${book.file_data}#page=${state.currentPage + 1}`;
    iframe.title = book.title;
    els.readerPane.append(iframe);
  } else if (book.file_url && book.file_type === "application/pdf") {
    const iframe = document.createElement("iframe");
    iframe.src = `${book.file_url}#page=${state.currentPage + 1}`;
    iframe.title = book.title;
    els.readerPane.append(iframe);
  } else {
    const article = document.createElement("article");
    article.className = "book-text";
    const chapterText = chapter.text || book.text || "No reading text was added for this book yet.";
    if (state.readerSearchQuery) {
      const pageMatches = state.readerSearchMatches.filter((match) => match.pageIndex === state.currentPage);
      const activeOnPageIndex = activeMatch && activeMatch.pageIndex === state.currentPage
        ? pageMatches.findIndex((match) => match.start === activeMatch.start && match.end === activeMatch.end)
        : -1;
      article.innerHTML = renderHighlightedText(chapterText, state.readerSearchQuery, activeOnPageIndex);
      const activeEl = article.querySelector(".active-hit");
      if (activeEl) activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      article.textContent = chapterText;
    }
    els.readerPane.append(article);
  }

  renderReaderSide();
  updateSummaryPanel(book);
}

async function openReader(bookId) {
  const book = state.books.find((item) => item.id === bookId);
  if (!book) return;
  if (!isSaved(bookId)) await addToLibrary(bookId);
  state.currentBookId = bookId;
  state.currentPage = Number(state.progress[bookId]?.page || 0);
  clearReaderSearch();
  book.views = Number(book.views || 0) + 1;
  if (supabaseClient) {
    await supabaseClient.from("books").update({ views: book.views }).eq("id", bookId);
  } else {
    saveLocalData();
  }
  renderReaderBook(book);
  setView("reader");
}

function renderReaderSide() {
  const bookId = state.currentBookId;
  els.bookmarkList.innerHTML = "";
  els.noteList.innerHTML = "";
  state.bookmarks.filter((item) => item.book_id === bookId).forEach((item) => {
    const row = document.createElement("div");
    row.className = "mini-item";
    row.textContent = `Page ${Number(item.page || 0) + 1}`;
    els.bookmarkList.append(row);
  });
  state.highlights.filter((item) => item.book_id === bookId).forEach((item) => {
    const row = document.createElement("div");
    row.className = "mini-item highlight";
    row.textContent = item.text;
    els.bookmarkList.append(row);
  });
  state.notes.filter((item) => item.book_id === bookId).forEach((item) => {
    const row = document.createElement("div");
    row.className = "mini-item";
    row.textContent = item.note;
    els.noteList.append(row);
  });
}

function summarizeText(text, maxSentences = 3) {
  const cleanText = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleanText) return "No text available to summarize.";
  const sentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanText];
  if (sentences.length <= maxSentences) return cleanText;

  const wordCounts = {};
  cleanText.toLowerCase().match(/\b[a-z]{3,}\b/g)?.forEach((word) => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });

  const sentenceScores = sentences.map((sentence) => {
    const words = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const score = words.reduce((sum, word) => sum + (wordCounts[word] || 0), 0);
    return { sentence: sentence.trim(), score };
  });

  const topSentences = sentenceScores
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .map((item) => item.sentence);

  const ordered = sentences
    .map((sentence) => sentence.trim())
    .filter((sentence) => topSentences.includes(sentence))
    .slice(0, maxSentences);

  return ordered.length ? ordered.join(" ") : sentences.slice(0, maxSentences).join(" ");
}

function updateSummaryPanel(book) {
  if (!els.summaryBox) return;
  const chapter = book.chapters?.[state.currentPage] || { text: book.text || "" };
  const chapterText = String(chapter.text || book.text || "");
  const summary = summarizeText(chapterText, 3);
  const bookOverview = book.description ? `${book.description} ` : "";
  const overviewText = summarizeText(`${bookOverview}${chapterText}`, 4);
  els.summaryBox.innerHTML = `
    <strong>Chapter summary</strong>
    <p>${escapeHtml(summary)}</p>
    <strong>Overview</strong>
    <p>${escapeHtml(overviewText)}</p>
  `;
}

async function saveProgress() {
  if (!state.currentBookId) return;
  const book = state.books.find((item) => item.id === state.currentBookId);
  const chapters = book?.chapters?.length || 1;
  const percentage = Math.round(((state.currentPage + 1) / chapters) * 100);
  const payload = {
    user_id: currentUserId(),
    book_id: state.currentBookId,
    page: state.currentPage,
    percentage,
    updated_at: new Date().toISOString()
  };
  state.progress[state.currentBookId] = payload;
  if (supabaseClient && state.user) {
    await supabaseClient.from("reading_progress").upsert(payload, { onConflict: "user_id,book_id" });
  } else {
    saveLocalData();
  }
  renderContinueReading();
}

async function addBookmark() {
  if (!state.currentBookId) return;
  const payload = {
    id: crypto.randomUUID(),
    user_id: currentUserId(),
    book_id: state.currentBookId,
    page: state.currentPage,
    created_at: new Date().toISOString()
  };
  state.bookmarks.push(payload);
  if (supabaseClient && state.user) await supabaseClient.from("bookmarks").insert(payload);
  else saveLocalData();
  renderReaderSide();
  toast("Bookmark saved");
}

async function addHighlight() {
  if (!state.currentBookId) return;
  const selected = String(window.getSelection()).trim();
  if (!selected) return toast("Select text first");
  const payload = {
    id: crypto.randomUUID(),
    user_id: currentUserId(),
    book_id: state.currentBookId,
    page: state.currentPage,
    text: selected.slice(0, 300),
    created_at: new Date().toISOString()
  };
  state.highlights.push(payload);
  if (supabaseClient && state.user) await supabaseClient.from("highlights").insert(payload);
  else saveLocalData();
  renderReaderSide();
  toast("Highlight saved");
}

async function addNote(event) {
  event.preventDefault();
  if (!state.currentBookId || !els.noteText.value.trim()) return;
  const payload = {
    id: crypto.randomUUID(),
    user_id: currentUserId(),
    book_id: state.currentBookId,
    page: state.currentPage,
    note: els.noteText.value.trim(),
    created_at: new Date().toISOString()
  };
  state.notes.push(payload);
  if (supabaseClient && state.user) await supabaseClient.from("notes").insert(payload);
  else saveLocalData();
  els.noteText.value = "";
  renderReaderSide();
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function chunkText(text) {
  const clean = text.trim() || "Uploaded text book";
  const chunks = clean.match(/[\s\S]{1,1800}/g) || [clean];
  return chunks.map((chunk, index) => ({ title: `Page ${index + 1}`, text: chunk.trim() }));
}

async function uploadFileToStorage(file, bookId) {
  if (!supabaseClient || !file) return null;
  const path = `${currentUserId()}/${bookId}-${file.name}`.replace(/\s+/g, "-");
  const { error } = await supabaseClient.storage.from(config.storageBucket || "ebooks").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabaseClient.storage.from(config.storageBucket || "ebooks").getPublicUrl(path);
  return data.publicUrl;
}

async function handleBookSubmit(event) {
  event.preventDefault();
  if (!canAuthor()) return toast("Login as author first");
  if (!els.rightsCheck.checked) return toast("Confirm publishing rights first");

  const editId = els.bookForm.dataset.editId;
  const file = els.bookFile.files[0];
  const bookId = editId || crypto.randomUUID();
  let fileData = null;
  let fileUrl = null;
  let chapters = null;
  let fileType = file?.type || "";
  let fileName = file?.name || "";

  if (file) {
    if (supabaseClient) fileUrl = await uploadFileToStorage(file, bookId);
    else fileData = await readFileAsDataUrl(file);
    if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
      chapters = chunkText(await readFileAsText(file));
      fileType = "text/plain";
    }
  }

  const payload = normalizeBook({
    id: bookId,
    title: els.bookTitle.value.trim(),
    author: els.bookAuthor.value.trim(),
    category: els.bookCategory.value.trim(),
    description: els.bookDescription.value.trim(),
    status: isAdmin() ? "approved" : "pending",
    owner_id: currentUserId(),
    file_name: fileName,
    file_type: fileType,
    file_url: fileUrl,
    file_data: fileData,
    rights_confirmed: true,
    views: 0,
    downloads: 0,
    chapters: chapters || [{ title: "Start", text: `${els.bookTitle.value.trim()}\n${els.bookAuthor.value.trim()}\n\nThis uploaded book is waiting for admin approval.` }]
  });

  if (editId) {
    const index = state.books.findIndex((book) => book.id === editId);
    state.books[index] = { ...state.books[index], ...payload };
  } else {
    state.books.unshift(payload);
  }

  if (supabaseClient) {
    await supabaseClient.from("books").upsert(payload);
    await loadRemoteData();
  } else {
    saveLocalData();
  }

  els.bookForm.reset();
  delete els.bookForm.dataset.editId;
  renderAll();
  setView("author");
  toast(payload.status === "approved" ? "Book published" : "Submitted for approval");
}

async function submitReport(event) {
  event.preventDefault();
  const payload = {
    id: crypto.randomUUID(),
    reporter_id: currentUserId(),
    book_id: els.reportBook.value,
    email: els.reportEmail.value.trim(),
    reason: els.reportReason.value.trim(),
    status: "open",
    created_at: new Date().toISOString()
  };
  state.reports.unshift(payload);
  if (supabaseClient) await supabaseClient.from("reports").insert(payload);
  else saveLocalData();
  els.reportForm.reset();
  renderAll();
  toast("Report submitted");
}

async function signup() {
  const fields = validateAuthFields();
  if (!fields) return;
  const { email, password } = fields;
  const role = els.authRole.value;
  const displayName = els.authName.value.trim() || email.split("@")[0];

  els.signupBtn.disabled = true;
  els.loginBtn.disabled = true;

  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      if (error) return toast(error.message);
      if (!data.user) return toast("Signup failed. Check your email confirmation settings.");
      state.user = data.user;
      const profile = { id: data.user.id, display_name: displayName, role };
      await supabaseClient.from("profiles").upsert(profile);
      state.profile = profile;
      await loadRemoteData();
    } else {
      state.user = { id: email.toLowerCase(), email };
      state.profile = { id: state.user.id, display_name: displayName, role };
      localStorage.setItem("sansbook.localUser", JSON.stringify(state.user));
      localStorage.setItem(localProfileKey(email), JSON.stringify(state.profile));
      loadLocalData();
    }

    els.authDialog.close();
    renderAll();
    toast(`Welcome, ${state.profile.display_name}`);
  } finally {
    els.signupBtn.disabled = false;
    els.loginBtn.disabled = false;
  }
}

async function login() {
  const fields = validateAuthFields();
  if (!fields) return;
  const { email, password } = fields;

  els.signupBtn.disabled = true;
  els.loginBtn.disabled = true;

  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) return toast(error.message);
      state.user = data.user;
      await loadProfile();
      await loadRemoteData();
    } else {
      state.user = { id: email.toLowerCase(), email };
      state.profile = JSON.parse(localStorage.getItem(localProfileKey(email)) || "null") || {
        id: state.user.id,
        display_name: email.split("@")[0],
        role: els.authRole.value
      };
      localStorage.setItem("sansbook.localUser", JSON.stringify(state.user));
      localStorage.setItem(localProfileKey(email), JSON.stringify(state.profile));
      loadLocalData();
    }

    els.authDialog.close();
    renderAll();
    toast(`Logged in as ${state.profile.display_name}`);
  } finally {
    els.signupBtn.disabled = false;
    els.loginBtn.disabled = false;
  }
}

async function logout() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  localStorage.removeItem("sansbook.localUser");
  state.user = { id: "guest", email: "guest@sansbook.local" };
  state.profile = { id: "guest", display_name: "Guest", role: "reader" };
  loadLocalData();
  renderAll();
  toast("Logged out");
}

function bindEvents() {
  els.navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setView(link.dataset.view);
    });
  });
  document.querySelectorAll("[data-go]").forEach((btn) => btn.addEventListener("click", () => setView(btn.dataset.go)));
  document.querySelector("#browseBtn").addEventListener("click", () => {
    setView("home");
    els.globalSearchInput.focus();
  });
  document.querySelector("#openAuthorBtn").addEventListener("click", () => setView("author"));
  els.openAuthBtn.addEventListener("click", () => {
    els.authForm.reset();
    els.authDialog.showModal();
    els.authEmail.focus();
  });
  els.closeAuthBtn.addEventListener("click", () => els.authDialog.close());
  els.logoutBtn.addEventListener("click", logout);
  els.authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    login();
  });
  els.signupBtn.addEventListener("click", signup);
  const handleGlobalSearch = () => {
    if (els.searchInput) els.searchInput.value = els.globalSearchInput.value;
    renderBooks();
    renderLibrary();
    renderContinueReading();
  };
  els.globalSearchInput.addEventListener("input", handleGlobalSearch);
  els.searchInput.addEventListener("input", () => {
    els.globalSearchInput.value = els.searchInput.value;
    handleGlobalSearch();
  });
  els.categoryFilter.addEventListener("change", handleGlobalSearch);
  els.readerSearchInput.addEventListener("input", () => runReaderSearch(true));
  els.readerSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      stepReaderSearch(event.shiftKey ? -1 : 1);
    }
  });
  els.readerSearchPrev.addEventListener("click", () => stepReaderSearch(-1));
  els.readerSearchNext.addEventListener("click", () => stepReaderSearch(1));
  els.readerSearchClear.addEventListener("click", clearReaderSearch);
  els.bookForm.addEventListener("submit", handleBookSubmit);
  els.reportForm.addEventListener("submit", submitReport);
  els.noteForm.addEventListener("submit", addNote);

  document.querySelector("#increaseFontBtn").addEventListener("click", () => {
    state.readerSize = Math.min(28, state.readerSize + 1);
    document.documentElement.style.setProperty("--reader-size", `${state.readerSize}px`);
    saveLocalData();
  });
  document.querySelector("#decreaseFontBtn").addEventListener("click", () => {
    state.readerSize = Math.max(14, state.readerSize - 1);
    document.documentElement.style.setProperty("--reader-size", `${state.readerSize}px`);
    saveLocalData();
  });
  document.querySelector("#prevPageBtn").addEventListener("click", () => {
    const book = state.books.find((item) => item.id === state.currentBookId);
    if (!book) return;
    state.currentPage = Math.max(0, state.currentPage - 1);
    renderReaderBook(book);
    saveProgress();
  });
  document.querySelector("#nextPageBtn").addEventListener("click", () => {
    const book = state.books.find((item) => item.id === state.currentBookId);
    if (!book) return;
    state.currentPage = Math.min((book.chapters?.length || 1) - 1, state.currentPage + 1);
    renderReaderBook(book);
    saveProgress();
  });
  document.querySelector("#saveProgressBtn").addEventListener("click", async () => {
    await saveProgress();
    toast("Progress saved");
  });
  document.querySelector("#bookmarkBtn").addEventListener("click", addBookmark);
  document.querySelector("#highlightBtn").addEventListener("click", addHighlight);
  els.generateSummaryBtn.addEventListener("click", () => {
    const book = state.books.find((item) => item.id === state.currentBookId);
    if (book) updateSummaryPanel(book);
  });
  els.themeToggleBtn.addEventListener("click", toggleTheme);
  document.addEventListener("keydown", (event) => {
    if (!document.querySelector("#readerView").classList.contains("active")) return;
    if (event.target.matches("input, textarea, select")) return;
    const book = state.books.find((item) => item.id === state.currentBookId);
    if (!book) return;
    if (event.key === "ArrowLeft") {
      state.currentPage = Math.max(0, state.currentPage - 1);
      renderReaderBook(book);
      saveProgress();
    } else if (event.key === "ArrowRight") {
      state.currentPage = Math.min((book.chapters?.length || 1) - 1, state.currentPage + 1);
      renderReaderBook(book);
      saveProgress();
    }
  });
  els.makeAdminBtn.addEventListener("click", async () => {
    state.profile.role = "admin";
    if (supabaseClient && state.user) {
      await supabaseClient.from("profiles").update({ role: "admin" }).eq("id", state.user.id);
    } else {
      localStorage.setItem(localProfileKey(state.user.email), JSON.stringify(state.profile));
    }
    renderAll();
    toast("Admin role enabled");
  });
  document.querySelector("#resetDemoBtn").addEventListener("click", () => {
    ["sansbook.books", "sansbook.reports"].forEach((key) => localStorage.removeItem(key));
    Object.keys(localStorage).filter((key) => key.startsWith("sansbook.") && key.includes(currentUserId())).forEach((key) => localStorage.removeItem(key));
    loadLocalData();
    renderAll();
  });
}

async function init() {
  bindEvents();
  await loadState();
  renderAll();
  const initial = location.hash.replace("#", "");
  setView(["home", "library", "reader", "author", "admin", "legal"].includes(initial) ? initial : "home");
}

init();
