import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Pencil, X, Check, Package, ChefHat, TriangleAlert, ChevronRight, ChevronUp, ShoppingCart, LineChart, PackagePlus, Settings2, LogOut, Store, ArrowRight, Copy, KeyRound, ArrowLeft, UploadCloud, CheckCircle2, FileText, Sparkles, Loader2, AlertCircle, Receipt, Minus, Search, Mail, Activity } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from './supabaseClient';

const UNIT_LABEL = { g: 'g', ml: 'ml', unidad: 'u' };

const emptyInsumo = () => ({ id: crypto.randomUUID(), nombre: '', unidadBase: 'g', cantidadCompra: '', precioCompra: '', stockActual: '' });
const emptyProducto = () => ({ id: crypto.randomUUID(), nombre: '', precioVenta: '', categoria: 'Platos', items: [] });
const emptyPlataforma = () => ({ id: crypto.randomUUID(), nombre: '', comisionServicio: '', comisionPublicidad: '' });
const todayStr = () => new Date().toISOString().slice(0, 10);

function defaultData(businessName) {
  return {
    businessName,
    insumos: [], productos: [],
    plataformas: [{ id: crypto.randomUUID(), nombre: 'Venta directa / mostrador', comisionServicio: 0, comisionPublicidad: 0 }],
    ventas: [], target: 30, umbralStock: 5, costosFijos: '',
    comisionPlataformaEstimada: 30, aumentoPrecioPlataforma: 10,
    facturasProcesadas: [], gastosOperativos: [], aliasInsumos: {}, facturasPendientes: [],
    costosFijosDetalle: [], diasOperacionSemana: 6, metaMargenNetoPct: 8,
  };
}
/**
 * Insumos y recetas inferidos a partir del menú de "papas cargadas" que
 * compartió el usuario. Las cantidades de compra y de receta son
 * estimaciones de partida — el usuario debe ajustarlas a sus porciones
 * y precios reales de proveedor.
 */
function buildMenuPapasCargadas() {
  const insumosBase = [
    ['Papa cruda', 'g', 25000],
    ['Mantequilla', 'g', 5000],
    ['Mezcla de 4 quesos rallados', 'g', 2000],
    ['Pimienta negra molida', 'g', 500],
    ['Pechuga de pollo', 'g', 5000],
    ['Salsa alfredo', 'ml', 3000],
    ['Tomate cherry', 'g', 2000],
    ['Cebolla crispy', 'g', 1000],
    ['Culantro fresco', 'g', 500],
    ['Carne molida de res premium', 'g', 5000],
    ['Carne para chili (cocción lenta)', 'g', 5000],
    ['Guacamole', 'g', 2000],
    ['Pico de gallo', 'g', 2000],
    ['Jalapeños encurtidos', 'g', 1000],
    ['Hongos', 'g', 2000],
    ['Cebolla encurtida caramelizada', 'g', 1000],
    ['Almendras fileteadas', 'g', 500],
    ['Pulled pork ahumado', 'g', 5000],
    ['Salsa BBQ artesanal', 'ml', 2000],
    ['Coleslaw cremosa', 'g', 2000],
    ['Quelite fresco', 'g', 500],
    ['Pepperoni', 'g', 1000],
    ['Salsa de tomate artesanal', 'ml', 2000],
    ['Orégano', 'g', 200],
    ['Bacon crujiente', 'g', 1000],
    ['Contenedor biodegradable 26oz', 'unidad', 350],
    ['Tapa biodegradable 26oz', 'unidad', 350],
    ['Cubiertos con servilleta', 'unidad', 100],
    ['Sal fina', 'g', 2000],
    ['Ajo en polvo', 'g', 454],
    ['Paprika', 'g', 454],
    ['Harina de trigo', 'g', 500],
    ['Chipotle adobado', 'g', 220],
    ['Mayonesa', 'ml', 3785],
    ['Natilla', 'g', 500],
    ['Coca Cola 600ml', 'unidad', 24],
    ['Coca Cola Zero 600ml', 'unidad', 24],
  ];
  const insumos = insumosBase.map(([nombre, unidadBase, cantidadCompra]) => ({
    id: crypto.randomUUID(), nombre, unidadBase, cantidadCompra, precioCompra: '', stockActual: '',
  }));
  const byName = Object.fromEntries(insumos.map((i) => [i.nombre, i.id]));
  const item = (nombre, cantidad) => ({ insumoId: byName[nombre], cantidad });
  const base = [item('Papa cruda', 300), item('Mantequilla', 20), item('Mezcla de 4 quesos rallados', 40), item('Pimienta negra molida', 1), item('Sal fina', 2), item('Ajo en polvo', 1), item('Paprika', 1), item('Contenedor biodegradable 26oz', 1), item('Tapa biodegradable 26oz', 1), item('Cubiertos con servilleta', 1)];
  const conHarina = (items) => [...items, item('Harina de trigo', 5)];

  const productos = [
    { id: crypto.randomUUID(), nombre: 'Chicken Melt', precioVenta: 5400, categoria: 'Platos', items: conHarina([...base, item('Pechuga de pollo', 150), item('Salsa alfredo', 60), item('Tomate cherry', 30), item('Cebolla crispy', 15), item('Culantro fresco', 5), item('Chipotle adobado', 15)]) },
    { id: crypto.randomUUID(), nombre: 'Chilli Boss', precioVenta: 5100, categoria: 'Platos', items: conHarina([...base, item('Carne para chili (cocción lenta)', 150), item('Cebolla crispy', 15), item('Culantro fresco', 5), item('Mayonesa', 20)]) },
    { id: crypto.randomUUID(), nombre: 'Mexicana', precioVenta: 5150, categoria: 'Platos', items: [...base, item('Carne molida de res premium', 150), item('Guacamole', 40), item('Pico de gallo', 40), item('Jalapeños encurtidos', 20), item('Culantro fresco', 5), item('Natilla', 20)] },
    { id: crypto.randomUUID(), nombre: 'Fungi', precioVenta: 4900, categoria: 'Platos', items: [...base, item('Hongos', 100), item('Cebolla encurtida caramelizada', 30), item('Almendras fileteadas', 15), item('Culantro fresco', 5), item('Mayonesa', 20)] },
    { id: crypto.randomUUID(), nombre: 'Porky BBQ', precioVenta: 5400, categoria: 'Platos', items: conHarina([...base, item('Pulled pork ahumado', 150), item('Salsa BBQ artesanal', 40), item('Coleslaw cremosa', 60), item('Cebolla crispy', 15), item('Quelite fresco', 5)]) },
    { id: crypto.randomUUID(), nombre: 'Paparoni', precioVenta: 4950, categoria: 'Platos', items: conHarina([...base, item('Pepperoni', 80), item('Salsa de tomate artesanal', 50), item('Cebolla crispy', 15), item('Orégano', 1), item('Mayonesa', 20)]) },
    { id: crypto.randomUUID(), nombre: 'Coca Cola', precioVenta: 1000, categoria: 'Bebidas', items: [item('Coca Cola 600ml', 1)] },
    { id: crypto.randomUUID(), nombre: 'Coca Cola Zero', precioVenta: 1000, categoria: 'Bebidas', items: [item('Coca Cola Zero 600ml', 1)] },
  ];
  return { insumos, productos };
}

function money(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return '₡' + Number(n).toLocaleString('es-CR', { maximumFractionDigits: 1 });
}
function num(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
function normalizeName(s) { return (s || '').toString().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

/**
 * Descuenta del stock de cada insumo lo que consume `producto` al vender
 * `cantidad` unidades de él, sin bajar de cero. Usada por toda venta,
 * sin importar de dónde venga (POS, registro manual, importación CSV),
 * para que la regla de consumo viva en un solo lugar.
 */
function descontarStockPorVenta(insumos, producto, cantidad) {
  return insumos.map((ins) => {
    const item = producto.items.find((it) => it.insumoId === ins.id);
    if (!item) return ins;
    return { ...ins, stockActual: Math.max(0, num(ins.stockActual || ins.cantidadCompra) - num(item.cantidad) * cantidad) };
  });
}
function normalizeDate(s, fallback) {
  const str = (s || '').toString().trim();
  if (!str) return fallback;
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) { const [, d, mo, y] = m; return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`; }
  const dt = new Date(str);
  if (!isNaN(dt)) return dt.toISOString().slice(0, 10);
  return fallback;
}

/**
 * Best-effort conversion from whatever unit text an invoice uses to this
 * app's base units (g / ml / unidad). Not exhaustive — covers the common
 * restaurant-supply cases (kg, g, l, ml, and anything else falls back to
 * "unidad").
 */
function convertToBaseUnit(cantidad, unidadTexto) {
  const u = normalizeName(unidadTexto);
  const c = num(cantidad);
  if (/^kg|kilo/.test(u)) return { cantidad: c * 1000, unidadBase: 'g' };
  if (/^lb|libra/.test(u)) return { cantidad: c * 453.592, unidadBase: 'g' };
  if (/^g|gramo/.test(u)) return { cantidad: c, unidadBase: 'g' };
  if (/^gal/.test(u)) return { cantidad: c * 3785.41, unidadBase: 'ml' };
  if (/^l\b|litro|^lt/.test(u)) return { cantidad: c * 1000, unidadBase: 'ml' };
  if (/^oz|onza/.test(u)) return { cantidad: c * 29.5735, unidadBase: 'ml' };
  if (/^ml|mililitro/.test(u)) return { cantidad: c, unidadBase: 'ml' };
  return { cantidad: c, unidadBase: 'unidad' };
}

/**
 * Matches a raw invoice line description against the existing insumo
 * catalog. Checks a learned alias first (what the user picked last time
 * for this exact text), then an exact name match, then a loose word-overlap
 * match. Returns { insumo, confianza } where confianza is 'alta' | 'media' | null.
 */
function matchInsumoFactura(rawNombre, insumos, aliasInsumos) {
  const n = normalizeName(rawNombre);
  if (aliasInsumos && aliasInsumos[n]) {
    const ins = insumos.find((i) => i.id === aliasInsumos[n]);
    if (ins) return { insumo: ins, confianza: 'alta' };
  }
  const exact = insumos.find((i) => normalizeName(i.nombre) === n);
  if (exact) return { insumo: exact, confianza: 'alta' };
  const rawWords = n.split(/\s+/).filter((w) => w.length > 2);
  let best = null, bestScore = 0;
  insumos.forEach((i) => {
    const words = normalizeName(i.nombre).split(/\s+/).filter((w) => w.length > 2);
    if (words.length === 0) return;
    const overlap = words.filter((w) => rawWords.includes(w)).length;
    const score = overlap / words.length;
    if (score > bestScore) { bestScore = score; best = i; }
  });
  if (best && bestScore >= 0.5) return { insumo: best, confianza: 'media' };
  return { insumo: null, confianza: null };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

async function extraerFactura(files) {
  const content = [];
  for (const file of files) {
    const isPdf = file.type === 'application/pdf';
    const isHeic = /heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name || '');
    if (!isPdf && !isHeic && !SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(`El archivo "${file.name}" es de un tipo que no puedo leer (${file.type || 'desconocido'}). Usá JPG, PNG o PDF.`);
    }
    if (isHeic) {
      throw new Error(`"${file.name}" parece ser una foto en formato HEIC (el que usa la cámara del iPhone por defecto) — ese formato no lo puedo leer directo. Sacale una captura de pantalla a la foto (no la subas directo desde Fotos) y subí esa captura en su lugar.`);
    }
    const base64 = await fileToBase64(file);
    if (isPdf) {
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } });
    } else {
      content.push({ type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } });
    }
  }
  content.push({
    type: 'text',
    text: 'Esta es una factura de compra de un restaurante (puede venir en varias fotos/páginas de la misma factura). Extraé los datos y respondé ÚNICAMENTE con un JSON válido, sin texto adicional, sin backticks, con esta forma exacta:\n{"proveedor": string|null, "fecha": "YYYY-MM-DD"|null, "numeroFactura": string|null, "totalFactura": number|null, "lineas": [{"producto": string, "descripcion": string|null, "cantidad": number, "unidad": string, "precioUnitario": number|null, "precioTotal": number|null}]}\nSi un dato no aparece, usá null. Interpretá la fecha al formato YYYY-MM-DD si es posible. Sé conciso en "descripcion".',
  });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content }],
    }),
  });
  if (!response.ok) {
    let detail = '';
    try { detail = (await response.json())?.error?.message || ''; } catch (e) {}
    console.error('[costeo] Error de la API al leer factura:', response.status, detail);
    throw new Error(`La IA no pudo procesar la factura (error ${response.status}). ${detail}`);
  }
  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === 'text');
  if (!textBlock) { console.error('[costeo] Respuesta sin bloque de texto:', data); throw new Error('La IA no devolvió una respuesta legible.'); }
  const clean = textBlock.text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error('[costeo] No se pudo parsear el JSON de la factura:', textBlock.text);
    throw new Error('La IA respondió pero no en el formato esperado. Probá de nuevo.');
  }
}


/* =========================================================
   palette / tokens — inspired by SINPE CHECK's dark navy→blue
   gradient with a green accent, adapted to a light workspace
   ========================================================= */
const COLORS = {
  navy: '#060D3A', navy2: '#101E6B', blue: '#2563EB', blueLight: '#60A5FA',
  green: '#4ADE80', greenDark: '#15803D', greenDim: '#DCFCE7',
  red: '#EF4444', redDim: '#FEE2E2', redDark: '#B91C1C',
  amber: '#B45309', amberDim: '#FEF3C7',
  bg: '#F3F5FA', surface: '#FFFFFF', surfaceDim: '#EEF1F8', border: '#E3E7F1',
  ink: '#0B1220', ink2: '#3A4358', ink3: '#6B7386', ink4: '#9AA1B4',
};
const GRADIENT = `linear-gradient(135deg, ${COLORS.navy} 0%, #10186B 50%, ${COLORS.blue} 100%)`;
const FONT_DISPLAY = "'Space Grotesk', 'Archivo', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace";

function GlobalCss() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      input, select { font-family: inherit; }
      input:focus, select:focus { outline: 2px solid ${COLORS.blue}; outline-offset: 1px; }
      ::placeholder { color: ${COLORS.ink4}; }
      button:focus-visible { outline: 2px solid ${COLORS.blue}; outline-offset: 2px; }
      .row-hover:hover { background: ${COLORS.surfaceDim}; }
      .card-lift { transition: box-shadow .15s ease, transform .15s ease; }
      .card-lift:hover { box-shadow: 0 6px 18px rgba(6,13,58,0.08); transform: translateY(-1px); }
      .pin-btn { transition: transform .08s ease, background .15s ease; }
      .pin-btn:active { transform: scale(0.9); background: rgba(255,255,255,0.22) !important; }
      .tab-btn { transition: color .15s ease, border-color .15s ease; }
      .form-row { display: flex; flex-wrap: wrap; gap: 10px; }
      .form-row > * { flex: 1 1 160px; min-width: 0; }
      .ingredient-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 6px; }
      .ingredient-row .ing-select { flex: 2 1 150px; min-width: 0; }
      .ingredient-row .ing-qty { flex: 1 1 90px; min-width: 0; }
      .ingredient-row .ing-cost { flex: 0 1 76px; font-family: ${FONT_MONO}; font-size: 12.5px; color: ${COLORS.ink3}; text-align: right; }
      .ingredient-row .ing-del { flex: 0 0 auto; }
      .header-subtitle { }
      @media (max-width: 480px) { .header-subtitle { display: none; } }

      /* --- Vender (POS): app-like bottom sheet on mobile, docked side panel on desktop --- */
      .pos-layout { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; }
      .pos-products { flex: 2 1 340px; min-width: 0; }
      .pos-cart { flex: 1 1 320px; min-width: 260px; }
      .pos-cart-handle { display: none; }
      .pos-categories { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }

      @media (max-width: 879px) {
        .pos-products { flex-basis: 100%; padding-bottom: 84px; }
        .pos-cart {
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 60;
          background: ${COLORS.surface}; border-radius: 20px 20px 0 0; padding: 0 !important;
          box-shadow: 0 -10px 34px rgba(6,13,58,0.18);
          max-height: 82vh; overflow-y: auto;
          padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 10px);
          transform: translateY(calc(100% - 62px));
          transition: transform .28s cubic-bezier(.32,.72,0,1);
        }
        .pos-cart.pos-cart-empty { transform: translateY(100%); box-shadow: none; }
        .pos-cart.expanded { transform: translateY(0); }
        .pos-cart-handle {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          padding: 14px 18px; cursor: pointer; user-select: none; position: relative;
        }
        .pos-cart-handle::before {
          content: ''; position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
          width: 36px; height: 4px; border-radius: 2px; background: ${COLORS.border};
        }
        .pos-cart-body { padding: 0 18px 18px; }
        .pos-cart-summary-inline { display: none; }
        .pos-categories { flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
        .pos-categories::-webkit-scrollbar { display: none; }
      }
      @media (min-width: 880px) {
        .pos-cart { position: sticky; top: 20px; }
        .pos-cart-handle { display: none !important; }
        .pos-cart-body { padding: 0; }
      }

      /* --- App shell: sidebar (desktop) vs. bottom nav (mobile) --- */
      .app-shell { display: flex; }
      .app-sidebar {
        width: 232px; flex-shrink: 0; background: ${GRADIENT}; min-height: 100vh;
        position: sticky; top: 0; align-self: flex-start;
        display: flex; flex-direction: column; gap: 8px; padding: 22px 10px 16px;
      }
      .app-sidebar-nav { display: flex; flex-direction: column; gap: 3px; margin: 10px 0 auto; }
      .mobile-topbar { display: none; }
      .app-content { flex: 1; min-width: 0; }
      .app-bottom-nav { display: none; }

      @media (max-width: 879px) {
        .app-shell { flex-direction: column; }
        .app-sidebar { display: none; }
        .mobile-topbar {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          background: ${GRADIENT}; padding: 14px 16px; position: sticky; top: 0; z-index: 40;
        }
        .app-content { padding-bottom: 74px; }
        .app-bottom-nav {
          display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 70;
          background: ${COLORS.surface}; border-top: 1px solid ${COLORS.border};
          padding: 7px 2px calc(env(safe-area-inset-bottom, 0px) + 6px);
          justify-content: space-around; box-shadow: 0 -4px 16px rgba(6,13,58,0.06);
        }
        .app-bottom-nav-item {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          padding: 4px 2px; border: none; background: none; cursor: pointer; flex: 1;
        }
      }
      @keyframes radarspin { to { transform: rotate(360deg); } }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      .fade-up { animation: fadeUp .35s ease both; }
      .spin { animation: radarspin 0.9s linear infinite; }
    `}</style>
  );
}
function Radar({ size = 56 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(from 0deg, transparent 0deg, ${COLORS.green} 50deg, transparent 110deg)`, animation: 'radarspin 1.1s linear infinite' }} />
      <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', background: COLORS.navy }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid rgba(255,255,255,0.15)` }} />
    </div>
  );
}

