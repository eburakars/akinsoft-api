const DEFAULT_BASE_URL = "http://localhost:4567";
const STORAGE_KEY = "akinsoft:baseUrl";

const ITEM_FIELD_DEFINITIONS = [
    { key: "blstcode", label: "BLST Kodu", type: "int", placeholder: "99840" },
    { key: "quantity", label: "Miktar", type: "number", placeholder: "1" },
    { key: "price", label: "Birim Fiyatı", type: "number", placeholder: "12.50" },
    { key: "unit", label: "Birim", type: "text", placeholder: "ADET" },
    { key: "tax", label: "KDV (%)", type: "number", placeholder: "18" }
];

const state = {
    baseUrl: loadBaseUrl()
};

const app = document.getElementById("app");

init();

function init() {
    renderLayout();
    hydrateBaseControls();
    hydrateItemLookup();
    hydrateTransactionLookup();
    hydrateCreateTransactionForm();
}

function loadBaseUrl() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return normalizeBaseUrl(stored);
        }
    } catch (error) {
        // localStorage kullanılamıyorsa varsayılan değeri döndür
    }
    return DEFAULT_BASE_URL;
}

function storeBaseUrl(value) {
    try {
        localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
        // görmezden gel
    }
}

function normalizeBaseUrl(url) {
    if (!url) {
        return DEFAULT_BASE_URL;
    }
    return url.trim().replace(/\/+$/, "");
}

function renderLayout() {
    app.innerHTML = `
        <section id="connection">
            <div class="flex-between">
                <h2>API Bağlantısı</h2>
                <span class="badge">Varsayılan ${DEFAULT_BASE_URL}</span>
            </div>
            <form id="connectionForm">
                <label for="baseUrl">Temel URL</label>
                <div class="inline">
                    <input id="baseUrl" name="baseUrl" type="text" value="${state.baseUrl}" placeholder="http://localhost:4567" />
                    <button type="submit">Kaydet</button>
                    <button type="button" class="secondary" id="resetBaseUrl">Sıfırla</button>
                </div>
                <p class="hint">Arayüz tüm istekleri bu adres üzerinden gönderir. Test etmeden önce arka servisin çalıştığından emin olun.</p>
            </form>
        </section>

        <section id="items">
            <h2>Stok Kartı Arama</h2>
            <form id="itemForm">
                <div class="inline">
                    <div>
                        <label for="skuInput">Stok Kodları (virgülle ayrılmış)</label>
                        <input id="skuInput" name="sku" type="text" placeholder="CEM0100, ADEL2996" />
                    </div>
                    <div>
                        <label for="barcodeInput">Barkodlar (virgülle ayrılmış)</label>
                        <input id="barcodeInput" name="barcode" type="text" placeholder="8413240602088" />
                    </div>
                </div>
                <div class="actions">
                    <button type="button" data-endpoint="/item" data-mode="item">Stok Kartlarını Getir</button>
                    <button type="button" data-endpoint="/itemwithsaleprice" data-mode="itemwithprice" class="secondary">Satış Fiyatıyla Getir</button>
                    <button type="button" data-endpoint="/prices" data-mode="prices" class="secondary">Fiyat Listesi</button>
                </div>
            </form>
            <div class="response-panel" id="itemResponse"></div>
        </section>

        <section id="transactions">
            <h2>Stok Hareketlerini Listele</h2>
            <form id="transactionForm">
                <div class="inline">
                    <div>
                        <label for="dateStart">Başlangıç Tarihi</label>
                        <input id="dateStart" name="datestart" type="date" />
                    </div>
                    <div>
                        <label for="dateEnd">Bitiş Tarihi</label>
                        <input id="dateEnd" name="dateend" type="date" />
                    </div>
                </div>
                <div class="actions">
                    <button type="submit">Hareketleri Getir</button>
                </div>
            </form>
            <div class="response-panel" id="transactionResponse"></div>
        </section>

        <section id="create-transaction">
            <h2>Stok Hareketi Kaydet</h2>
            <form id="createForm">
                <div class="inline">
                    <div>
                        <label for="roundInput">Tür (0: alış, 1: satış)</label>
                        <input id="roundInput" name="round" type="number" min="0" max="1" value="0" />
                    </div>
                </div>
                <div id="lineItems" class="list-table"></div>
                <div class="actions">
                    <button type="button" class="secondary" id="addLine">Satır Ekle</button>
                    <button type="submit">Hareketi Gönder</button>
                </div>
            </form>
            <div class="response-panel" id="createResponse"></div>
        </section>
    `;
}

