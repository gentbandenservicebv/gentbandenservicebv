export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\//g, "-") // 205/55 -> 205-55
    .replace(/[^a-z0-9 -]/g, "") // remove non-alphanumeric
    .replace(/\s+/g, "-") // whitespace to dash
    .replace(/-+/g, "-") // collapse dashes
    .replace(/^-+|-+$/g, ""); // trim dashes
}

export function generateTyreSlug(brand: string, model: string, size: string, id?: string): string {
  const base = slugify(`${brand} ${model} ${size}`);
  if (id) {
    return `${base}-${id.slice(-6).toLowerCase()}`;
  }
  return base;
}
