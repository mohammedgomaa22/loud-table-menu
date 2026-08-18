/**
 * Parse Project_Files&Data/menu.xlsx into supabase/10_seed_from_menu_xlsx.sql
 * Usage: node supabase/extract-menu-xlsx.js
 */
const fs = require('fs');
const path = require('path');

const xlsxPath = path.join(
  process.env.TEMP || '',
  'xlsx-parse',
  'node_modules',
  'xlsx'
);
const XLSX = require(xlsxPath);

const workbookPath = path.join(__dirname, '..', 'Project_Files&Data', 'menu.xlsx');
const outPath = path.join(__dirname, '10_seed_from_menu_xlsx.sql');

const CATEGORIES = [
  { sheet: 'PASTRY', name: 'Pastry', slug: 'pastry', layout: 'pastry' },
  { sheet: 'BAKERY', name: 'Bakery', slug: 'bakery', layout: 'pastry' },
  { sheet: 'COLD KITCHEN', name: 'Cold Kitchen', slug: 'cold-kitchen', layout: 'cold' },
  { sheet: 'SALAD', name: 'Salad', slug: 'salad', layout: 'salad' },
  { sheet: 'SANDWICH', name: 'Sandwich', slug: 'sandwich', layout: 'sandwich' },
  { sheet: 'SOUPS', name: 'Soups', slug: 'soups', layout: 'salad' },
  { sheet: 'JUICES', name: 'Juices', slug: 'juices', layout: 'salad' }
];