function hydrateBaseControls() {
    const form = document.getElementById("connectionForm");
    const baseInput = document.getElementById("baseUrl");
    const resetBtn = document.getElementById("resetBaseUrl");

    form.addEventListener("submit", event => {
        event.preventDefault();
        const input = normalizeBaseUrl(baseInput.value);
        if (!input) {
            baseInput.value = state.baseUrl;
            return;
        }
        state.baseUrl = input;
        baseInput.value = state.baseUrl;
        storeBaseUrl(state.baseUrl);
        showToastInline(form, `${state.baseUrl} adresi kaydedildi.`);
    });

    resetBtn.addEventListener("click", () => {
        state.baseUrl = DEFAULT_BASE_URL;
        baseInput.value = state.baseUrl;
        storeBaseUrl(state.baseUrl);
        showToastInline(form, "Varsayılan URL'e dönüldü.");
    });
}

function hydrateItemLookup() {
    const form = document.getElementById("itemForm");
    const responseEl = document.getElementById("itemResponse");
    const buttons = form.querySelectorAll("button[data-endpoint]");
    buttons.forEach(button => {
        button.addEventListener("click", async () => {
            const endpoint = button.dataset.endpoint;
            const mode = button.dataset.mode;
            const query = buildItemQuery(form);
            await handleRequest(`${endpoint}${query}`, responseEl, payload => renderItemResponse(payload, mode, responseEl));
        });
    });
}

function hydrateTransactionLookup() {
    const form = document.getElementById("transactionForm");
    const responseEl = document.getElementById("transactionResponse");
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    form.datestart.value = formatDateInput(sevenDaysAgo);
    form.dateend.value = formatDateInput(today);

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const start = form.datestart.value;
        const end = form.dateend.value;
        if (!start || !end) {
            renderError(responseEl, "Başlangıç ve bitiş tarihleri zorunludur.");
            return;
        }
        const params = `?datestart=${encodeURIComponent(start)}&dateend=${encodeURIComponent(end)}`;
        await handleRequest(`/stocktransactions${params}`, responseEl, payload => renderTransactions(payload, responseEl));
    });
}

function hydrateCreateTransactionForm() {
    const container = document.getElementById("lineItems");
    const addButton = document.getElementById("addLine");
    const form = document.getElementById("createForm");

    addLineItem(container);

    addButton.addEventListener("click", () => addLineItem(container));

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const responseEl = document.getElementById("createResponse");
        const roundRaw = form.round.value.trim();
        const round = Number(roundRaw);
        if (!Number.isInteger(round) || round < 0 || round > 1) {
            renderError(responseEl, "Tür alanı 0 (alış) veya 1 (satış) olmalıdır.");
            return;
        }

        let lineItems;
        try {
            lineItems = collectLineItems(container);
        } catch (error) {
            renderError(responseEl, error.message);
            return;
        }

        if (!lineItems.length) {
            renderError(responseEl, "En az bir satır ekleyin.");
            return;
        }

        const body = JSON.stringify(lineItems);
        const path = `/stocktransaction?round=${round}`;
        await handleRequest(path, responseEl, payload => renderCreateTransactionResponse(payload, responseEl), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body
        });
    });
}

