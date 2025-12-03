
// --- Estado de la Aplicación ---
const state = {
  products: [],
  config: {
    labels: [], 
    discounts: [], 
    benefits: [], 
    links: [] 
  },
  activeLabel: "", 
  activePercent: 0, 
  
  cart: [], 
  vendor: {
    company: "IMPERDELLANTA",
    name: "PEDRO - Gerente de Marketing y Ventas",
    phone: "2228 49 69 95"
  },
  client: {
    name: "Validado por Marketing y Ventas",
    phone: ""
  },
  view: "catalog" 
};

// --- Referencias DOM ---
const refs = {
  viewCatalog: document.getElementById('view-catalog'),
  viewQuote: document.getElementById('view-quote'),
  tabCatalog: document.getElementById('tab-catalog'),
  tabQuote: document.getElementById('tab-quote'),
  cartBadge: document.getElementById('cart-badge'),
  cartBody: document.getElementById('cart-body'),
  cartTable: document.getElementById('cart-table'),
  emptyCartMsg: document.getElementById('empty-cart-msg'),
  totalAmount: document.getElementById('total-amount'),
  
  // Tactical Footer
  benefitsList: document.getElementById('benefits-list'),
  linksContainer: document.getElementById('links-container'),
  
  // Quick Actions & Contact
  quickContactContainer: document.getElementById('quick-contact-container'),
  quickCallBtn: document.getElementById('quick-call-btn'),
  quickWaBtn: document.getElementById('quick-wa-btn'),
  headerPhoneLink: document.getElementById('header-phone-link'),
  distributorBtn: document.getElementById('btn-distributor-cta'),
  
  // Selectors
  labelSelector: document.getElementById('promo-label-selector'),
  percentSelector: document.getElementById('percentage-selector'),
  
  // Inputs
  inputs: {
    vendorCompany: document.getElementById('vendor-company'),
    vendorName: document.getElementById('vendor-name'),
    vendorPhone: document.getElementById('vendor-phone'),
    clientName: document.getElementById('client-name'),
    clientPhone: document.getElementById('client-phone'),
  },

  // Print Labels
  print: {
    company: document.getElementById('print-company'),
    vendorName: document.getElementById('print-vendor-name'),
    vendorPhone: document.getElementById('print-vendor-phone'),
    date: document.getElementById('print-date'),
    clientName: document.getElementById('print-client-name'),
    clientPhone: document.getElementById('print-client-phone'),
    labelText: document.getElementById('print-label-text'),
    discountVal: document.getElementById('print-discount-val'),
  }
};

// --- Helpers ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2
  }).format(amount);
};

const getEffectivePrice = (product) => {
  if (state.activePercent === 0) {
    return Math.round(product.precio_lista);
  }
  const factor = 1 - (state.activePercent / 100);
  return Math.round(product.precio_lista * factor);
};

const cleanPhone = (phone) => phone.replace(/[^0-9]/g, "");

// --- Inicialización ---
async function init() {
  try {
    const response = await fetch('precios.json');
    const data = await response.json();
    
    state.products = data.productos || [];
    state.config.labels = data.configuracion_precios.etiquetas_estrategia || [];
    state.config.discounts = data.configuracion_precios.niveles_descuento || [0];
    state.config.benefits = data.configuracion_precios.beneficios_tacticos || [];
    state.config.links = data.configuracion_precios.recursos_digitales || [];
    
    state.activeLabel = state.config.labels[0] || "Estándar";
    state.activePercent = state.config.discounts[0] || 0;
    
    refs.inputs.vendorCompany.value = state.vendor.company;
    refs.inputs.vendorName.value = state.vendor.name;
    refs.inputs.vendorPhone.value = state.vendor.phone;
    refs.inputs.clientName.value = state.client.name;
    
    renderSelectors();
    renderTacticalFooter();
    bindEvents();
    renderCatalog();
    updatePrintHeader(); 
    updateContactLinks();
  } catch (error) {
    console.error("Error cargando precios:", error);
    refs.viewCatalog.innerHTML = `<p class="text-danger">Error cargando base de datos. Verifica precios.json</p>`;
  }
}

function renderSelectors() {
  refs.labelSelector.innerHTML = '';
  state.config.labels.forEach(label => {
    const option = document.createElement('option');
    option.value = label;
    option.textContent = label;
    refs.labelSelector.appendChild(option);
  });
  refs.labelSelector.value = state.activeLabel;

  refs.percentSelector.innerHTML = '';
  state.config.discounts.forEach(pct => {
    const option = document.createElement('option');
    option.value = pct;
    option.textContent = pct === 0 ? "0% (Lista)" : `-${pct}% Descuento`;
    refs.percentSelector.appendChild(option);
  });
  refs.percentSelector.value = state.activePercent;
}