function esc(value) {
  return String(value).replace(/'/g, "''");
}

function sqlString(value) {
  if (value === null || value === undefined || value === '') return 'NULL';
  return `'${esc(value)}'`;
}

function sqlNum(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'NULL';
  return String(value);
}

function parseMoney(value) {
  if (value == null || value === '') return null;
  const n = Number(String(value).replace(/KWD/gi, '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function parsePercent(value) {
  if (value == null || value === '') return null;
  const n = Number(String(value).replace(/%/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function looksLikeWeight(text) {
  if (!text) return false;
  return /^\d+(?:\.\d+)?\s*(KG|GR|G)\b/i.test(String(text).trim());
}

function formatWeight(value) {
  if (value == null || value === '') return null;
  const raw = String(value).trim();
  if (looksLikeWeight(raw)) {
    return raw.toUpperCase().replace(/\s+/g, ' ');
  }
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) {
    if (n < 20) return `${Math.round(n * 1000)} GR`;
    return `${Math.round(n)} GR`;
  }
  return null;
}

function cleanName(name) {
  return String(name || '')
    .replace(/^ASM\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractWeightFromName(name) {
  const match = String(name).match(/\(\s*(\d+(?:\.\d+)?)\s*(GR|KG|G)\b/i);
  if (!match) return null;
  return `${match[1]} ${match[2].toUpperCase()}`;
}

function mapRow(layout, row) {
  if (!row) return null;
  const sr = Number(row[0]);
  if (!Number.isFinite(sr)) return null;

  let name;
  let portion;
  let food;
  let pack;
  let cogs;
  let margin;
  let priceWithout;
  let finalPrice;
  let comments;

  if (layout === 'pastry') {
    name = row[1];
    food = row[3];
    pack = row[4];
    cogs = row[5];
    margin = row[6];
    priceWithout = row[7];
    finalPrice = row[8];
    comments = row[9];
  } else if (layout === 'cold') {
    name = row[1];
    portion = row[3];
    food = row[4];
    pack = row[5];
    cogs = row[6];
    margin = row[7];
    priceWithout = row[8];
    finalPrice = row[9];
    comments = row[10];
  } else if (layout === 'sandwich') {
    name = row[2];
    portion = row[4];
    food = row[5];
    pack = row[6];
    cogs = row[7];
    margin = row[8];
    priceWithout = row[9];
    finalPrice = row[10];
    comments = row[11];
  } else {
    name = row[1];
    portion = row[3];
    food = row[4];
    pack = row[5];
    cogs = row[6];
    margin = row[7];
    priceWithout = row[8];
    finalPrice = row[9];
    comments = row[10];
  }

  const cleaned = cleanName(name);
  if (!cleaned) return null;

  const commentText = comments ? String(comments).trim() : '';
  let weight = formatWeight(portion) || extractWeightFromName(cleaned);
  let description = null;
  let notes = null;

  if (looksLikeWeight(commentText)) {
    if (!weight) weight = formatWeight(commentText);
  } else if (commentText) {
    if (commentText.split(/\s+/).length >= 5) description = commentText;
    else notes = commentText;
  }

  const priceWithoutNum = parseMoney(priceWithout);
  const finalNum = parseMoney(finalPrice);

  return {
    legacy_id: sr,
    name: cleaned,
    price: finalNum != null ? finalNum : priceWithoutNum,
    weight,
    description,
    comments: notes,
    food_cost: parseMoney(food),
    packaging_cost: parseMoney(pack),
    cogs_percent: parsePercent(cogs),
    margin_percent: parsePercent(margin),
    price_without_packaging: priceWithoutNum
  };
}

const wb = XLSX.readFile(workbookPath, { cellDates: true });
const categories = [];
const products = [];

CATEGORIES.forEach((cat, index) => {
  const sheet = wb.Sheets[cat.sheet];
  if (!sheet) throw new Error(`Missing sheet: ${cat.sheet}`);
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false });
  const categoryId = index + 1;
  categories.push({
    id: categoryId,
    name: cat.name,
    slug: cat.slug,
    sort_order: categoryId
  });

  let sort = 0;
  rows.forEach((row) => {
    const product = mapRow(cat.layout, row);
    if (!product) return;
    sort += 1;
    products.push({
      ...product,
      category_id: categoryId,
      sort_order: sort
    });
  });
});

const lines = [];
lines.push('-- MMC Central seed from Project_Files&Data/menu.xlsx');
lines.push('-- Run in: Supabase Dashboard → SQL Editor');
lines.push('-- Clears existing categories/products, then inserts extracted menu data.');
lines.push('');
lines.push('TRUNCATE public.products RESTART IDENTITY;');
lines.push('TRUNCATE public.categories RESTART IDENTITY CASCADE;');
lines.push('');
lines.push('INSERT INTO public.categories (id, name, slug, description, sort_order, is_active) VALUES');
lines.push(
  categories
    .map((c) => `  (${c.id}, '${esc(c.name)}', '${esc(c.slug)}', NULL, ${c.sort_order}, true)`)
    .join(',\n') + ';'
);
lines.push('');
lines.push("SELECT setval(pg_get_serial_sequence('public.categories', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.categories));");
lines.push('');
lines.push('INSERT INTO public.products (');
lines.push('  category_id, legacy_id, name, price, weight, description, available, sort_order,');
lines.push('  food_cost, packaging_cost, cogs_percent, margin_percent, price_without_packaging, comments');
lines.push(') VALUES');

const productRows = products.map((p) => {
  return `  (${p.category_id}, ${p.legacy_id}, ${sqlString(p.name)}, ${sqlNum(p.price)}, ${sqlString(p.weight)}, ${sqlString(p.description)}, true, ${p.sort_order}, ${sqlNum(p.food_cost)}, ${sqlNum(p.packaging_cost)}, ${sqlNum(p.cogs_percent)}, ${sqlNum(p.margin_percent)}, ${sqlNum(p.price_without_packaging)}, ${sqlString(p.comments)})`;
});

lines.push(productRows.join(',\n') + ';');
lines.push('');
lines.push("SELECT setval(pg_get_serial_sequence('public.products', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.products));");
lines.push('');
lines.push('SELECT c.name, COUNT(p.id) AS products');
lines.push('FROM public.categories c');
lines.push('LEFT JOIN public.products p ON p.category_id = c.id');
lines.push('GROUP BY c.name, c.sort_order');
lines.push('ORDER BY c.sort_order;');

fs.writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');
console.log(`Wrote ${outPath}`);
console.log(`Categories: ${categories.length}`);
console.log(`Products: ${products.length}`);
categories.forEach((c) => {
  const count = products.filter((p) => p.category_id === c.id).length;
  console.log(`  - ${c.name}: ${count}`);
});