function addLineItem(container, prefill = {}) {
    const row = document.createElement("div");
    row.className = "list-row";
    ITEM_FIELD_DEFINITIONS.forEach(field => {
        const wrapper = document.createElement("label");
        wrapper.textContent = field.label;
        const input = document.createElement("input");
        input.type = field.type === "text" ? "text" : "number";
        if (field.type === "number") {
            input.step = "0.01";
        }
        if (field.type === "int") {
            input.type = "number";
            input.step = "1";
        }
        input.placeholder = field.placeholder;
        input.dataset.field = field.key;
        input.value = prefill[field.key] ?? "";
        wrapper.appendChild(input);
        row.appendChild(wrapper);
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-btn";
    removeButton.textContent = "Sil";
    removeButton.addEventListener("click", () => {
        row.remove();
        if (!container.querySelector(".list-row")) {
            addLineItem(container);
        }
    });
    row.appendChild(removeButton);

    container.appendChild(row);
}

function collectLineItems(container) {
    const rows = Array.from(container.querySelectorAll(".list-row"));
    return rows.map(row => {
        const line = {};
        for (const field of ITEM_FIELD_DEFINITIONS) {
            const input = row.querySelector(`[data-field="${field.key}"]`);
            const value = input.value.trim();
            if (!value) {
                throw new Error(`${field.label} tüm satırlar için zorunludur.`);
            }
            if (field.type === "text") {
                line[field.key] = value;
            } else {
                const numberValue = Number(value);
                if (!Number.isFinite(numberValue)) {
                    throw new Error(`${field.label} sayısal bir değer olmalıdır.`);
                }
                line[field.key] = field.type === "int" ? Math.round(numberValue) : numberValue;
            }
        }
        return line;
    });
}

async function handleRequest(path, container, onSuccess, options = {}) {
    showLoading(container);
    try {
        const payload = await apiFetch(path, options);
        onSuccess(payload);
    } catch (error) {
        renderError(container, error.message || "İstek başarısız oldu.");
    }
}

async function apiFetch(path, options = {}) {
    const sanitizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${state.baseUrl}${sanitizedPath}`;
    const response = await fetch(url, {
        headers: {
            Accept: "application/json",
            ...(options.headers || {})
        },
        ...options
    });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(`HTTP ${response.status} ${response.statusText}${bodyText ? ` - ${bodyText}` : ""}`);
    }
    if (contentType.includes("application/json")) {
        return response.json();
    }
    if (contentType.includes("text")) {
        return response.text();
    }
    return response;
}

function buildItemQuery(form) {
    const formData = new FormData(form);
    const params = new URLSearchParams();
    parseList(formData.get("sku"))?.forEach(value => params.append("sku", value));
    parseList(formData.get("barcode"))?.forEach(value => params.append("barcode", value));
    const query = params.toString();
    return query ? `?${query}` : "";
}

function parseList(value) {
    if (!value) {
        return [];
    }
    return value
        .split(/[\s,]+/)
        .map(entry => entry.trim())
        .filter(Boolean);
}

function renderItemResponse(payload, mode, container) {
    container.classList.remove("dark");
    container.innerHTML = "";
    const items = payload && Array.isArray(payload.items) ? payload.items : [];
    const responseText = typeof payload?.response === "string" ? payload.response : null;

    if (!items.length) {
        const message = responseText && responseText !== "ok" ? responseText : "Eşleşen stok kartı bulunamadı.";
        container.appendChild(buildToast(message, true));
        container.appendChild(buildRawDetails(payload));
        return;
    }

    container.appendChild(buildToast(`${items.length} adet stok kartı bulundu.`));

    if (mode === "prices") {
        container.appendChild(renderPriceBook(items));
    } else {
        container.appendChild(renderItemTable(items, mode));
    }
    container.appendChild(buildRawDetails(payload));
}

function renderItemTable(items, mode) {
    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const headers = ["Ürün Adı", "Stok Kodu", "Birim", "KDV (%)", "Ara Grup", "Alt Grup"];
    if (mode === "itemwithprice") {
        headers.push("Satış Fiyatı (KDV Dahil)");
    }
    headers.forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    items.forEach(item => {
        const row = document.createElement("tr");
        row.appendChild(buildCell(item.name));
        row.appendChild(buildCell(item.sku));
        row.appendChild(buildCell(item.unit));
        row.appendChild(buildCell(item.tax));
        row.appendChild(buildCell(item.intermediate_group));
        row.appendChild(buildCell(item.alt_group));
        if (mode === "itemwithprice") {
            row.appendChild(buildCell(formatCurrency(withVat(item.price, item.tax))));
        }
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    wrapper.appendChild(table);
    return wrapper;
}

function renderPriceBook(items) {
    const wrapper = document.createElement("div");
    wrapper.className = "grid";
    items.forEach(item => {
        const card = document.createElement("div");
        card.className = "price-card";

        const header = document.createElement("div");
        header.className = "flex-between";
        const sku = document.createElement("strong");
        sku.textContent = item.sku || "Stok kodu bilinmiyor";
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = `BLST ${item.blstcode}`;
        header.appendChild(sku);
        header.appendChild(badge);

        const name = document.createElement("span");
        name.textContent = item.name || "İsimsiz stok kartı";
        card.appendChild(header);
        card.appendChild(name);

        if (item.barcode) {
            const barcode = document.createElement("span");
            barcode.className = "hint";
            barcode.textContent = `Barkod: ${item.barcode}`;
            card.appendChild(barcode);
        }

        const sellList = buildPriceList("Satış fiyatları", item.sell_prices, item.tax);
        const buyList = buildPriceList("Alış fiyatları", item.buy_prices, item.tax);

        card.appendChild(sellList);
        card.appendChild(buyList);
        wrapper.appendChild(card);
    });
    return wrapper;
}

function buildPriceList(label, prices = [], tax) {
    const container = document.createElement("div");
    container.className = "price-list";
    const title = document.createElement("span");
    title.className = "price-list__title";
    title.textContent = `${label} (${prices.length})`;
    container.appendChild(title);
    if (!prices.length) {
        const empty = document.createElement("span");
        empty.className = "price-list__empty";
        empty.textContent = "Kayıt yok";
        container.appendChild(empty);
        return container;
    }
    prices.forEach(price => {
        const row = document.createElement("div");
        row.className = "price-list__row";
        const left = document.createElement("span");
        left.textContent = price.defination || "İsimsiz";
        const right = document.createElement("span");
        right.textContent = `${formatCurrency(withVat(price.price, tax))} (ID ${price.id})`;
        row.appendChild(left);
        row.appendChild(right);
        container.appendChild(row);
    });
    return container;
}

function renderTransactions(payload, container) {
    container.classList.remove("dark");
    container.innerHTML = "";
    const rows = Array.isArray(payload) ? payload : [];
    if (!rows.length) {
        container.appendChild(buildToast("Seçilen tarih aralığında hareket bulunamadı.", true));
        container.appendChild(buildRawDetails(payload));
        return;
    }
    container.appendChild(buildToast(`${rows.length} adet hareket listelendi.`));
    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Tarih", "Evrak No", "Ürün Adı", "Stok Kodu", "Miktar", "Birim", "Birim Fiyatı (KDV Dahil)", "Tutar (KDV Dahil)", "Tür", "KDV (%)"]
        .forEach(text => {
            const th = document.createElement("th");
            th.textContent = text;
            headerRow.appendChild(th);
        });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    rows.forEach(item => {
        const row = document.createElement("tr");
        const grossUnit = withVat(item.price, item.tax);
        const grossTotal = withVat(item.price_total, item.tax);
        row.appendChild(buildCell(item.date));
        row.appendChild(buildCell(item.doc_id));
        row.appendChild(buildCell(item.name));
        row.appendChild(buildCell(item.sku));
        row.appendChild(buildCell(formatQuantity(item.quantity)));
        row.appendChild(buildCell(item.unit));
        row.appendChild(buildCell(formatCurrency(grossUnit)));
        row.appendChild(buildCell(formatCurrency(grossTotal)));
        row.appendChild(buildCell(formatRound(item.round)));
        row.appendChild(buildCell(item.tax));
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    wrapper.appendChild(table);
    container.appendChild(wrapper);
    container.appendChild(buildRawDetails(rows));
}

function renderCreateTransactionResponse(payload, container) {
    container.classList.remove("dark");
    container.innerHTML = "";
    const responseText = typeof payload?.response === "string" ? payload.response : null;
    if (responseText && responseText !== "ok") {
        container.appendChild(buildToast(responseText, true));
    } else {
        container.appendChild(buildToast("Stok hareketi başarıyla kaydedildi."));
    }
    container.appendChild(buildRawDetails(payload));
}

function buildCell(value) {
    const td = document.createElement("td");
    td.textContent = value ?? "-";
    return td;
}

function formatRound(round) {
    return round === 1 ? "Satış" : "Alış";
}

function formatCurrency(value) {
    if (value === undefined || value === null || !Number.isFinite(Number(value))) {
        return "-";
    }
    return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatQuantity(value) {
    if (value === undefined || value === null || !Number.isFinite(Number(value))) {
        return "-";
    }
    return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function withVat(value, tax) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return value;
    }
    const numericTax = Number(tax);
    if (!Number.isFinite(numericTax)) {
        return numeric;
    }
    const multiplier = 1 + numericTax / 100;
    const candidate = numeric * multiplier;
    if (Math.abs(candidate - numeric) < 0.01) {
        return numeric;
    }
    return candidate;
}

function showLoading(container) {
    container.classList.remove("dark");
    container.innerHTML = "<span>Yükleniyor...</span>";
}

function renderError(container, message) {
    container.classList.remove("dark");
    container.innerHTML = "";
    container.appendChild(buildToast(message, true));
}

function buildToast(message, isError = false) {
    const toast = document.createElement("div");
    toast.className = `toast${isError ? " error" : ""}`;
    toast.textContent = message;
    return toast;
}

function buildRawDetails(payload) {
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Ham yanıtı göster";
    const pre = document.createElement("pre");
    pre.textContent = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
    details.appendChild(summary);
    details.appendChild(pre);
    return details;
}

function showToastInline(form, message) {
    const existing = form.querySelector(".inline-toast");
    if (existing) {
        existing.remove();
    }
    const toast = document.createElement("div");
    toast.className = "toast inline-toast";
    toast.textContent = message;
    form.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
