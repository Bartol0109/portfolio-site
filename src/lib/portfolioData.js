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
    featured: tags.some((tag) => String(tag).toLowerCase() === 'featured'),
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
  const featured = items.filter((item) => item.featured)
  return (featured.length ? featured : items.slice(0, 3)).map((item) => ({
    ...item,
    image: item.image || '',
  }))
}