/* =========================================================
   ROOT: landing / auth / session
   ========================================================= */
export default function AppRoot() {
  const [phase, setPhase] = useState('boot');
  const [negocioId, setNegocioId] = useState(null);
  const [email, setEmail] = useState('');
  const [data, setData] = useState(null);
  const [note, setNote] = useState('');

  const cargarNegocio = async (userId, userEmail) => {
    const { data: row, error } = await supabase.from('costeo_negocios').select('id, data').eq('owner_id', userId).maybeSingle();
    if (error) { setNote('No se pudo cargar tu negocio. Recargá la página.'); setPhase('landing'); return; }
    if (!row) { setNote('No encontramos un negocio para esta cuenta.'); setPhase('landing'); return; }
    setNegocioId(row.id); setData(row.data); setEmail(userEmail); setPhase('app');
  };

  useEffect(() => {
    (async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setPhase('nueva-clave');
      });
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await cargarNegocio(session.user.id, session.user.email);
      else setPhase('landing');
      return () => subscription.unsubscribe();
    })();
  }, []);

  const traducirError = (msg) => {
    if (/already registered/i.test(msg)) return 'Ese correo ya tiene una cuenta — probá "Ya tengo cuenta".';
    if (/invalid login/i.test(msg)) return 'Correo o contraseña incorrectos.';
    if (/password/i.test(msg) && /6/i.test(msg)) return 'La contraseña necesita al menos 6 caracteres.';
    return msg;
  };

  const doSignup = async ({ email, password, businessName }) => {
    setNote('');
    const { data: authData, error } = await supabase.auth.signUp({ email, password });
    if (error) return setNote(traducirError(error.message));
    const userId = authData.user?.id;
    if (!userId) return setNote('Revisá tu correo para confirmar la cuenta y después iniciá sesión.');
    const fresh = defaultData(businessName);
    const { data: row, error: err2 } = await supabase.from('costeo_negocios').insert({ owner_id: userId, nombre: businessName, data: fresh }).select('id, data').single();
    if (err2) return setNote('La cuenta se creó pero no pude crear el negocio: ' + err2.message);
    setNegocioId(row.id); setData(row.data); setEmail(email); setPhase('app');
  };

  const doLogin = async ({ email, password }) => {
    setNote('');
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setNote(traducirError(error.message));
    await cargarNegocio(authData.user.id, authData.user.email);
  };

  const doForgotPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    return !error;
  };

  const doSetNewPassword = async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return false;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await cargarNegocio(user.id, user.email);
    return true;
  };

  const logout = async () => { await supabase.auth.signOut(); setNegocioId(null); setData(null); setPhase('landing'); };

  const saveData = async (newData) => {
    if (!negocioId) return false;
    const { error } = await supabase.from('costeo_negocios').update({ data: newData }).eq('id', negocioId);
    return !error;
  };

  if (phase === 'boot') {
    return (
      <div style={{ minHeight: '100%', background: GRADIENT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <GlobalCss />
        <Radar />
        <div style={{ fontFamily: FONT_MONO, color: 'rgba(255,255,255,0.7)', fontSize: 12, letterSpacing: '0.08em' }}>CARGANDO...</div>
      </div>
    );
  }
  if (phase === 'landing') return <Landing onSignup={() => setPhase('signup')} onLogin={() => setPhase('login')} />;
  if (phase === 'signup') return <AuthFlow mode="signup" onSubmit={doSignup} onBack={() => setPhase('landing')} note={note} />;
  if (phase === 'login') return <AuthFlow mode="login" onSubmit={doLogin} onBack={() => setPhase('landing')} note={note} onForgotPassword={doForgotPassword} />;
  if (phase === 'nueva-clave') return <NuevaClave onSubmit={doSetNewPassword} />;
  return <Dashboard data={data} setData={setData} email={email} onLogout={logout} saveData={saveData} />;
}

function NuevaClave({ onSubmit }) {
  const [password, setPassword] = useState('');
  const [ok, setOk] = useState(null);
  const enviar = async () => {
    if (password.length < 6) return setOk(false);
    const success = await onSubmit(password);
    setOk(success);
  };
  return (
    <div style={{ minHeight: '100%', background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GlobalCss />
      <div style={{ width: '100%', maxWidth: 340, padding: 24, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}><BrandMark /></div>
        <StepTitle icon={KeyRound}>Elegí tu nueva contraseña</StepTitle>
        <StepSub>Mínimo 6 caracteres.</StepSub>
        <input style={darkInput} type="password" placeholder="Nueva contraseña" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviar()} autoFocus />
        {ok === false && <ErrText>No se pudo — probá con al menos 6 caracteres.</ErrText>}
        <button style={{ ...btnGreen, width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={enviar}>Guardar y entrar <ArrowRight size={14} /></button>
      </div>
    </div>
  );
}

/* ---------- Landing ---------- */
function Landing({ onSignup, onLogin }) {
  return (
    <div style={{ minHeight: '100%', background: GRADIENT, position: 'relative', overflow: 'hidden' }}>
      <GlobalCss />
      <div style={{ position: 'absolute', top: -120, right: -120, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.18), transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: -160, left: -100, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.25), transparent 70%)' }} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '72px 24px 96px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }} className="fade-up">
          <BrandMark />
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: '0.02em' }}>COSTEO</div>
        </div>

        <div className="fade-up" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 'clamp(28px, 6vw, 44px)', lineHeight: 1.15, maxWidth: 640, color: '#fff' }}>
          Sabé cuánto te cuesta cada plato, <span style={{ color: COLORS.green }}>antes</span> de venderlo.
        </div>
        <div className="fade-up" style={{ fontSize: 'clamp(14px, 2vw, 15.5px)', color: 'rgba(255,255,255,0.65)', marginTop: 16, maxWidth: 480, lineHeight: 1.6 }}>
          Costeo de recetas, ventas por plataforma de delivery con comisiones descontadas, y alertas de reabastecimiento — todo en un solo lugar para tu negocio de comida rápida.
        </div>

        <div className="fade-up" style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
          <button style={btnGreen} onClick={onSignup}>Crear mi negocio <ArrowRight size={15} /></button>
          <button style={btnGhostLight} onClick={onLogin}>Ya tengo cuenta</button>
        </div>

        <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 72 }}>
          <GlassCard icon={Package} title="Costeo por receta" desc="Cada insumo con su costo real; el precio de tus platos se recalcula solo." />
          <GlassCard icon={ShoppingCart} title="Ventas por plataforma" desc="Registrá lo vendido en cada delivery y descontá comisiones automáticamente." />
          <GlassCard icon={LineChart} title="Rentabilidad clara" desc="Utilidad real, ranking de productos y alertas de insumos por agotarse." />
        </div>
      </div>
    </div>
  );
}
function BrandMark() {
  return (
    <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_MONO, fontWeight: 700, fontSize: 12, color: COLORS.green }}>
      ₡/u
    </div>
  );
}
function GlassCard({ icon: Icon, title, desc }) {
  return (
    <div className="card-lift" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 18, backdropFilter: 'blur(6px)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={COLORS.green} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 12, color: '#fff' }}>{title}</div>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginTop: 5, lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

/* ---------- Auth flow: name/code → PIN pad ---------- */
function AuthFlow({ mode, onSubmit, onBack, note, onForgotPassword }) {
  const isSignup = mode === 'signup';
  const [step, setStep] = useState('form'); // form | recuperar | recuperar-enviado
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recuperarEmail, setRecuperarEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [localErr, setLocalErr] = useState('');

  const goBack = () => {
    setLocalErr('');
    if (step !== 'form') setStep('form');
    else onBack();
  };

  const submit = async () => {
    setLocalErr('');
    if (isSignup && !businessName.trim()) return setLocalErr('Poné el nombre de tu negocio.');
    if (!email.trim()) return setLocalErr('Poné tu correo.');
    if (password.length < 6) return setLocalErr('La contraseña necesita al menos 6 caracteres.');
    setEnviando(true);
    if (isSignup) await onSubmit({ email: email.trim(), password, businessName: businessName.trim() });
    else await onSubmit({ email: email.trim(), password });
    setEnviando(false);
  };

  const enviarRecuperacion = async () => {
    if (!recuperarEmail.trim()) return setLocalErr('Poné tu correo.');
    setEnviando(true);
    const ok = await onForgotPassword(recuperarEmail.trim());
    setEnviando(false);
    if (ok) setStep('recuperar-enviado');
    else setLocalErr('No pude enviar el correo. Revisá que esté bien escrito.');
  };

  return (
    <div style={{ minHeight: '100%', background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <GlobalCss />
      <button onClick={goBack} style={backFloating}><ArrowLeft size={16} /></button>
      <div style={{ width: '100%', maxWidth: 340, padding: 24, textAlign: 'center' }} className="fade-up" key={step}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}><BrandMark /></div>

        {step === 'form' && (
          <>
            <StepTitle icon={isSignup ? Store : KeyRound}>{isSignup ? 'Creá tu negocio' : 'Iniciar sesión'}</StepTitle>
            <StepSub>{isSignup ? 'Con tu correo y una contraseña — nada de códigos que memorizar.' : 'Entrá con tu correo y contraseña.'}</StepSub>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isSignup && <input style={darkInput} placeholder="Nombre del negocio" value={businessName} onChange={(e) => setBusinessName(e.target.value)} autoFocus />}
              <input style={darkInput} type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus={!isSignup} onKeyDown={(e) => e.key === 'Enter' && submit()} />
              <input style={darkInput} type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
            </div>
            {(localErr || note) && <ErrText>{localErr || note}</ErrText>}
            <button style={{ ...btnGreen, width: '100%', justifyContent: 'center', marginTop: 16, opacity: enviando ? 0.6 : 1 }} onClick={submit} disabled={enviando}>
              {enviando ? 'Un momento...' : isSignup ? 'Crear negocio' : 'Entrar'} <ArrowRight size={14} />
            </button>
            {!isSignup && (
              <button onClick={() => { setLocalErr(''); setRecuperarEmail(email); setStep('recuperar'); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 16, cursor: 'pointer', textDecoration: 'underline' }}>
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </>
        )}

        {step === 'recuperar' && (
          <>
            <StepTitle icon={Mail}>Recuperar contraseña</StepTitle>
            <StepSub>Te mandamos un link a tu correo para elegir una nueva.</StepSub>
            <input style={darkInput} type="email" placeholder="Correo" value={recuperarEmail} onChange={(e) => setRecuperarEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviarRecuperacion()} autoFocus />
            {localErr && <ErrText>{localErr}</ErrText>}
            <button style={{ ...btnGreen, width: '100%', justifyContent: 'center', marginTop: 16, opacity: enviando ? 0.6 : 1 }} onClick={enviarRecuperacion} disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar link'} <ArrowRight size={14} />
            </button>
          </>
        )}

        {step === 'recuperar-enviado' && (
          <>
            <StepTitle icon={CheckCircle2}>Revisá tu correo</StepTitle>
            <StepSub>Te mandamos un link a {recuperarEmail} para elegir una contraseña nueva. Puede tardar un minuto en llegar.</StepSub>
          </>
        )}

        {isSignup && step === 'form' && (
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 18, lineHeight: 1.5 }}>
            Con correo y contraseña reales, si te olvidás la clave la recuperás vos mismo — sin depender de nadie.
          </div>
        )}
      </div>
    </div>
  );
}
function StepTitle({ icon: Icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
      <Icon size={17} color={COLORS.green} />
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 19, color: '#fff' }}>{children}</div>
    </div>
  );
}
function StepSub({ children }) { return <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginBottom: 20, lineHeight: 1.5 }}>{children}</div>; }
function ErrText({ children }) { return <div style={{ color: '#FCA5A5', fontSize: 12.5, marginTop: 12 }}>{children}</div>; }