function renderTacticalFooter() {
  // Render Benefits
  refs.benefitsList.innerHTML = '';
  state.config.benefits.forEach(benefit => {
    const li = document.createElement('li');
    li.textContent = `✓ ${benefit}`;
    refs.benefitsList.appendChild(li);
  });

  // Render Links as TEXT LINKS (Simple)
  refs.linksContainer.innerHTML = '';
  state.config.links.forEach(link => {
    const a = document.createElement('a');
    a.href = link.url;
    a.target = "_blank";
    a.className = "resource-link"; 
    a.textContent = `> ${link.texto}`; // Formato texto simple
    refs.linksContainer.appendChild(a);
  });
}

function updateContactLinks() {
  const phone = cleanPhone(state.vendor.phone);
  
  // Header Phone
  refs.headerPhoneLink.href = `tel:${phone}`;
  
  // Quick Action Buttons
  refs.quickCallBtn.href = `tel:${phone}`;
  refs.quickCallBtn.textContent = `📞 Llamar al Vendedor`;

  refs.quickWaBtn.href = `https://wa.me/52${phone}?text=${encodeURIComponent("Hola Pedro, revisando la cotización.")}`;
  refs.quickWaBtn.textContent = `💬 WhatsApp Vendedor`;

  // Distributor CTA
  const distMsg = "Hola, me interesa ser distribuidor de IMPERDELLANTA. Solicito información.";
  refs.distributorBtn.href = `https://wa.me/52${phone}?text=${encodeURIComponent(distMsg)}`;
}

// --- Event Listeners ---
function bindEvents() {
  refs.tabCatalog.addEventListener('click', () => switchView('catalog'));
  refs.tabQuote.addEventListener('click', () => switchView('quote'));

  refs.labelSelector.addEventListener('change', (e) => {
    state.activeLabel = e.target.value;
    updatePrintHeader();
  });

  refs.percentSelector.addEventListener('change', (e) => {
    state.activePercent = parseInt(e.target.value, 10);
    renderCatalog();
    if (state.view === 'quote') renderCart();
    updatePrintHeader();
  });

  const bindInput = (el, category, field) => {
    el.addEventListener('input', (e) => {
      state[category][field] = e.target.value;
      updatePrintHeader();
      if(field === 'phone' && category === 'vendor') updateContactLinks();
    });
  };

  bindInput(refs.inputs.vendorCompany, 'vendor', 'company');
  bindInput(refs.inputs.vendorName, 'vendor', 'name');
  bindInput(refs.inputs.vendorPhone, 'vendor', 'phone');
  bindInput(refs.inputs.clientName, 'client', 'name');
  bindInput(refs.inputs.clientPhone, 'client', 'phone');

  document.getElementById('btn-print').addEventListener('click', handlePrint);
  document.getElementById('btn-whatsapp').addEventListener('click', handleWhatsApp);
}

// --- Lógica de Negocio ---
function switchView(viewName) {
  state.view = viewName;
  
  if (viewName === 'catalog') {
    refs.viewCatalog.classList.remove('hidden');
    refs.viewQuote.classList.add('hidden');
    refs.tabCatalog.classList.add('bg-accent', 'text-black');
    refs.tabCatalog.classList.remove('bg-slate-800', 'text-gray-400');
    refs.tabQuote.classList.remove('bg-accent', 'text-black');
    refs.tabQuote.classList.add('bg-slate-800', 'text-gray-400');
    renderCatalog(); 
  } else {
    refs.viewCatalog.classList.add('hidden');
    refs.viewQuote.classList.remove('hidden');
    refs.tabCatalog.classList.remove('bg-accent', 'text-black');
    refs.tabCatalog.classList.add('bg-slate-800', 'text-gray-400');
    refs.tabQuote.classList.add('bg-accent', 'text-black');
    refs.tabQuote.classList.remove('bg-slate-800', 'text-gray-400');
    renderCart();
  }
}

function addToCart(sku) {
  const product = state.products.find(p => p.sku === sku);
  const existing = state.cart.find(c => c.sku === sku);
  if (existing) {
    existing.quantity++;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }
  updateCartUI();
  renderCatalog(); 
}

function updateQuantity(sku, delta) {
  const item = state.cart.find(c => c.sku === sku);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(sku);
    } else {
      updateCartUI();
      renderCatalog();
      if(state.view === 'quote') renderCart();
    }
  }
}

function removeFromCart(sku) {
  state.cart = state.cart.filter(c => c.sku !== sku);
  updateCartUI();
  renderCatalog();
  if(state.view === 'quote') renderCart();
}

function updateCartUI() {
  const totalItems = state.cart.length;
  refs.cartBadge.textContent = totalItems;
  refs.cartBadge.classList.toggle('hidden', totalItems === 0);
}

function updatePrintHeader() {
  refs.print.company.textContent = state.vendor.company || "EMPRESA";
  refs.print.vendorName.textContent = state.vendor.name;
  refs.print.vendorPhone.textContent = state.vendor.phone;
  refs.print.clientName.textContent = state.client.name || "Mostrador";
  refs.print.clientPhone.textContent = state.client.phone;
  refs.print.date.textContent = new Date().toLocaleDateString();
  refs.print.labelText.textContent = state.activeLabel;
  
  if (state.activePercent > 0) {
    refs.print.discountVal.textContent = `Desc. Aplicado: ${state.activePercent}%`;
  } else {
    refs.print.discountVal.textContent = "Precio Neto";
  }
}

