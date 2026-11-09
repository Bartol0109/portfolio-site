export const FALLBACK_PICKS = [
  { id: 'p1', title: 'Construction Company Website', year: '2026', image: '/slike/Portfolio1.jpeg', category: 'Web Design' },
  { id: 'p4', title: 'Full-stack Application', year: '2025', image: '/slike/Portfolio4.jpeg', category: 'College Project' },
  { id: 'p6', title: '2D Game Development', year: '2026', image: '/slike/Portfolio6.png', category: 'Game Development' },
]

export const WORK_CATEGORIES = ['Web Sites', 'Mobile Apps', 'Graphic Designs', 'College Projects', 'Game Development']

export function normalizeItem(item) {
  const tags = Array.isArray(item.tags) ? item.tags : []
  return {
    id: item.id,
    category: item.category || '',
    title: item.title || '',
    description: item.description || '',
    image: item.image || '',
    tags,
    gallery: item.gallery || [],
    links: item.links || [],
    year: item.year || '',
    featuredOrder: item.featured_order == null || item.featured_order === '' ? null : Number(item.featured_order),
  }
}

export async function loadPortfolioItems() {
  try {
    const res = await fetch('/api/portfolio.php')
    if (!res.ok) return null
    const data = await res.json().catch(() => null)
    if (!data || !Array.isArray(data.items)) return null
    return data.items.map(normalizeItem)
  } catch {
    return null
  }
}

export function picksFromItems(items) {
  if (!items || items.length === 0) return FALLBACK_PICKS
  const ranked = items
    .filter((item) => Number.isFinite(item.featuredOrder) && item.featuredOrder > 0)
    .sort((a, b) => a.featuredOrder - b.featuredOrder)
    .slice(0, 5)
  const chosen = ranked.length ? ranked : items.slice(0, 3)
  return chosen.map((item) => ({ ...item, image: item.image || '' }))
}