const darkInput = {
  width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8,
  padding: '11px 13px', fontSize: 14, color: '#fff',
};
const backFloating = { position: 'absolute', top: 24, left: 24, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const btnGreen = { display: 'flex', alignItems: 'center', gap: 6, background: COLORS.green, color: COLORS.navy, border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' };
const btnGhostLight = { display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '10px 18px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' };

/* =========================================================
   DASHBOARD
   ========================================================= */
const NAV_ITEMS = [
  { key: 'vender', icon: Receipt, label: 'Vender' },
  { key: 'insumos', icon: Package, label: 'Insumos' },
  { key: 'productos', icon: ChefHat, label: 'Productos' },
  { key: 'ventas', icon: ShoppingCart, label: 'Ventas' },
  { key: 'finanzas', icon: LineChart, label: 'Finanzas' },
  { key: 'salud', icon: Activity, label: 'Salud' },
];

function Dashboard({ data, setData, email, onLogout, saveData }) {
  const [tab, setTab] = useState('vender');
  const [err, setErr] = useState('');
  const saveTimer = useRef(null);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const ok = await saveData(data);
      setErr(ok ? '' : 'No se pudo guardar. Los cambios podrían perderse al recargar.');
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [data]);

  const costoPorUnidad = (insumo) => { const c = num(insumo.cantidadCompra), p = num(insumo.precioCompra); return c && p ? p / c : 0; };
  const costoProducto = (producto) => producto.items.reduce((sum, it) => { const ins = data.insumos.find((i) => i.id === it.insumoId); return ins ? sum + costoPorUnidad(ins) * num(it.cantidad) : sum; }, 0);
  const comisionPct = (plat) => num(plat.comisionServicio) + num(plat.comisionPublicidad);
  const seedMenu = () => {
    const { insumos, productos } = buildMenuPapasCargadas();
    setData((d) => ({ ...d, insumos: [...d.insumos, ...insumos], productos: [...d.productos, ...productos] }));
  };

  return (
    <div className="app-shell" style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.ink, fontFamily: FONT_BODY }}>
      <GlobalCss />

      {/* Sidebar — desktop only (ver CSS) */}
      <aside className="app-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px 0' }}>
          <BrandMark />
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.businessName || 'COSTEO'}</div>
        </div>
        <nav className="app-sidebar-nav">
          {NAV_ITEMS.map((n) => <SidebarNavItem key={n.key} {...n} active={tab === n.key} onClick={() => setTab(n.key)} />)}
        </nav>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, margin: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
          </div>
          <button onClick={onLogout} title="Cerrar sesión" style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <LogOut size={13} />
          </button>
        </div>
      </aside>

      {/* Topbar — mobile only (ver CSS) */}
      <div className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <BrandMark />
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.businessName || 'COSTEO'}</div>
        </div>
        <button onClick={onLogout} title="Cerrar sesión" style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <LogOut size={13} />
        </button>
      </div>

      <div className="app-content">
        {err && <div style={{ background: COLORS.redDim, color: COLORS.redDark, fontSize: 13, padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><TriangleAlert size={14} /> {err}</div>}

        <main style={{ maxWidth: 1080, margin: '0 auto', width: '100%', padding: '28px 20px 40px' }} className="fade-up" key={tab}>
          {tab === 'vender' && <VenderTab data={data} setData={setData} />}
          {tab === 'insumos' && <InsumosTab data={data} setData={setData} costoPorUnidad={costoPorUnidad} costoProducto={costoProducto} onSeedMenu={seedMenu} />}
          {tab === 'productos' && <ProductosTab data={data} setData={setData} costoPorUnidad={costoPorUnidad} costoProducto={costoProducto} />}
          {tab === 'ventas' && <VentasTab data={data} setData={setData} costoProducto={costoProducto} comisionPct={comisionPct} />}
          {tab === 'finanzas' && <FinanzasTab data={data} setData={setData} costoProducto={costoProducto} comisionPct={comisionPct} />}
          {tab === 'salud' && <SaludTab data={data} setData={setData} costoProducto={costoProducto} comisionPct={comisionPct} />}
        </main>
      </div>

      {/* Barra inferior — mobile only (ver CSS) */}
      <nav className="app-bottom-nav">
        {NAV_ITEMS.map((n) => <BottomNavItem key={n.key} {...n} active={tab === n.key} onClick={() => setTab(n.key)} />)}
      </nav>
    </div>
  );
}

function SidebarNavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
      width: '100%', textAlign: 'left', background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
      color: active ? '#fff' : 'rgba(255,255,255,0.55)', fontWeight: active ? 700 : 500, fontSize: 13.5, fontFamily: FONT_BODY,
    }}>
      <Icon size={17} />{label}
    </button>
  );
}
function BottomNavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button className="app-bottom-nav-item" onClick={onClick} style={{ color: active ? COLORS.blue : COLORS.ink4 }}>
      <Icon size={20} strokeWidth={active ? 2.4 : 2} />
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 600 }}>{label}</span>
    </button>
  );
}


