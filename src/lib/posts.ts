import { type CollectionEntry, getCollection } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

export type Category = { slug: string; label: string; en: string; tone: string; ink: string };

export const CATEGORIES: Category[] = [
	{ slug: 'rutinas', label: 'Rutinas y Piel', en: 'SKINCARE', tone: '#F3E3DF', ink: '#8A3B46' },
	{ slug: 'oliveyoung', label: 'Rankings Olive Young', en: 'OLIVE YOUNG', tone: '#E6E9DF', ink: '#4D5B3A' },
	{ slug: 'kdrama', label: 'K-Drama y Estilo', en: 'K-DRAMA', tone: '#E4E6EE', ink: '#3E4A72' },
	{ slug: 'ingredientes', label: 'Ingredientes y Ciencia', en: 'INGREDIENTS', tone: '#DFE8EA', ink: '#2F5B63' },
	{ slug: 'lifestyle', label: 'K-Lifestyle en Casa', en: 'K-CULTURE', tone: '#EEE4D6', ink: '#7A5530' },
];

const RULES: [RegExp, string][] = [
	[/olive\s*young|ranking|más\s*vendido|top|comparativa/i, 'oliveyoung'],
	[/drama|netflix|actriz|protagonista|maquillaje|labial|idol|k-pop/i, 'kdrama'],
	[/centella|mucina|arroz|niacinamida|retinol|ácido|ingrediente|spicule|reedle/i, 'ingredientes'],
	[/receta|ramen|snack|conveniencia|cultura|coreano|casa|slang/i, 'lifestyle'],
	[/rutina|piel|protector\s*solar|limpiador|doble\s*limpieza|acné|poros|hidratante/i, 'rutinas'],
];

/** Estima la categoría a partir del frontmatter o del título/slug */
export function categoryOf(post: Post): Category {
	const fm = (post.data as { category?: string }).category;
	if (fm) {
		const c = CATEGORIES.find((x) => x.slug === fm);
		if (c) return c;
	}
	const s = `${post.data.title} ${post.id}`;
	for (const [re, slug] of RULES) if (re.test(s)) return CATEGORIES.find((c) => c.slug === slug)!;
	return CATEGORIES[0];
}

export async function getPosts(): Promise<Post[]> {
	return (await getCollection('blog')).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** En español se leen aprox. 200 palabras (~1100 caracteres) por minuto */
export function readingMinutes(post: Post): number {
	const body = (post.body ?? '').replace(/[#>*|\-:`]/g, '');
	return Math.max(1, Math.round(body.length / 1100));
}

/** Si heroImage es el placeholder de Astro, usa la portada tipográfica */
export const isPlaceholder = (post: Post) => !post.data.heroImage || /blog-placeholder/.test(post.data.heroImage.src);

/** Título corto sin corchetes iniciales */
export function shortTitle(title: string): string {
	return title.replace(/^\[[^\]]*\]\s*/, '').replace(/^【[^】]*】\s*/, '');
}

export function related(all: Post[], post: Post, n = 3): Post[] {
	const cat = categoryOf(post).slug;
	const same = all.filter((p) => p.id !== post.id && categoryOf(p).slug === cat);
	const rest = all.filter((p) => p.id !== post.id && categoryOf(p).slug !== cat);
	return [...same, ...rest].slice(0, n);
}

export function fmtDate(d: Date): string {
	return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