function renderCatalog() {
  refs.viewCatalog.innerHTML = '';
  const template = document.getElementById('tpl-product');

  state.products.forEach(product => {
    const clone = template.content.cloneNode(true);
    const cartItem = state.cart.find(c => c.sku === product.sku);
    const finalPrice = getEffectivePrice(product);

    clone.querySelector('.sku').textContent = product.sku;
    clone.querySelector('.name').textContent = product.nombre_producto;
    clone.querySelector('.desc').textContent = product.descripcion || "";
    clone.querySelector('.price').textContent = formatCurrency(finalPrice);
    
    const hasDiscount = state.activePercent > 0;
    if (hasDiscount) {
      const oldPriceEl = clone.querySelector('.old-price');
      oldPriceEl.textContent = formatCurrency(product.precio_lista);
      oldPriceEl.classList.remove('hidden');
      const badge = clone.querySelector('.badge');
      badge.textContent = `-${state.activePercent}%`;
      badge.classList.remove('hidden');
    }

    const btnAdd = clone.querySelector('.btn-add');
    const qtyControl = clone.querySelector('.qty-control');

    if (cartItem) {
      btnAdd.classList.add('hidden');
      qtyControl.classList.remove('hidden');
      qtyControl.classList.add('flex');
      clone.querySelector('.qty-display').textContent = cartItem.quantity;
      clone.querySelector('.btn-minus').addEventListener('click', () => updateQuantity(product.sku, -1));
      clone.querySelector('.btn-plus').addEventListener('click', () => updateQuantity(product.sku, 1));
    } else {
      btnAdd.addEventListener('click', () => addToCart(product.sku));
    }
    refs.viewCatalog.appendChild(clone);
  });
}

function renderCart() {
  refs.cartBody.innerHTML = '';
  const template = document.getElementById('tpl-cart-row');
  let grandTotal = 0;

  if (state.cart.length === 0) {
    refs.cartTable.classList.add('hidden');
    refs.emptyCartMsg.classList.remove('hidden');
    refs.quickContactContainer.classList.add('hidden'); // Ocultar botones rapidos si no hay cotizacion
    refs.totalAmount.textContent = formatCurrency(0);
    return;
  }

  refs.cartTable.classList.remove('hidden');
  refs.emptyCartMsg.classList.add('hidden');
  refs.quickContactContainer.classList.remove('hidden'); // Mostrar botones rapidos

  state.cart.forEach(item => {
    const price = getEffectivePrice(item); 
    const total = price * item.quantity;
    grandTotal += total;

    const clone = template.content.cloneNode(true);
    clone.querySelector('.row-name').textContent = item.nombre_producto;
    clone.querySelector('.row-sku').textContent = item.sku;
    clone.querySelector('.row-qty').textContent = item.quantity;
    clone.querySelector('.row-price').textContent = formatCurrency(price);
    clone.querySelector('.row-total').textContent = formatCurrency(total);
    clone.querySelector('.btn-remove').addEventListener('click', () => removeFromCart(item.sku));
    refs.cartBody.appendChild(clone);
  });

  refs.totalAmount.textContent = formatCurrency(grandTotal);
}

function handlePrint() {
  switchView('quote');
  const btn = document.getElementById('btn-print');
  const originalText = btn.textContent;
  
  btn.textContent = "⏳ Generando documento...";
  btn.classList.add('opacity-50', 'cursor-not-allowed');

  setTimeout(() => {
    try {
      window.print();
    } catch (e) {
      alert("Navegador bloqueó impresión.");
    } finally {
      btn.textContent = originalText;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }, 500);
}

function handleWhatsApp() {
  let grandTotal = 0;
  const discountText = state.activePercent > 0 ? `(-${state.activePercent}%)` : "";
  const strategyTitle = `${state.activeLabel} ${discountText}`;
  
  const itemsList = state.cart.map(item => {
    const price = getEffectivePrice(item);
    grandTotal += price * item.quantity;
    return `• ${item.quantity}x ${item.nombre_producto} (${formatCurrency(price)})`;
  }).join("\n");

  const linksText = state.config.links.map(l => `🔗 ${l.texto}: ${l.url}`).join("\n");

  const message = `*COTIZACIÓN - ${state.vendor.company}*\n` +
    `*Estrategia:* ${strategyTitle}\n\n` +
    `Hola ${state.client.name}, tu presupuesto:\n\n` +
    `${itemsList}\n\n` +
    `*TOTAL: ${formatCurrency(grandTotal)}*\n` +
    `------------------\n` +
    `*RECURSOS Y DOCUMENTACIÓN:*\n` +
    `${linksText}\n` +
    `------------------\n` +
    `Atendido por: ${state.vendor.name}`;

  const clean = cleanPhone(state.client.phone);
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

init();