/* ---------- shared bits ---------- */
function Field({ label, children }) {
  return <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: COLORS.ink3 }}>{label}{children}</label>;
}
const inputStyle = { border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13.5, background: COLORS.surface, color: COLORS.ink, width: '100%' };
function IconBtn({ icon: Icon, onClick, tone = 'ink3', title }) {
  return <button onClick={onClick} title={title} style={{ border: 'none', background: 'transparent', color: COLORS[tone] || COLORS.ink3, cursor: 'pointer', padding: 8, display: 'flex', borderRadius: 7 }}><Icon size={15} /></button>;
}
function SectionHead({ title, desc, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 19 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: COLORS.ink3, marginTop: 3 }}>{desc}</div>
      </div>
      {action}
    </div>
  );
}
function EmptyState({ text }) {
  return <div style={{ border: `1.5px dashed ${COLORS.border}`, borderRadius: 12, padding: '32px 20px', textAlign: 'center', color: COLORS.ink3, fontSize: 13, background: COLORS.surface }}>{text}</div>;
}
const cardStyle = { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 18, marginBottom: 16, boxShadow: '0 1px 2px rgba(6,13,58,0.03)' };
const receiptRow = { display: 'flex', justifyContent: 'space-between', fontFamily: FONT_MONO, fontSize: 12.5, padding: '3px 0', color: COLORS.ink2 };
const receiptStyle = { background: COLORS.surfaceDim, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px 14px', marginTop: 12 };
const btnPrimary = { display: 'flex', alignItems: 'center', gap: 6, background: COLORS.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 15px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const btnGhost = { display: 'flex', alignItems: 'center', gap: 6, background: COLORS.surface, color: COLORS.ink3, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '9px 15px', fontSize: 13, cursor: 'pointer' };
const btnGhostSmall = { display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', color: COLORS.blue, border: `1px dashed ${COLORS.blue}`, borderRadius: 7, padding: '6px 11px', fontSize: 12.5, cursor: 'pointer' };
const kpiCard = { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '15px 17px', flex: '1 1 155px', boxShadow: '0 1px 2px rgba(6,13,58,0.03)' };

/**
 * Flexible card-row used everywhere instead of a fixed-column table row.
 * Title + actions stay on one line; stats wrap freely underneath — this
 * is what keeps every list usable from a 320px phone up to a desktop
 * without a separate mobile layout to maintain.
 */
function Row({ title, meta, stats = [], actions, onClick }) {
  return (
    <div
      className="row-hover card-lift"
      onClick={onClick}
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 6, cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>{title}</div>
        {actions && <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>{actions}</div>}
      </div>
      {(meta || stats.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 22px', alignItems: 'flex-start', marginTop: 8 }}>
          {meta && <span style={{ fontSize: 11.5, color: COLORS.ink4, fontFamily: FONT_MONO, alignSelf: 'center' }}>{meta}</span>}
          {stats.map((s, i) => <Stat key={i} {...s} />)}
        </div>
      )}
    </div>
  );
}
function Stat({ label, value, tone, icon: Icon }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.04em', color: COLORS.ink4, fontWeight: 700 }}>{label}</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 12.5, fontWeight: 600, color: tone ? COLORS[tone] : COLORS.ink2, display: 'flex', alignItems: 'center', gap: 3 }}>
        {Icon && <Icon size={11} />}{value}
      </span>
    </span>
  );
}

/* ---------- Insumos tab ---------- */
/* ---------- Vender (POS chiquito) ---------- */
function VenderTab({ data, setData }) {
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [cart, setCart] = useState({});
  const [metodoPago, setMetodoPago] = useState('');
  const [necesitaFactura, setNecesitaFactura] = useState(false);
  const [cliente, setCliente] = useState({ nombre: '', identificacion: '', email: '', telefono: '' });
  const [ventaHecha, setVentaHecha] = useState(0);
  const [cartExpanded, setCartExpanded] = useState(false);
  const [cobrando, setCobrando] = useState(false);

  if (data.productos.length === 0) {
    return (
      <div>
        <SectionHead title="Vender" desc="Registrá una venta directa en un par de toques." />
        <EmptyState text="Primero creá productos en la pestaña Productos (o cargá el menú de ejemplo desde Insumos)." />
      </div>
    );
  }

  const categorias = ['Todas', ...Array.from(new Set(data.productos.map((p) => p.categoria || 'Platos')))];
  const productosFiltrados = data.productos.filter((p) => {
    const catOk = categoria === 'Todas' || (p.categoria || 'Platos') === categoria;
    const buscaOk = normalizeName(p.nombre).includes(normalizeName(busqueda));
    return catOk && buscaOk;
  });

  const addToCart = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeFromCart = (id) => setCart((c) => { const n = { ...c }; if (n[id] > 1) n[id] -= 1; else delete n[id]; return n; });

  const cartItems = Object.entries(cart).map(([id, cantidad]) => ({ producto: data.productos.find((p) => p.id === id), cantidad })).filter((it) => it.producto);
  const total = cartItems.reduce((s, it) => s + num(it.producto.precioVenta) * it.cantidad, 0);

  // Insumos que quedarían en negativo si se cobra este carrito ahora
  const faltantes = [];
  data.insumos.forEach((ins) => {
    const stock = num(ins.stockActual || ins.cantidadCompra);
    const consumo = cartItems.reduce((sum, it) => {
      const item = it.producto.items.find((x) => x.insumoId === ins.id);
      return item ? sum + num(item.cantidad) * it.cantidad : sum;
    }, 0);
    if (consumo > 0 && consumo > stock) faltantes.push(ins.nombre);
  });

  const vaciarCarrito = () => { setCart({}); setMetodoPago(''); setCartExpanded(false); };

  const cobrar = () => {
    if (cartItems.length === 0 || !metodoPago || cobrando) return;
    setCobrando(true);
    const plataformaDirecta = data.plataformas.find((p) => normalizeName(p.nombre).includes('directa')) || data.plataformas[0];
    const fecha = todayStr();
    setData((d) => {
      let insumos = d.insumos;
      const nuevasVentas = cartItems.map((it) => {
        insumos = descontarStockPorVenta(insumos, it.producto, it.cantidad);
        return { id: crypto.randomUUID(), productoId: it.producto.id, plataformaId: plataformaDirecta?.id, cantidad: it.cantidad, precioUnit: num(it.producto.precioVenta), fecha, metodoPago };
      });
      let facturasPendientes = d.facturasPendientes || [];
      if (necesitaFactura && cliente.nombre.trim()) {
        facturasPendientes = [
          { id: crypto.randomUUID(), fecha, total, cliente: { ...cliente }, detalle: cartItems.map((it) => `${it.producto.nombre} ×${it.cantidad}`).join(', '), resuelta: false },
          ...facturasPendientes,
        ];
      }
      return { ...d, ventas: [...nuevasVentas, ...d.ventas], insumos, facturasPendientes };
    });
    setTimeout(() => {
      setCart({}); setMetodoPago(''); setNecesitaFactura(false); setCliente({ nombre: '', identificacion: '', email: '', telefono: '' }); setCartExpanded(false);
      setCobrando(false);
      setVentaHecha(total); setTimeout(() => setVentaHecha(0), 3500);
    }, 380);
  };

  const marcarResuelta = (id) => setData((d) => ({ ...d, facturasPendientes: d.facturasPendientes.map((f) => (f.id === id ? { ...f, resuelta: true } : f)) }));
  const pendientes = (data.facturasPendientes || []).filter((f) => !f.resuelta);

  const metodos = [
    { key: 'efectivo', label: 'Efectivo', color: '#2563EB' },
    { key: 'tarjeta', label: 'Tarjeta', color: '#7C3AED' },
    { key: 'sinpe', label: 'SINPE', color: '#16A34A' },
  ];

  return (
    <div>
      <SectionHead title="Vender" desc="Tocá los productos para armar el pedido y cobrá." />

      {ventaHecha > 0 && (
        <div style={{ ...cardStyle, background: '#F0FDF4', borderColor: '#BBF7D0', display: 'flex', alignItems: 'center', gap: 10 }} className="fade-up">
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#4ADE80', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Check size={13} color="#fff" strokeWidth={3} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#15803D' }}>Venta cobrada por {money(ventaHecha)} y sumada al día.</div>
        </div>
      )}
      {faltantes.length > 0 && cartItems.length > 0 && (
        <div style={{ ...cardStyle, background: '#FFFBEB', borderColor: '#FDE68A', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <TriangleAlert size={15} color="#B45309" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, fontWeight: 600, color: '#B45309' }}>No te alcanza el stock de: {faltantes.join(', ')} — igual podés cobrar, pero el stock va a quedar en 0 en vez de negativo.</div>
        </div>
      )}

      <div className="pos-layout">
        <div className="pos-products">
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: COLORS.ink4 }} />
            <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="Buscar productos..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="pos-categories">
            {categorias.map((c) => (
              <button key={c} onClick={() => setCategoria(c)} style={{
                padding: '6px 13px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer', flexShrink: 0,
                border: `1px solid ${categoria === c ? COLORS.navy : COLORS.border}`,
                background: categoria === c ? COLORS.navy : COLORS.surface,
                color: categoria === c ? '#fff' : COLORS.ink2, fontWeight: 600,
              }}>{c}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {productosFiltrados.map((p) => {
              const enCarrito = cart[p.id];
              return (
                <button key={p.id} onClick={() => addToCart(p.id)} style={{
                  position: 'relative', textAlign: 'left', background: COLORS.surface,
                  border: enCarrito ? `2px solid #2563EB` : `1px solid ${COLORS.border}`,
                  borderRadius: 18, padding: '18px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6,
                  transition: 'border-color .15s',
                }}>
                  {enCarrito && (
                    <span style={{ position: 'absolute', top: -8, right: -8, minWidth: 24, height: 24, borderRadius: 99, background: '#2563EB', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>
                      {enCarrito}
                    </span>
                  )}
                  <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, color: '#0F172A' }}>{p.nombre}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 900, color: '#16A34A' }}>{money(p.precioVenta)}</div>
                </button>
              );
            })}
            {productosFiltrados.length === 0 && <div style={{ gridColumn: '1/-1' }}><EmptyState text="No hay productos que coincidan." /></div>}
          </div>
        </div>

        <div className={`pos-cart card-lift ${cartExpanded ? 'expanded' : ''} ${cartItems.length === 0 ? 'pos-cart-empty' : ''}`} style={{ ...cardStyle, marginBottom: 0 }}>
          <div className="pos-cart-handle" onClick={() => setCartExpanded((v) => !v)}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink, paddingTop: 6 }}>
              {cartItems.reduce((s, it) => s + it.cantidad, 0)} producto{cartItems.reduce((s, it) => s + it.cantidad, 0) === 1 ? '' : 's'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 6 }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 17, fontWeight: 800, color: COLORS.ink }}>{money(total)}</span>
              <ChevronUp size={16} color={COLORS.ink3} style={{ transform: cartExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </div>
          </div>

          <div className="pos-cart-body">
            <div className="pos-cart-summary-inline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: cartItems.length ? 10 : 0 }}>
              <div style={{ fontSize: 12, color: COLORS.ink3 }}>{cartItems.length > 0 ? `${cartItems.reduce((s, it) => s + it.cantidad, 0)} producto(s)` : 'Ticket vacío'}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 800, color: COLORS.ink, letterSpacing: '-0.5px' }}>{money(total)}</div>
            </div>

            {cartItems.length === 0 ? (
              <div style={{ fontSize: 12.5, color: COLORS.ink4, textAlign: 'center', padding: '20px 0' }}>Tocá un producto para agregarlo</div>
            ) : (
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {cartItems.map((it) => (
                  <div key={it.producto.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{it.producto.nombre}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{it.cantidad} × {money(it.producto.precioVenta)}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', fontFamily: FONT_MONO }}>{money(num(it.producto.precioVenta) * it.cantidad)}</div>
                    <button onClick={() => removeFromCart(it.producto.id)} title="Quitar uno" style={{ width: 26, height: 26, borderRadius: 8, background: '#FEF2F2', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <Minus size={12} color="#EF4444" strokeWidth={2.2} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cartItems.length > 0 && (
              <>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  {metodos.map((m) => (
                    <button key={m.key} onClick={() => setMetodoPago(m.key)} style={{
                      flex: 1, height: 46, borderRadius: 13, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                      background: metodoPago === m.key ? m.color : '#fff',
                      color: metodoPago === m.key ? '#fff' : '#64748B',
                      border: metodoPago === m.key ? 'none' : '1.5px solid #E2E8F0',
                    }}>{m.label}</button>
                  ))}
                </div>

                <div style={{ marginTop: 14, borderTop: `1px dashed ${COLORS.ink4}`, paddingTop: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: COLORS.ink3, cursor: 'pointer' }}>
                    <input type="checkbox" checked={necesitaFactura} onChange={(e) => setNecesitaFactura(e.target.checked)} />
                    El cliente necesita factura electrónica
                  </label>
                  {necesitaFactura && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                      <input style={inputStyle} placeholder="Nombre" value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
                      <input style={inputStyle} placeholder="Cédula / identificación" value={cliente.identificacion} onChange={(e) => setCliente({ ...cliente, identificacion: e.target.value })} />
                      <input style={inputStyle} placeholder="Correo" value={cliente.email} onChange={(e) => setCliente({ ...cliente, email: e.target.value })} />
                      <input style={inputStyle} placeholder="Teléfono" value={cliente.telefono} onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })} />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button onClick={vaciarCarrito} style={{ height: 50, padding: '0 18px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, fontSize: 13, fontWeight: 600, color: '#94A3B8', cursor: 'pointer', flexShrink: 0 }}>
                    Vaciar
                  </button>
                  <button
                    onClick={cobrar}
                    disabled={cobrando || !metodoPago}
                    style={{
                      flex: 1, height: 50, borderRadius: 14, fontSize: 15, fontWeight: 800, border: 'none',
                      cursor: cobrando || !metodoPago ? 'default' : 'pointer',
                      background: cobrando || !metodoPago ? '#E2E8F0' : 'linear-gradient(135deg,#1338BE,#2563EB)',
                      color: cobrando || !metodoPago ? '#94A3B8' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {cobrando ? <Loader2 size={20} className="spin" /> : (metodoPago ? `Cobrar ${money(total)}` : 'Elegí un método de pago')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {pendientes.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Facturas electrónicas pendientes de generar</div>
          {pendientes.map((f) => (
            <Row
              key={f.id}
              title={f.cliente.nombre}
              meta={f.fecha}
              stats={[{ label: 'total', value: money(f.total) }, { label: 'identificación', value: f.cliente.identificacion || '—' }]}
              actions={<button style={btnGhostSmall} onClick={() => marcarResuelta(f.id)}>Ya facturada</button>}
            />
          ))}
        </div>
      )}
    </div>
  );
}


function InsumosTab({ data, setData, costoPorUnidad, costoProducto, onSeedMenu }) {
  const [draft, setDraft] = useState(null);

  const [showFactura, setShowFactura] = useState(false);
  const [facturaFiles, setFacturaFiles] = useState([]);
  const [facturaEstado, setFacturaEstado] = useState('subir'); // subir | leyendo | revision | error
  const [facturaError, setFacturaError] = useState('');
  const [facturaHeader, setFacturaHeader] = useState({ proveedor: '', fecha: todayStr(), numeroFactura: '', totalFactura: '' });
  const [lineas, setLineas] = useState([]); // { raw, insumoId, esNuevo, nuevoNombre, clasificacion, cantidad, unidadBase, precioTotal, confianza }
  const [resultado, setResultado] = useState(null); // { impactos: [{producto,margenAntes,margenDespues}] }

  const startNew = () => setDraft(emptyInsumo());
  const startEdit = (ins) => setDraft({ ...ins });
  const cancel = () => setDraft(null);

  const save = () => {
    if (!draft.nombre.trim() || !draft.cantidadCompra || !draft.precioCompra) return;
    const stock = draft.stockActual === '' || draft.stockActual === undefined ? draft.cantidadCompra : draft.stockActual;
    const finalDraft = { ...draft, stockActual: stock };
    setData((d) => {
      const exists = d.insumos.some((i) => i.id === finalDraft.id);
      return { ...d, insumos: exists ? d.insumos.map((i) => (i.id === finalDraft.id ? finalDraft : i)) : [...d.insumos, finalDraft] };
    });
    setDraft(null);
  };
  const remove = (id) => setData((d) => ({ ...d, insumos: d.insumos.filter((i) => i.id !== id), productos: d.productos.map((p) => ({ ...p, items: p.items.filter((it) => it.insumoId !== id) })) }));
  const reponer = (ins) => setData((d) => ({ ...d, insumos: d.insumos.map((i) => (i.id === ins.id ? { ...i, stockActual: num(i.stockActual) + num(i.cantidadCompra) } : i)) }));

  const resetFactura = () => { setShowFactura(false); setFacturaFiles([]); setFacturaEstado('subir'); setFacturaError(''); setLineas([]); setResultado(null); };

  const analizarFactura = async () => {
    if (facturaFiles.length === 0) return;
    setFacturaEstado('leyendo'); setFacturaError('');
    try {
      const json = await extraerFactura(facturaFiles);
      setFacturaHeader({
        proveedor: json.proveedor || '', fecha: normalizeDate(json.fecha, todayStr()),
        numeroFactura: json.numeroFactura || '', totalFactura: json.totalFactura ?? '',
      });
      const lns = (json.lineas || []).map((l) => {
        const { insumo, confianza } = matchInsumoFactura(l.producto, data.insumos, data.aliasInsumos || {});
        const conv = convertToBaseUnit(l.cantidad, l.unidad);
        return {
          raw: l.producto || '(sin nombre)', descripcion: l.descripcion || '',
          insumoId: insumo ? insumo.id : '', esNuevo: !insumo, nuevoNombre: l.producto || '',
          clasificacion: 'insumo', cantidad: conv.cantidad, unidadBase: conv.unidadBase,
          precioTotal: num(l.precioTotal ?? l.precioUnitario * l.cantidad), confianza,
        };
      });
      setLineas(lns);
      setFacturaEstado('revision');
    } catch (e) {
      console.error('[costeo] Error al analizar factura:', e);
      setFacturaError(e.message || 'No pude leer la factura automáticamente. Podés seguir e ingresar los datos a mano, o intentar de nuevo con una foto más clara.');
      setFacturaEstado('revision');
      setLineas([]);
    }
  };

  const posibleDuplicado = data.facturasProcesadas?.find((f) =>
    facturaHeader.numeroFactura && f.numeroFactura === facturaHeader.numeroFactura && f.proveedor === facturaHeader.proveedor
  );

  const updateLinea = (idx, patch) => setLineas((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const confirmarFactura = () => {
    const impactos = [];
    setData((d) => {
      let insumos = [...d.insumos];
      let aliasInsumos = { ...(d.aliasInsumos || {}) };
      let gastosOperativos = [...(d.gastosOperativos || [])];

      lineas.forEach((l) => {
        if (l.clasificacion === 'gasto') {
          gastosOperativos.push({ id: crypto.randomUUID(), fecha: facturaHeader.fecha, proveedor: facturaHeader.proveedor, descripcion: l.raw, monto: l.precioTotal });
          return;
        }
        let insumoId = l.insumoId;
        const costoAnteriorInsumo = insumoId ? insumos.find((i) => i.id === insumoId) : null;
        const margenAntesPorProducto = {};
        if (costoAnteriorInsumo) {
          data.productos.forEach((p) => { if (p.items.some((it) => it.insumoId === insumoId)) margenAntesPorProducto[p.id] = costoProducto(p); });
        }

        if (l.esNuevo || !insumoId) {
          const nuevo = { id: crypto.randomUUID(), nombre: l.nuevoNombre || l.raw, unidadBase: l.unidadBase, cantidadCompra: l.cantidad, precioCompra: l.precioTotal, stockActual: l.cantidad, historialPrecios: [{ fecha: facturaHeader.fecha, cantidad: l.cantidad, precioTotal: l.precioTotal, proveedor: facturaHeader.proveedor }] };
          insumos.push(nuevo);
          insumoId = nuevo.id;
        } else {
          insumos = insumos.map((ins) => {
            if (ins.id !== insumoId) return ins;
            const historial = [...(ins.historialPrecios || []), { fecha: facturaHeader.fecha, cantidad: l.cantidad, precioTotal: l.precioTotal, proveedor: facturaHeader.proveedor }];
            return { ...ins, cantidadCompra: l.cantidad, precioCompra: l.precioTotal, stockActual: num(ins.stockActual || ins.cantidadCompra) + l.cantidad, historialPrecios: historial };
          });
        }
        aliasInsumos[normalizeName(l.raw)] = insumoId;

        if (Object.keys(margenAntesPorProducto).length > 0) {
          const nuevoCosto = insumos.find((i) => i.id === insumoId);
          const nuevoCostoPorUnidad = num(nuevoCosto.precioCompra) / num(nuevoCosto.cantidadCompra);
          data.productos.forEach((p) => {
            if (margenAntesPorProducto[p.id] === undefined) return;
            const costoDespues = p.items.reduce((sum, it) => {
              if (it.insumoId === insumoId) return sum + nuevoCostoPorUnidad * num(it.cantidad);
              const otro = insumos.find((i) => i.id === it.insumoId);
              return otro ? sum + (num(otro.precioCompra) / num(otro.cantidadCompra) || 0) * num(it.cantidad) : sum;
            }, 0);
            const precio = num(p.precioVenta);
            const margenAntes = precio ? ((precio - margenAntesPorProducto[p.id]) / precio) * 100 : null;
            const margenDespues = precio ? ((precio - costoDespues) / precio) * 100 : null;
            if (margenAntes !== null && margenDespues !== null && Math.abs(margenAntes - margenDespues) >= 3) {
              impactos.push({ producto: p.nombre, margenAntes, margenDespues });
            }
          });
        }
      });

      const facturasProcesadas = [...(d.facturasProcesadas || []), { id: crypto.randomUUID(), ...facturaHeader, totalFactura: num(facturaHeader.totalFactura), cargadaEl: new Date().toISOString() }];
      return { ...d, insumos, aliasInsumos, gastosOperativos, facturasProcesadas };
    });
    setResultado({ impactos });
    setLineas([]); setShowFactura(false); setFacturaFiles([]); setFacturaEstado('subir');
  };

  return (
    <div>
      <SectionHead
        title="Insumos"
        desc="Cada insumo con su costo de compra. El costo por gramo/ml/unidad se recalcula solo."
        action={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={btnGhost} onClick={() => setShowFactura(!showFactura)}><FileText size={14} /> Cargar factura</button>
            {!draft && <button style={btnPrimary} onClick={startNew}><Plus size={14} /> Insumo</button>}
          </div>
        }
      />

      {resultado && (
        <div style={{ ...cardStyle, background: resultado.impactos.length ? COLORS.redDim : COLORS.greenDim, borderColor: resultado.impactos.length ? '#FCA5A5' : '#86EFAC' }} className="fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13.5, color: resultado.impactos.length ? COLORS.redDark : COLORS.greenDark, marginBottom: resultado.impactos.length ? 8 : 0 }}>
            <CheckCircle2 size={16} /> Factura cargada e inventario actualizado.
          </div>
          {resultado.impactos.map((imp, i) => (
            <div key={i} style={{ ...receiptRow, color: COLORS.redDark, fontFamily: FONT_BODY, fontSize: 13 }}>
              <span>{imp.producto}</span>
              <span style={{ fontFamily: FONT_MONO, fontWeight: 600 }}>{imp.margenAntes.toFixed(0)}% → {imp.margenDespues.toFixed(0)}% margen</span>
            </div>
          ))}
          <button style={{ ...btnGhostSmall, marginTop: 8 }} onClick={() => setResultado(null)}>Cerrar</button>
        </div>
      )}

      {showFactura && (
        <FacturaPanel
          estado={facturaEstado} error={facturaError}
          facturaFiles={facturaFiles} setFacturaFiles={setFacturaFiles}
          onAnalizar={analizarFactura}
          facturaHeader={facturaHeader} setFacturaHeader={setFacturaHeader}
          posibleDuplicado={posibleDuplicado}
          lineas={lineas} updateLinea={updateLinea}
          insumos={data.insumos}
          onConfirmar={confirmarFactura}
          onCancelar={resetFactura}
        />
      )}

      {draft && (
        <div style={cardStyle} className="fade-up">
          <div className="form-row">
            <Field label="Nombre del insumo"><input style={inputStyle} placeholder="Ej: Queso amarillo" value={draft.nombre} onChange={(e) => setDraft({ ...draft, nombre: e.target.value })} autoFocus /></Field>
            <Field label="Unidad base">
              <select style={inputStyle} value={draft.unidadBase} onChange={(e) => setDraft({ ...draft, unidadBase: e.target.value })}>
                <option value="g">Gramo (g)</option><option value="ml">Mililitro (ml)</option><option value="unidad">Unidad (pieza)</option>
              </select>
            </Field>
          </div>
          <div className="form-row" style={{ marginTop: 10 }}>
            <Field label={`Cantidad comprada (${UNIT_LABEL[draft.unidadBase]})`}><input style={inputStyle} type="number" placeholder="2000" value={draft.cantidadCompra} onChange={(e) => setDraft({ ...draft, cantidadCompra: e.target.value })} /></Field>
            <Field label="Precio pagado (₡)"><input style={inputStyle} type="number" placeholder="8000" value={draft.precioCompra} onChange={(e) => setDraft({ ...draft, precioCompra: e.target.value })} /></Field>
            <Field label={`Stock actual (${UNIT_LABEL[draft.unidadBase]}, opcional)`}><input style={inputStyle} type="number" placeholder="= cantidad comprada" value={draft.stockActual} onChange={(e) => setDraft({ ...draft, stockActual: e.target.value })} /></Field>
          </div>
          {num(draft.cantidadCompra) > 0 && num(draft.precioCompra) > 0 && (
            <div style={{ marginTop: 10, fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: COLORS.greenDark, background: COLORS.greenDim, borderRadius: 8, padding: '8px 12px', display: 'inline-block' }}>
              = {money(num(draft.precioCompra) / num(draft.cantidadCompra))} por {UNIT_LABEL[draft.unidadBase]}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button style={btnPrimary} onClick={save}><Check size={14} /> Guardar</button>
            <button style={btnGhost} onClick={cancel}><X size={14} /> Cancelar</button>
          </div>
        </div>
      )}

      {data.insumos.length === 0 && !draft && (
        <>
          <EmptyState text="Todavía no hay insumos. Agregá el primero para empezar a costear productos." />
          <div style={{ ...cardStyle, marginTop: 12, borderStyle: 'dashed', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12.5, color: COLORS.ink3 }}>¿Tenés un menú de papas cargadas como el que me pasaste? Te lo cargo de una vez, con los insumos y las 6 recetas armadas — solo te falta poner lo que pagás por cada insumo.</div>
            <button style={btnGhostSmall} onClick={onSeedMenu}><Plus size={13} /> Cargar menú de ejemplo</button>
          </div>
        </>
      )}

      {data.insumos.length > 0 && (
        <div style={{ marginTop: draft ? 16 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 12, color: COLORS.ink3 }}>
            Avisar cuando el stock alcance para
            <input style={{ ...inputStyle, width: 60, textAlign: 'center' }} type="number" value={data.umbralStock} onChange={(e) => setData({ ...data, umbralStock: e.target.value })} />
            platos o menos de cualquier receta.
          </div>
          {data.insumos.map((ins) => {
            const stock = num(ins.stockActual || ins.cantidadCompra);
            const costoU = costoPorUnidad(ins);
            const alcanzaPorProducto = data.productos
              .map((p) => { const it = p.items.find((x) => x.insumoId === ins.id); return it && num(it.cantidad) ? Math.floor(stock / num(it.cantidad)) : null; })
              .filter((n) => n !== null);
            const alcanzaMin = alcanzaPorProducto.length ? Math.min(...alcanzaPorProducto) : null;
            const low = alcanzaMin !== null && alcanzaMin <= num(data.umbralStock);
            return (
              <Row
                key={ins.id}
                title={ins.nombre}
                stats={[
                  { label: 'costo', value: `${money(costoU)}/${UNIT_LABEL[ins.unidadBase]}` },
                  { label: 'stock', value: `${stock} ${UNIT_LABEL[ins.unidadBase]}`, tone: low ? 'redDark' : undefined, icon: low ? TriangleAlert : undefined },
                  { label: 'valor en stock', value: money(stock * costoU) },
                ]}
                actions={
                  <>
                    <IconBtn icon={PackagePlus} onClick={() => reponer(ins)} tone="blue" title="Reponer un lote igual" />
                    <IconBtn icon={Pencil} onClick={() => startEdit(ins)} title="Editar" />
                    <IconBtn icon={Trash2} onClick={() => remove(ins.id)} tone="red" title="Eliminar" />
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Productos tab ---------- */
/**
 * Upload + review UI for invoice OCR import. Two states: "subir" (pick
 * files, trigger AI extraction) and "revision" (edit the extracted
 * header + line items, confirm or fix matches, before anything is
 * written to insumos/gastos).
 */
function FacturaPanel({ estado, error, facturaFiles, setFacturaFiles, onAnalizar, facturaHeader, setFacturaHeader, posibleDuplicado, lineas, updateLinea, insumos, onConfirmar, onCancelar }) {
  const confianzaColor = { alta: 'greenDark', media: 'amber', null: 'redDark' };
  const confianzaLabel = { alta: 'coincidencia exacta', media: 'coincidencia probable', null: 'sin coincidencia' };

  return (
    <div style={cardStyle} className="fade-up">
      {estado === 'subir' && (
        <>
          <div style={{ fontSize: 12, color: COLORS.ink3, marginBottom: 12 }}>
            Subí una o varias fotos (o un PDF) de la misma factura. La IA va a leerla y proponerte a qué insumo corresponde cada línea — vos confirmás antes de que se actualice nada.
          </div>
          <label style={{ ...btnGhostSmall, display: 'inline-flex', cursor: 'pointer' }}>
            <UploadCloud size={13} /> Elegir archivo(s)
            <input type="file" accept="image/*,.pdf" multiple onChange={(e) => setFacturaFiles(Array.from(e.target.files))} style={{ display: 'none' }} />
          </label>
          {facturaFiles.length > 0 && (
            <div style={{ fontSize: 12, color: COLORS.ink3, marginTop: 8 }}>{facturaFiles.length} archivo(s) seleccionado(s): {facturaFiles.map((f) => f.name).join(', ')}</div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button style={btnPrimary} onClick={onAnalizar} disabled={facturaFiles.length === 0}><Sparkles size={14} /> Analizar factura</button>
            <button style={btnGhost} onClick={onCancelar}><X size={14} /> Cancelar</button>
          </div>
        </>
      )}

      {estado === 'leyendo' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: COLORS.ink3, fontSize: 13 }}>
          <Loader2 size={18} className="spin" /> Leyendo la factura...
        </div>
      )}

      {estado === 'revision' && (
        <>
          {error && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: COLORS.redDark, fontSize: 12.5, marginBottom: 12, background: COLORS.redDim, padding: 10, borderRadius: 8 }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
            </div>
          )}
          {posibleDuplicado && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: COLORS.redDark, fontSize: 12.5, marginBottom: 12, background: COLORS.redDim, padding: 10, borderRadius: 8 }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> Esta factura (mismo proveedor y número) parece que ya la cargaste el {posibleDuplicado.fecha}. Revisá antes de confirmar para no duplicar el inventario.
            </div>
          )}

          <div className="form-row">
            <Field label="Proveedor"><input style={inputStyle} value={facturaHeader.proveedor} onChange={(e) => setFacturaHeader({ ...facturaHeader, proveedor: e.target.value })} /></Field>
            <Field label="Fecha"><input style={inputStyle} type="date" value={facturaHeader.fecha} onChange={(e) => setFacturaHeader({ ...facturaHeader, fecha: e.target.value })} /></Field>
            <Field label="N° de factura"><input style={inputStyle} value={facturaHeader.numeroFactura} onChange={(e) => setFacturaHeader({ ...facturaHeader, numeroFactura: e.target.value })} /></Field>
            <Field label="Total de la factura (₡)"><input style={inputStyle} type="number" value={facturaHeader.totalFactura} onChange={(e) => setFacturaHeader({ ...facturaHeader, totalFactura: e.target.value })} /></Field>
          </div>

          {lineas.length === 0 ? (
            <EmptyState text="No se detectaron líneas — podés cargar los insumos a mano desde el botón 'Insumo' de arriba." />
          ) : (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: COLORS.ink3, marginBottom: 8 }}>{lineas.length} línea(s) detectadas. Revisá el destino de cada una antes de confirmar.</div>
              {lineas.map((l, i) => (
                <div key={i} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{l.raw}</div>
                    <Stat label="confianza" value={confianzaLabel[l.confianza]} tone={confianzaColor[l.confianza]} />
                  </div>
                  <div className="form-row">
                    <Field label="Clasificación">
                      <select style={inputStyle} value={l.clasificacion} onChange={(e) => updateLinea(i, { clasificacion: e.target.value })}>
                        <option value="insumo">Insumo productivo</option>
                        <option value="gasto">Gasto operativo</option>
                      </select>
                    </Field>
                    {l.clasificacion === 'insumo' && (
                      <Field label="Insumo destino">
                        <select style={inputStyle} value={l.esNuevo ? '__nuevo__' : l.insumoId} onChange={(e) => e.target.value === '__nuevo__' ? updateLinea(i, { esNuevo: true, insumoId: '' }) : updateLinea(i, { esNuevo: false, insumoId: e.target.value })}>
                          <option value="__nuevo__">➕ Crear insumo nuevo</option>
                          {insumos.map((ins) => <option key={ins.id} value={ins.id}>{ins.nombre}</option>)}
                        </select>
                      </Field>
                    )}
                    {l.clasificacion === 'insumo' && l.esNuevo && (
                      <Field label="Nombre del insumo nuevo"><input style={inputStyle} value={l.nuevoNombre} onChange={(e) => updateLinea(i, { nuevoNombre: e.target.value })} /></Field>
                    )}
                    <Field label={`Cantidad (${UNIT_LABEL[l.unidadBase]})`}><input style={inputStyle} type="number" value={l.cantidad} onChange={(e) => updateLinea(i, { cantidad: num(e.target.value) })} /></Field>
                    <Field label="Precio total línea (₡)"><input style={inputStyle} type="number" value={l.precioTotal} onChange={(e) => updateLinea(i, { precioTotal: num(e.target.value) })} /></Field>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button style={btnPrimary} onClick={onConfirmar} disabled={lineas.length === 0}><Check size={14} /> Confirmar e importar</button>
            <button style={btnGhost} onClick={onCancelar}><X size={14} /> Cancelar</button>
          </div>
        </>
      )}
    </div>
  );
}


function ProductosTab({ data, setData, costoPorUnidad, costoProducto }) {
  const [draft, setDraft] = useState(null);
  const [openId, setOpenId] = useState(null);

  const startNew = () => setDraft(emptyProducto());
  const startEdit = (p) => setDraft(JSON.parse(JSON.stringify(p)));
  const cancel = () => setDraft(null);

  const save = () => {
    if (!draft.nombre.trim()) return;
    setData((d) => {
      const exists = d.productos.some((p) => p.id === draft.id);
      return { ...d, productos: exists ? d.productos.map((p) => (p.id === draft.id ? draft : p)) : [...d.productos, draft] };
    });
    setDraft(null);
  };
  const remove = (id) => setData((d) => ({ ...d, productos: d.productos.filter((p) => p.id !== id) }));
  const addItem = () => { if (data.insumos.length === 0) return; setDraft({ ...draft, items: [...draft.items, { insumoId: data.insumos[0].id, cantidad: '' }] }); };
  const updateItem = (idx, patch) => setDraft({ ...draft, items: draft.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) });
  const removeItem = (idx) => setDraft({ ...draft, items: draft.items.filter((_, i) => i !== idx) });

  const draftCosto = draft ? draft.items.reduce((sum, it) => { const ins = data.insumos.find((i) => i.id === it.insumoId); return ins ? sum + costoPorUnidad(ins) * num(it.cantidad) : sum; }, 0) : 0;
  const draftPrecio = draft ? num(draft.precioVenta) : 0;
  const draftMargen = draftPrecio ? ((draftPrecio - draftCosto) / draftPrecio) * 100 : null;

  const comisionPlat = data.comisionPlataformaEstimada ?? 30;
  const aumentoPlat = data.aumentoPrecioPlataforma ?? 10;
  const calcMargenPlataforma = (costo, precio) => {
    if (!precio) return { precioPlataforma: 0, comisionMonto: 0, netoPlataforma: 0, margenPlataforma: null, utilidadPlataforma: null };
    const precioPlataforma = precio * (1 + num(aumentoPlat) / 100);
    const comisionMonto = precioPlataforma * (num(comisionPlat) / 100);
    const netoPlataforma = precioPlataforma - comisionMonto;
    const utilidadPlataforma = netoPlataforma - costo;
    const margenPlataforma = netoPlataforma ? (utilidadPlataforma / netoPlataforma) * 100 : null;
    return { precioPlataforma, comisionMonto, netoPlataforma, margenPlataforma, utilidadPlataforma };
  };

  return (
    <div>
      <SectionHead title="Productos" desc="Armá la receta de cada producto para ver su costo y margen real." action={!draft && <button style={btnPrimary} onClick={startNew} disabled={data.insumos.length === 0}><Plus size={14} /> Producto</button>} />
      {data.insumos.length === 0 && !draft && <EmptyState text="Primero agregá insumos en la pestaña anterior — un producto se construye a partir de ellos." />}

      {data.productos.length > 0 && (
        <div style={{ ...cardStyle, background: COLORS.surfaceDim }}>
          <div style={{ fontSize: 12, color: COLORS.ink3, marginBottom: 10 }}>
            Supuesto para "margen en plataformas": en delivery normalmente subís el precio y la plataforma te cobra comisión sobre ese precio ya subido. Ajustá los dos números si tu caso es distinto.
          </div>
          <div className="form-row">
            <Field label="Comisión típica de plataforma (%)"><input style={inputStyle} type="number" value={comisionPlat} onChange={(e) => setData({ ...data, comisionPlataformaEstimada: e.target.value })} /></Field>
            <Field label="Aumento de precio en plataforma (%)"><input style={inputStyle} type="number" value={aumentoPlat} onChange={(e) => setData({ ...data, aumentoPrecioPlataforma: e.target.value })} /></Field>
          </div>
        </div>
      )}

      {draft && (
        <div style={cardStyle} className="fade-up">
          <div className="form-row">
            <Field label="Nombre del producto"><input style={inputStyle} placeholder="Ej: Hamburguesa clásica" value={draft.nombre} onChange={(e) => setDraft({ ...draft, nombre: e.target.value })} autoFocus /></Field>
            <Field label="Precio de venta (₡)"><input style={inputStyle} type="number" placeholder="2500" value={draft.precioVenta} onChange={(e) => setDraft({ ...draft, precioVenta: e.target.value })} /></Field>
            <Field label="Categoría">
              <select style={inputStyle} value={draft.categoria || 'Platos'} onChange={(e) => setDraft({ ...draft, categoria: e.target.value })}>
                <option value="Platos">Platos</option><option value="Bebidas">Bebidas</option><option value="Toppings">Toppings</option><option value="Otros">Otros</option>
              </select>
            </Field>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: COLORS.ink3, marginBottom: 6 }}>Receta</div>
            {draft.items.map((it, idx) => {
              const ins = data.insumos.find((i) => i.id === it.insumoId);
              return (
                <div key={idx} className="ingredient-row">
                  <select className="ing-select" style={inputStyle} value={it.insumoId} onChange={(e) => updateItem(idx, { insumoId: e.target.value })}>
                    {data.insumos.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                  </select>
                  <input className="ing-qty" style={inputStyle} type="number" placeholder={`cant. (${UNIT_LABEL[ins?.unidadBase] || ''})`} value={it.cantidad} onChange={(e) => updateItem(idx, { cantidad: e.target.value })} />
                  <div className="ing-cost">{ins ? money(costoPorUnidad(ins) * num(it.cantidad)) : '—'}</div>
                  <IconBtn icon={X} onClick={() => removeItem(idx)} tone="red" />
                </div>
              );
            })}
            <button style={btnGhostSmall} onClick={addItem}><Plus size={13} /> Ingrediente</button>
          </div>
          {draft.items.length > 0 && <ReceiptSummary costo={draftCosto} precio={draftPrecio} margen={draftMargen} />}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button style={btnPrimary} onClick={save}><Check size={14} /> Guardar</button>
            <button style={btnGhost} onClick={cancel}><X size={14} /> Cancelar</button>
          </div>
        </div>
      )}

      {data.productos.length === 0 && !draft && data.insumos.length > 0 && <EmptyState text="Todavía no hay productos. Creá el primero." />}

      {data.productos.length > 0 && (
        <div style={{ marginTop: draft ? 16 : 0 }}>
          {data.productos.map((p) => {
            const costo = costoProducto(p);
            const precio = num(p.precioVenta);
            const margen = precio ? ((precio - costo) / precio) * 100 : null;
            const open = openId === p.id;
            const low = margen !== null && margen < (100 - (data.target || 30));
            const plat = calcMargenPlataforma(costo, precio);
            const platLow = plat.margenPlataforma !== null && plat.margenPlataforma < (100 - (data.target || 30));
            return (
              <div key={p.id}>
                <Row
                  onClick={() => setOpenId(open ? null : p.id)}
                  title={<><ChevronRight size={14} style={{ transform: open ? 'rotate(90deg)' : 'none', color: COLORS.ink4, flexShrink: 0, transition: 'transform .15s' }} />{p.nombre}</>}
                  stats={[
                    { label: 'precio venta', value: precio ? money(precio) : '—' },
                    { label: 'costo', value: money(costo) },
                    { label: 'margen directo', value: margen === null ? 'sin precio' : `${margen.toFixed(0)}%`, tone: margen === null ? undefined : low ? 'redDark' : 'greenDark', icon: low ? TriangleAlert : undefined },
                    { label: 'plataformas', value: plat.margenPlataforma === null ? 'sin precio' : `${plat.margenPlataforma.toFixed(0)}%`, tone: plat.margenPlataforma === null ? undefined : platLow ? 'redDark' : 'greenDark', icon: platLow ? TriangleAlert : undefined },
                  ]}
                  actions={
                    <>
                      <IconBtn icon={Pencil} onClick={(e) => { e.stopPropagation(); startEdit(p); }} title="Editar" />
                      <IconBtn icon={Trash2} onClick={(e) => { e.stopPropagation(); remove(p.id); }} tone="red" title="Eliminar" />
                    </>
                  }
                />
                {open && (
                  <div style={{ marginTop: -2, marginBottom: 6 }}>
                    <ReceiptSummary costo={costo} precio={precio} margen={margen} items={p.items} insumos={data.insumos} costoPorUnidad={costoPorUnidad} plataforma={plat} comisionPlat={comisionPlat} aumentoPlat={aumentoPlat} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReceiptSummary({ costo, precio, margen, items, insumos, costoPorUnidad, plataforma, comisionPlat, aumentoPlat }) {
  return (
    <div style={receiptStyle}>
      {items && insumos && (
        <>
          {items.map((it, i) => {
            const ins = insumos.find((x) => x.id === it.insumoId);
            if (!ins) return null;
            return <div key={i} style={receiptRow}><span>{ins.nombre} × {it.cantidad}{UNIT_LABEL[ins.unidadBase]}</span><span>{money(costoPorUnidad(ins) * num(it.cantidad))}</span></div>;
          })}
          <div style={{ borderTop: `1px dashed ${COLORS.ink4}`, margin: '6px 0' }} />
        </>
      )}
      <div style={receiptRow}><span>Costo total</span><span>{money(costo)}</span></div>
      <div style={receiptRow}><span>Precio de venta</span><span>{precio ? money(precio) : '—'}</span></div>
      <div style={{ ...receiptRow, fontWeight: 700, color: margen === null ? COLORS.ink3 : margen < 0 ? COLORS.redDark : COLORS.greenDark }}>
        <span>Margen directo</span><span>{margen === null ? '—' : `${margen.toFixed(1)}%`}</span>
      </div>

      {plataforma && precio > 0 && (
        <>
          <div style={{ borderTop: `1px dashed ${COLORS.ink4}`, margin: '8px 0' }} />
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em', color: COLORS.ink4, fontWeight: 700, marginBottom: 4 }}>
            En plataformas de delivery (+{num(aumentoPlat)}% precio, −{num(comisionPlat)}% comisión)
          </div>
          <div style={receiptRow}><span>Precio ajustado</span><span>{money(plataforma.precioPlataforma)}</span></div>
          <div style={receiptRow}><span>Comisión de la plataforma</span><span style={{ color: COLORS.redDark }}>−{money(plataforma.comisionMonto)}</span></div>
          <div style={receiptRow}><span>Ingreso neto</span><span>{money(plataforma.netoPlataforma)}</span></div>
          <div style={receiptRow}><span>Costo total</span><span>{money(costo)}</span></div>
          <div style={{ ...receiptRow, fontWeight: 700, color: plataforma.margenPlataforma === null ? COLORS.ink3 : plataforma.margenPlataforma < 0 ? COLORS.redDark : COLORS.greenDark }}>
            <span>Margen en plataforma</span><span>{plataforma.margenPlataforma === null ? '—' : `${plataforma.margenPlataforma.toFixed(1)}%`}</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Ventas tab ---------- */
function VentasTab({ data, setData, costoProducto, comisionPct }) {
  const [showPlataformas, setShowPlataformas] = useState(false);
  const [platDraft, setPlatDraft] = useState(null);
  const [venta, setVenta] = useState({ productoId: data.productos[0]?.id || '', plataformaId: data.plataformas[0]?.id || '', cantidad: '', fecha: todayStr() });

  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState(null);
  const [importHeaders, setImportHeaders] = useState([]);
  const [colProducto, setColProducto] = useState('');
  const [colCantidad, setColCantidad] = useState('');
  const [colFecha, setColFecha] = useState('');
  const [colPrecio, setColPrecio] = useState('');
  const [fechaFija, setFechaFija] = useState(todayStr());
  const [importPlataformaId, setImportPlataformaId] = useState(data.plataformas[0]?.id || '');
  const [manualMatch, setManualMatch] = useState({});
  const [importDone, setImportDone] = useState(0);

  const matchProducto = (nombre) => data.productos.find((p) => normalizeName(p.nombre) === normalizeName(nombre)) || null;

  const onFileSelected = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const parsed = Papa.parse(evt.target.result, { header: true, skipEmptyLines: true });
      const fields = parsed.meta.fields || [];
      setImportHeaders(fields);
      setImportRows(parsed.data);
      setManualMatch({});
      const guess = (cands) => fields.find((f) => cands.some((c) => normalizeName(f).includes(c))) || '';
      setColProducto(guess(['producto', 'concepto', 'item', 'articulo']));
      setColCantidad(guess(['cantidad', 'items', 'unidades']));
      setColFecha(guess(['fecha', 'date']));
      setColPrecio(guess(['precio', 'monto', 'total']));
    };
    reader.readAsText(file, 'utf-8');
  };

  const previewRows = importRows && colProducto && colCantidad
    ? importRows.map((r, i) => {
        const nombre = r[colProducto] || '';
        const cantidad = num(r[colCantidad]);
        const fecha = colFecha ? normalizeDate(r[colFecha], fechaFija) : fechaFija;
        const producto = manualMatch[i] ? data.productos.find((p) => p.id === manualMatch[i]) : matchProducto(nombre);
        const precioOverride = colPrecio && r[colPrecio] !== undefined && r[colPrecio] !== '' ? num(r[colPrecio]) : null;
        return { nombre, cantidad, fecha, producto, precioOverride };
      })
    : [];
  const matchedCount = previewRows.filter((r) => r.producto && r.cantidad > 0).length;

  const closeImport = () => { setShowImport(false); setImportRows(null); setImportHeaders([]); setColProducto(''); setColCantidad(''); setColFecha(''); setColPrecio(''); setManualMatch({}); };

  const confirmImport = () => {
    const validas = previewRows.filter((r) => r.producto && r.cantidad > 0);
    if (validas.length === 0) return;
    setData((d) => {
      let insumos = d.insumos;
      const nuevas = validas.map((r) => {
        insumos = descontarStockPorVenta(insumos, r.producto, r.cantidad);
        const precioUnit = r.precioOverride !== null ? r.precioOverride / r.cantidad : num(r.producto.precioVenta);
        return { id: crypto.randomUUID(), productoId: r.producto.id, plataformaId: importPlataformaId, cantidad: r.cantidad, precioUnit, fecha: r.fecha };
      });
      return { ...d, ventas: [...nuevas, ...d.ventas], insumos };
    });
    setImportDone(validas.length);
    closeImport();
    setTimeout(() => setImportDone(0), 4000);
  };

  const startNewPlat = () => setPlatDraft(emptyPlataforma());
  const savePlat = () => {
    if (!platDraft.nombre.trim()) return;
    setData((d) => {
      const exists = d.plataformas.some((p) => p.id === platDraft.id);
      return { ...d, plataformas: exists ? d.plataformas.map((p) => (p.id === platDraft.id ? platDraft : p)) : [...d.plataformas, platDraft] };
    });
    setPlatDraft(null);
  };
  const removePlat = (id) => setData((d) => ({ ...d, plataformas: d.plataformas.filter((p) => p.id !== id), ventas: d.ventas.filter((v) => v.plataformaId !== id) }));

  const registrarVenta = () => {
    const producto = data.productos.find((p) => p.id === venta.productoId);
    const cantidad = num(venta.cantidad);
    if (!producto || !cantidad || !venta.plataformaId) return;
    const nueva = { id: crypto.randomUUID(), productoId: venta.productoId, plataformaId: venta.plataformaId, cantidad, precioUnit: num(producto.precioVenta), fecha: venta.fecha };
    setData((d) => ({
      ...d,
      ventas: [nueva, ...d.ventas],
      insumos: descontarStockPorVenta(d.insumos, producto, cantidad),
    }));
    setVenta({ ...venta, cantidad: '' });
  };

  const eliminarVenta = (v) => {
    const producto = data.productos.find((p) => p.id === v.productoId);
    setData((d) => ({
      ...d,
      ventas: d.ventas.filter((x) => x.id !== v.id),
      insumos: producto
        ? d.insumos.map((ins) => {
            const item = producto.items.find((it) => it.insumoId === ins.id);
            if (!item) return ins;
            return { ...ins, stockActual: num(ins.stockActual || ins.cantidadCompra) + num(item.cantidad) * v.cantidad };
          })
        : d.insumos,
    }));
  };

  if (data.productos.length === 0) {
    return (
      <div>
        <SectionHead title="Ventas" desc="Registrá cada venta con la plataforma por la que se hizo." />
        <EmptyState text="Primero creá al menos un producto en la pestaña Productos." />
      </div>
    );
  }

  return (
    <div>
      <SectionHead
        title="Ventas"
        desc="Registrá lo vendido en cada plataforma. El costo de insumos se descuenta solo del inventario."
        action={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={btnGhost} onClick={() => setShowImport(!showImport)}><UploadCloud size={14} /> Importar CSV</button>
            <button style={btnGhost} onClick={() => setShowPlataformas(!showPlataformas)}><Settings2 size={14} /> Plataformas</button>
          </div>
        }
      />

      {importDone > 0 && (
        <div style={{ ...cardStyle, background: COLORS.greenDim, borderColor: '#86EFAC', display: 'flex', alignItems: 'center', gap: 8, color: COLORS.greenDark, fontWeight: 600, fontSize: 13 }}>
          <CheckCircle2 size={16} /> Se importaron {importDone} ventas correctamente.
        </div>
      )}

      {showImport && (
        <div style={cardStyle} className="fade-up">
          {!importRows ? (
            <>
              <div style={{ fontSize: 12, color: COLORS.ink3, marginBottom: 12 }}>
                Subí el CSV que exportás de Alegra. Vamos a cruzar los nombres de producto con tus recetas para registrar las ventas solas.
              </div>
              <label style={{ ...btnGhostSmall, display: 'inline-flex', cursor: 'pointer' }}>
                <UploadCloud size={13} /> Elegir archivo CSV
                <input type="file" accept=".csv" onChange={onFileSelected} style={{ display: 'none' }} />
              </label>
            </>
          ) : (
            <>
              <div className="form-row">
                <Field label="Columna con el producto">
                  <select style={inputStyle} value={colProducto} onChange={(e) => setColProducto(e.target.value)}>
                    <option value="">Elegir columna...</option>
                    {importHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </Field>
                <Field label="Columna con la cantidad">
                  <select style={inputStyle} value={colCantidad} onChange={(e) => setColCantidad(e.target.value)}>
                    <option value="">Elegir columna...</option>
                    {importHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </Field>
                <Field label="Columna con la fecha (opcional)">
                  <select style={inputStyle} value={colFecha} onChange={(e) => setColFecha(e.target.value)}>
                    <option value="">Usar una fecha fija</option>
                    {importHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </Field>
                {!colFecha && <Field label="Fecha para todo el archivo"><input style={inputStyle} type="date" value={fechaFija} onChange={(e) => setFechaFija(e.target.value)} /></Field>}
                <Field label="Columna con el monto total (opcional)">
                  <select style={inputStyle} value={colPrecio} onChange={(e) => setColPrecio(e.target.value)}>
                    <option value="">Usar el precio del producto</option>
                    {importHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </Field>
                <Field label="Plataforma para estas ventas">
                  <select style={inputStyle} value={importPlataformaId} onChange={(e) => setImportPlataformaId(e.target.value)}>
                    {data.plataformas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </Field>
              </div>

              {colProducto && colCantidad && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: COLORS.ink3, marginBottom: 8 }}>
                    Vista previa — {previewRows.length} filas, <strong style={{ color: COLORS.greenDark }}>{matchedCount} con receta encontrada</strong>{previewRows.length - matchedCount > 0 && <> · {previewRows.length - matchedCount} sin coincidencia, elegí el producto manualmente abajo</>}.
                  </div>
                  {previewRows.slice(0, 60).map((r, i) => (
                    <Row
                      key={i}
                      title={r.nombre || '(sin nombre)'}
                      meta={r.fecha}
                      stats={[{ label: 'cantidad', value: r.cantidad || '—' }]}
                      actions={
                        r.producto ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: COLORS.greenDark, fontSize: 11.5, fontWeight: 600 }}><CheckCircle2 size={13} /> {r.producto.nombre}</span>
                        ) : (
                          <select style={{ ...inputStyle, width: 170, fontSize: 12 }} value={manualMatch[i] || ''} onChange={(e) => setManualMatch({ ...manualMatch, [i]: e.target.value })}>
                            <option value="">sin coincidencia</option>
                            {data.productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                          </select>
                        )
                      }
                    />
                  ))}
                  {previewRows.length > 60 && <div style={{ fontSize: 11.5, color: COLORS.ink4, marginTop: 4 }}>...y {previewRows.length - 60} filas más (se importan todas, solo no se muestran todas aquí).</div>}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button style={btnPrimary} onClick={confirmImport} disabled={matchedCount === 0}><Check size={14} /> Importar {matchedCount || ''} ventas</button>
                <button style={btnGhost} onClick={closeImport}><X size={14} /> Cancelar</button>
              </div>
            </>
          )}
        </div>
      )}

      {showPlataformas && (
        <div style={cardStyle} className="fade-up">
          <div style={{ fontSize: 12, color: COLORS.ink3, marginBottom: 10 }}>
            Configurá cada canal de venta con su comisión de servicio y de publicidad (%). Para venta directa, dejá ambas en 0.
          </div>
          {data.plataformas.map((p) => (
            <Row
              key={p.id}
              title={p.nombre}
              stats={[
                { label: 'servicio', value: `${num(p.comisionServicio)}%` },
                { label: 'publicidad', value: `${num(p.comisionPublicidad)}%` },
              ]}
              actions={
                <>
                  <IconBtn icon={Pencil} onClick={() => setPlatDraft({ ...p })} title="Editar" />
                  <IconBtn icon={Trash2} onClick={() => removePlat(p.id)} tone="red" title="Eliminar" />
                </>
              }
            />
          ))}
          {platDraft && (
            <div style={{ ...receiptStyle, marginTop: 10 }}>
              <div className="form-row">
                <Field label="Nombre de la plataforma"><input style={inputStyle} placeholder="Ej: Uber Eats" value={platDraft.nombre} onChange={(e) => setPlatDraft({ ...platDraft, nombre: e.target.value })} /></Field>
                <Field label="Comisión servicio (%)"><input style={inputStyle} type="number" placeholder="25" value={platDraft.comisionServicio} onChange={(e) => setPlatDraft({ ...platDraft, comisionServicio: e.target.value })} /></Field>
                <Field label="Comisión publicidad (%)"><input style={inputStyle} type="number" placeholder="5" value={platDraft.comisionPublicidad} onChange={(e) => setPlatDraft({ ...platDraft, comisionPublicidad: e.target.value })} /></Field>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button style={btnPrimary} onClick={savePlat}><Check size={14} /> Guardar</button>
                <button style={btnGhost} onClick={() => setPlatDraft(null)}><X size={14} /> Cancelar</button>
              </div>
            </div>
          )}
          {!platDraft && <button style={{ ...btnGhostSmall, marginTop: 4 }} onClick={startNewPlat}><Plus size={13} /> Plataforma</button>}
        </div>
      )}

      <div style={cardStyle}>
        <div className="form-row" style={{ alignItems: 'end' }}>
          <Field label="Producto">
            <select style={inputStyle} value={venta.productoId} onChange={(e) => setVenta({ ...venta, productoId: e.target.value })}>
              {data.productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </Field>
          <Field label="Plataforma">
            <select style={inputStyle} value={venta.plataformaId} onChange={(e) => setVenta({ ...venta, plataformaId: e.target.value })}>
              {data.plataformas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </Field>
          <Field label="Cantidad"><input style={inputStyle} type="number" placeholder="1" value={venta.cantidad} onChange={(e) => setVenta({ ...venta, cantidad: e.target.value })} /></Field>
          <Field label="Fecha"><input style={inputStyle} type="date" value={venta.fecha} onChange={(e) => setVenta({ ...venta, fecha: e.target.value })} /></Field>
          <button style={{ ...btnPrimary, justifyContent: 'center' }} onClick={registrarVenta}><Plus size={14} /> Registrar</button>
        </div>
      </div>

      {data.ventas.length === 0 ? (
        <EmptyState text="Todavía no hay ventas registradas." />
      ) : (
        <div>
          {data.ventas.slice(0, 40).map((v) => {
            const producto = data.productos.find((p) => p.id === v.productoId);
            const plat = data.plataformas.find((p) => p.id === v.plataformaId);
            if (!producto || !plat) return null;
            const bruto = v.precioUnit * v.cantidad;
            const comision = bruto * (comisionPct(plat) / 100);
            const neto = bruto - comision;
            return (
              <Row
                key={v.id}
                title={`${producto.nombre} × ${v.cantidad}`}
                meta={v.fecha}
                stats={[
                  { label: 'plataforma', value: plat.nombre },
                  { label: 'ingreso neto', value: money(neto) },
                ]}
                actions={<IconBtn icon={Trash2} onClick={() => eliminarVenta(v)} tone="red" title="Eliminar" />}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Finanzas tab ---------- */
function FinanzasTab({ data, setData, costoProducto, comisionPct }) {
  const [periodo, setPeriodo] = useState('todo');

  const cutoff = (() => {
    const d = new Date();
    if (periodo === '7') d.setDate(d.getDate() - 7);
    else if (periodo === '30') d.setDate(d.getDate() - 30);
    else if (periodo === 'hoy') return todayStr();
    else return null;
    return d.toISOString().slice(0, 10);
  })();

  const ventasFiltradas = data.ventas.filter((v) => {
    if (periodo === 'todo') return true;
    if (periodo === 'hoy') return v.fecha === cutoff;
    return v.fecha >= cutoff;
  });
  const gastosFiltrados = (data.gastosOperativos || []).filter((g) => {
    if (periodo === 'todo') return true;
    if (periodo === 'hoy') return g.fecha === cutoff;
    return g.fecha >= cutoff;
  });
  const gastosOperativosTotal = gastosFiltrados.reduce((sum, g) => sum + num(g.monto), 0);

  let ingresoBruto = 0, comisionesTotal = 0, cogs = 0;
  const porPlataforma = {};
  const porProducto = {};

  ventasFiltradas.forEach((v) => {
    const producto = data.productos.find((p) => p.id === v.productoId);
    const plat = data.plataformas.find((p) => p.id === v.plataformaId);
    if (!producto || !plat) return;
    const bruto = v.precioUnit * v.cantidad;
    const comision = bruto * (comisionPct(plat) / 100);
    const neto = bruto - comision;
    const costo = costoProducto(producto) * v.cantidad;
    const utilidad = neto - costo;

    ingresoBruto += bruto; comisionesTotal += comision; cogs += costo;

    if (!porPlataforma[plat.id]) porPlataforma[plat.id] = { nombre: plat.nombre, ventas: 0, bruto: 0, comision: 0, neto: 0, utilidad: 0 };
    const pp = porPlataforma[plat.id];
    pp.ventas += v.cantidad; pp.bruto += bruto; pp.comision += comision; pp.neto += neto; pp.utilidad += utilidad;

    if (!porProducto[producto.id]) porProducto[producto.id] = { nombre: producto.nombre, unidades: 0, utilidad: 0, neto: 0 };
    const pr = porProducto[producto.id];
    pr.unidades += v.cantidad; pr.utilidad += utilidad; pr.neto += neto;
  });

  const ingresoNeto = ingresoBruto - comisionesTotal;
  const utilidadBruta = ingresoNeto - cogs;
  const margenGlobal = ingresoNeto ? (utilidadBruta / ingresoNeto) * 100 : null;
  const costosFijos = (data.costosFijosDetalle || []).reduce((s, c) => s + num(c.monto), 0) || num(data.costosFijos);
  const diasPeriodo = periodo === 'hoy' ? 1 : periodo === '7' ? 7 : periodo === '30' ? 30 : null;
  const costosFijosPeriodo = diasPeriodo !== null ? (costosFijos / 30) * diasPeriodo : costosFijos;
  const utilidadNeta = utilidadBruta - costosFijosPeriodo - gastosOperativosTotal;
  const rankingProductos = Object.values(porProducto).sort((a, b) => b.utilidad - a.utilidad);
  const tablaPlataformas = Object.values(porPlataforma).sort((a, b) => b.neto - a.neto);

  const insumosBajos = data.insumos
    .map((ins) => {
      const stock = num(ins.stockActual || ins.cantidadCompra);
      const usos = data.productos
        .map((p) => {
          const it = p.items.find((x) => x.insumoId === ins.id);
          return it && num(it.cantidad) ? { nombre: p.nombre, alcanza: Math.floor(stock / num(it.cantidad)) } : null;
        })
        .filter(Boolean);
      if (usos.length === 0) return null;
      const peor = usos.reduce((min, u) => (u.alcanza < min.alcanza ? u : min), usos[0]);
      return { insumo: ins.nombre, stock, unidad: UNIT_LABEL[ins.unidadBase], peor };
    })
    .filter((x) => x && x.peor.alcanza <= num(data.umbralStock))
    .sort((a, b) => a.peor.alcanza - b.peor.alcanza);

  return (
    <div>
      <SectionHead
        title="Finanzas"
        desc="Rentabilidad real: ventas menos comisiones de plataformas, menos costo de insumos."
        action={
          <select style={{ ...inputStyle, width: 'auto' }} value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            <option value="todo">Todo</option><option value="hoy">Hoy</option><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option>
          </select>
        }
      />

      {insumosBajos.length > 0 && (
        <div style={{ ...cardStyle, borderColor: '#FCA5A5', background: COLORS.redDim }} className="fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13.5, color: COLORS.redDark, marginBottom: 8 }}>
            <TriangleAlert size={15} /> Insumos por reabastecer
          </div>
          {insumosBajos.map((x, i) => (
            <div key={i} style={{ ...receiptRow, color: COLORS.redDark, fontFamily: FONT_BODY, fontSize: 13 }}>
              <span>{x.insumo} — quedan {x.stock}{x.unidad}</span>
              <span style={{ fontFamily: FONT_MONO, fontWeight: 600 }}>alcanza para {x.peor.alcanza} × {x.peor.nombre}</span>
            </div>
          ))}
        </div>
      )}

      {ventasFiltradas.length === 0 ? (
        <EmptyState text="No hay ventas registradas en este período. Registrá ventas en la pestaña Ventas para ver el análisis." />
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <Kpi label="Ingreso bruto" value={money(ingresoBruto)} />
            <Kpi label="Comisiones pagadas" value={money(comisionesTotal)} tone="redDark" />
            <Kpi label="Ingreso neto" value={money(ingresoNeto)} />
            <Kpi label="Costo de insumos" value={money(cogs)} tone="redDark" />
            <Kpi label="Utilidad bruta" value={money(utilidadBruta)} tone={utilidadBruta >= 0 ? 'greenDark' : 'redDark'} />
            <Kpi label="Margen sobre ingreso neto" value={margenGlobal === null ? '—' : `${margenGlobal.toFixed(1)}%`} tone={margenGlobal >= 0 ? 'greenDark' : 'redDark'} />
          </div>

          {costosFijos > 0 && (
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: COLORS.ink3, marginBottom: 8 }}>
                Tus costos fijos mensuales (₡{money(costosFijos)}) se prorratean según el período elegido{diasPeriodo === null ? ' — para "Todo" se muestra el mes completo como referencia' : ` (≈${money(costosFijosPeriodo)} en este período)`}. Para editarlos, andá a la pestaña <strong>Salud</strong>.
                {gastosOperativosTotal > 0 && <> Además, ya tenés <strong>{money(gastosOperativosTotal)}</strong> en gastos operativos cargados desde facturas en este período — se suman solos.</>}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: utilidadNeta >= 0 ? COLORS.greenDark : COLORS.redDark }}>
                Utilidad neta: {money(utilidadNeta)} — {utilidadNeta >= 0 ? 'el negocio es rentable en este período' : 'el negocio está perdiendo en este período'}
              </div>
            </div>
          )}

          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, margin: '22px 0 10px' }}>Por plataforma</div>
          {tablaPlataformas.map((p, i) => (
            <Row
              key={i}
              title={<>{p.nombre} <span style={{ color: COLORS.ink4, fontWeight: 400 }}>({p.ventas}u)</span></>}
              stats={[
                { label: 'ingreso neto', value: money(p.neto) },
                { label: 'comisión pagada', value: money(p.comision), tone: 'redDark' },
                { label: 'utilidad', value: money(p.utilidad), tone: p.utilidad >= 0 ? 'greenDark' : 'redDark' },
              ]}
            />
          ))}

          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, margin: '22px 0 10px' }}>Ranking de productos por utilidad</div>
          {rankingProductos.map((p, i) => (
            <Row
              key={i}
              title={p.nombre}
              stats={[
                { label: 'unidades', value: p.unidades },
                { label: 'ingreso neto', value: money(p.neto) },
                { label: 'utilidad', value: money(p.utilidad), tone: p.utilidad >= 0 ? 'greenDark' : 'redDark' },
              ]}
            />
          ))}
        </>
      )}
    </div>
  );
}

/* ---------- Salud del negocio ---------- */
function SaludTab({ data, setData, costoProducto, comisionPct }) {
  const [nuevoCosto, setNuevoCosto] = useState({ nombre: '', monto: '' });

  const costosFijosDetalle = data.costosFijosDetalle || [];
  const costosFijosTotal = costosFijosDetalle.reduce((s, c) => s + num(c.monto), 0);

  const addCosto = () => {
    if (!nuevoCosto.nombre.trim() || !num(nuevoCosto.monto)) return;
    setData((d) => ({ ...d, costosFijosDetalle: [...(d.costosFijosDetalle || []), { id: crypto.randomUUID(), nombre: nuevoCosto.nombre.trim(), monto: num(nuevoCosto.monto) }] }));
    setNuevoCosto({ nombre: '', monto: '' });
  };
  const removeCosto = (id) => setData((d) => ({ ...d, costosFijosDetalle: d.costosFijosDetalle.filter((c) => c.id !== id) }));

  // Margen de contribución: ponderado por ventas reales de los últimos 30 días
  // si hay suficientes; si no, promedio simple de márgenes de productos; si
  // tampoco hay productos con precio, se asume el food-cost objetivo (target).
  const hace30 = (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); })();
  const ventasRecientes = data.ventas.filter((v) => v.fecha >= hace30);
  let margenContribucionPct;
  if (ventasRecientes.length > 0) {
    let netoTotal = 0, utilidadTotal = 0;
    ventasRecientes.forEach((v) => {
      const producto = data.productos.find((p) => p.id === v.productoId);
      const plat = data.plataformas.find((p) => p.id === v.plataformaId);
      if (!producto || !plat) return;
      const bruto = v.precioUnit * v.cantidad;
      const neto = bruto - bruto * (comisionPct(plat) / 100);
      const costo = costoProducto(producto) * v.cantidad;
      netoTotal += neto; utilidadTotal += neto - costo;
    });
    margenContribucionPct = netoTotal ? (utilidadTotal / netoTotal) * 100 : null;
  }
  if (!margenContribucionPct) {
    const conPrecio = data.productos.filter((p) => num(p.precioVenta) > 0);
    if (conPrecio.length > 0) {
      const promedios = conPrecio.map((p) => { const c = costoProducto(p); const pr = num(p.precioVenta); return ((pr - c) / pr) * 100; });
      margenContribucionPct = promedios.reduce((s, m) => s + m, 0) / promedios.length;
    } else {
      margenContribucionPct = 100 - num(data.target || 30);
    }
  }

  const diasOperacionSemana = num(data.diasOperacionSemana) || 6;
  const diasOperacionMes = diasOperacionSemana * 4.345;
  const puntoEquilibrioMensual = margenContribucionPct > 0 ? costosFijosTotal / (margenContribucionPct / 100) : null;
  const metaMargenNetoPct = data.metaMargenNetoPct === '' || data.metaMargenNetoPct === undefined ? 8 : num(data.metaMargenNetoPct);
  const brechaValida = margenContribucionPct - metaMargenNetoPct > 0;
  const metaVentasMensual = brechaValida ? costosFijosTotal / ((margenContribucionPct - metaMargenNetoPct) / 100) : puntoEquilibrioMensual;
  const metaUtilidadMensual = metaVentasMensual ? metaVentasMensual * (metaMargenNetoPct / 100) : null;
  const metaDiaria = metaVentasMensual ? metaVentasMensual / diasOperacionMes : null;
  const metaSemanal = metaDiaria ? metaDiaria * diasOperacionSemana : null;
  const tienePlanilla = costosFijosDetalle.some((c) => normalizeName(c.nombre).includes('planilla') || normalizeName(c.nombre).includes('salario') || normalizeName(c.nombre).includes('sueldo') || normalizeName(c.nombre).includes('nomina'));

  // Progreso del mes calendario actual
  const hoy = new Date();
  const inicioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
  const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const diaDeHoy = hoy.getDate();
  const ventasMes = data.ventas.filter((v) => v.fecha >= inicioMes);
  const ingresoNetoMes = ventasMes.reduce((sum, v) => {
    const plat = data.plataformas.find((p) => p.id === v.plataformaId);
    if (!plat) return sum;
    const bruto = v.precioUnit * v.cantidad;
    return sum + (bruto - bruto * (comisionPct(plat) / 100));
  }, 0);
  const ritmoEsperado = metaVentasMensual ? (metaVentasMensual * diaDeHoy) / diasEnMes : null;
  const proyeccionFinMes = diaDeHoy > 0 ? (ingresoNetoMes / diaDeHoy) * diasEnMes : 0;
  const diferencia = ritmoEsperado !== null ? ingresoNetoMes - ritmoEsperado : null;

  let estado = null;
  if (metaVentasMensual) {
    const ratio = proyeccionFinMes / metaVentasMensual;
    estado = ratio >= 1 ? { emoji: '🟢', texto: 'Vas bien — a este ritmo cumplís la meta del mes', tone: 'greenDark' }
      : ratio >= 0.9 ? { emoji: '🟡', texto: 'Vas justo — necesitás repuntar un poco para llegar', tone: 'amber' }
      : { emoji: '🔴', texto: 'Vas atrasado respecto a la meta del mes', tone: 'redDark' };
  }

  return (
    <div>
      <SectionHead title="Salud del negocio" desc="Costos fijos, cuánto necesitás vender, y qué tan bien vas cumpliéndolo." />

      <div style={cardStyle}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Costos fijos mensuales</div>
        <div style={{ fontSize: 12, color: COLORS.ink3, marginBottom: 12 }}>Renta, planilla, servicios, internet — todo lo que pagás sí o sí, vendas o no vendas.</div>
        {costosFijosDetalle.map((c) => (
          <Row key={c.id} title={c.nombre} stats={[{ label: 'monto mensual', value: money(c.monto) }]} actions={<IconBtn icon={Trash2} onClick={() => removeCosto(c.id)} tone="red" title="Eliminar" />} />
        ))}
        <div className="form-row" style={{ marginTop: costosFijosDetalle.length ? 10 : 0 }}>
          <Field label="Concepto"><input style={inputStyle} placeholder="Ej: Alquiler del local" value={nuevoCosto.nombre} onChange={(e) => setNuevoCosto({ ...nuevoCosto, nombre: e.target.value })} /></Field>
          <Field label="Monto mensual (₡)"><input style={inputStyle} type="number" placeholder="350000" value={nuevoCosto.monto} onChange={(e) => setNuevoCosto({ ...nuevoCosto, monto: e.target.value })} /></Field>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}><button style={btnGhostSmall} onClick={addCosto}><Plus size={13} /> Agregar</button></div>
        </div>
        {costosFijosTotal > 0 && (
          <div style={{ marginTop: 12, fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700 }}>Total: {money(costosFijosTotal)} / mes</div>
        )}
      </div>

      {costosFijosTotal === 0 ? (
        <EmptyState text="Agregá al menos un costo fijo arriba para ver tu punto de equilibrio y tu meta de ventas." />
      ) : (
        <>
          <div style={cardStyle}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Configuración</div>
            <div className="form-row">
              <Field label="Días que opera por semana"><input style={inputStyle} type="number" value={data.diasOperacionSemana} onChange={(e) => setData({ ...data, diasOperacionSemana: e.target.value })} /></Field>
              <Field label="Food cost objetivo (%)"><input style={inputStyle} type="number" value={data.target} onChange={(e) => setData({ ...data, target: e.target.value })} /></Field>
              <Field label="Margen neto objetivo (%)"><input style={inputStyle} type="number" placeholder="8" value={data.metaMargenNetoPct} onChange={(e) => setData({ ...data, metaMargenNetoPct: e.target.value })} /></Field>
            </div>
            <div style={{ fontSize: 11.5, color: COLORS.ink4, marginTop: 8, lineHeight: 1.5 }}>
              En comida rápida, lo saludable es: food cost 20%–25% del precio, insumos + planilla juntos ("prime cost") por debajo de 60%, y margen neto final de 6%–10%. 8% es un objetivo sano para empezar — lo podés subir si tu negocio ya está bien afinado.
            </div>
            {!tienePlanilla && costosFijosTotal > 0 && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 10, padding: '8px 10px', background: '#FFFBEB', borderRadius: 8 }}>
                <TriangleAlert size={14} color="#B45309" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 11.5, color: '#B45309' }}>No veo "planilla" ni "salarios" en tus costos fijos. Si tenés empleados (o te pagás un sueldo a vos mismo), agregalo arriba — sin eso, la meta de venta va a salir más baja de lo que en realidad necesitás.</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <Kpi label="Margen de contribución" value={`${margenContribucionPct.toFixed(0)}%`} />
            <Kpi label="Punto de equilibrio (mes)" value={money(puntoEquilibrioMensual)} />
            <Kpi label="Meta de ventas (mes)" value={money(metaVentasMensual)} tone="blue" />
            <Kpi label="Utilidad neta esperada" value={money(metaUtilidadMensual)} tone="greenDark" />
            <Kpi label="Meta diaria" value={money(metaDiaria)} />
            <Kpi label="Meta semanal" value={money(metaSemanal)} />
          </div>
          {!brechaValida && (
            <div style={{ ...cardStyle, background: COLORS.redDim, borderColor: '#FCA5A5', fontSize: 12.5, color: COLORS.redDark }}>
              Tu margen de contribución ({margenContribucionPct.toFixed(0)}%) es menor que el margen neto que pusiste como meta ({metaMargenNetoPct}%) — matemáticamente no alcanza por más que vendas. Bajá la meta o subí precios/bajá costos de insumos primero.
            </div>
          )}

          <div style={cardStyle}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Este mes ({hoy.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' })})</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Kpi label="Ingreso neto hasta hoy" value={money(ingresoNetoMes)} />
              <Kpi label="Debería llevar (ritmo)" value={money(ritmoEsperado)} />
              <Kpi label="Proyección a fin de mes" value={money(proyeccionFinMes)} tone={proyeccionFinMes >= metaVentasMensual ? 'greenDark' : 'redDark'} />
              <Kpi label="Diferencia vs. ritmo" value={diferencia === null ? '—' : `${diferencia >= 0 ? '+' : ''}${money(diferencia)}`} tone={diferencia >= 0 ? 'greenDark' : 'redDark'} />
            </div>
            {estado && (
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: COLORS.surfaceDim, fontSize: 13, fontWeight: 700, color: COLORS[estado.tone] || COLORS.ink2 }}>
                {estado.emoji} {estado.texto}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, tone }) {
  return (
    <div style={kpiCard}>
      <div style={{ fontSize: 11, color: COLORS.ink3, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 5, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 19, fontWeight: 700, color: tone ? COLORS[tone] : COLORS.ink }}>{value}</div>
    </div>
  );
}