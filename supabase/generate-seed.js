const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync('src/data/menu.json', 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(raw);

function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/'/g, "''");
}

function sqlString(value) {
  if (!value) return 'NULL';
  return `'${esc(value)}'`;
}

const lines = [];
lines.push('-- MMC Central seed data (categories + products)');
lines.push('-- Generated from src/data/menu.json');
lines.push('-- Note: legacy_id = product id inside each category (matches site URLs)');
lines.push('');
lines.push('TRUNCATE public.products RESTART IDENTITY;');
lines.push('TRUNCATE public.categories RESTART IDENTITY CASCADE;');
lines.push('');

lines.push('INSERT INTO public.categories (id, name, slug, icon, description, sort_order, is_active) VALUES');
const categoryRows = data.map((category, index) => {
  return `  (${category.id}, '${esc(category.name)}', '${esc(category.slug)}', '${esc(category.icon || '')}', '${esc(category.description || '')}', ${index + 1}, true)`;
});
lines.push(`${categoryRows.join(',\n')};`);
lines.push('');
lines.push("SELECT setval(pg_get_serial_sequence('public.categories', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.categories));");
lines.push('');

const products = [];
data.forEach((category) => {
  (category.products || []).forEach((product, index) => {
    products.push({
      ...product,
      category_id: category.id,
      legacy_id: product.id,
      sort_order: index + 1,
    });
  });
});

lines.push('INSERT INTO public.products (category_id, legacy_id, name, price, weight, image, hover_image, description, available, sort_order) VALUES');
const productRows = products.map((product) => {
  const price = product.price != null ? product.price : 'NULL';
  const available = product.available === false ? 'false' : 'true';
  return `  (${product.category_id}, ${product.legacy_id}, '${esc(product.name)}', ${price}, ${sqlString(product.weight)}, ${sqlString(product.image)}, ${sqlString(product.hoverImage)}, ${sqlString(product.description)}, ${available}, ${product.sort_order})`;
});
lines.push(`${productRows.join(',\n')}\nON CONFLICT (category_id, legacy_id) DO UPDATE SET`);
lines.push('  name = EXCLUDED.name,');
lines.push('  price = EXCLUDED.price,');
lines.push('  weight = EXCLUDED.weight,');
lines.push('  image = EXCLUDED.image,');
lines.push('  hover_image = EXCLUDED.hover_image,');
lines.push('  description = EXCLUDED.description,');
lines.push('  available = EXCLUDED.available,');
lines.push('  sort_order = EXCLUDED.sort_order;');
lines.push('');
lines.push("SELECT setval(pg_get_serial_sequence('public.products', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.products));");

fs.writeFileSync(path.join(__dirname, '02_seed_data.sql'), `${lines.join('\n')}\n`, 'utf8');
console.log(`Generated 02_seed_data.sql with ${data.length} categories and ${products.length} products.`);
