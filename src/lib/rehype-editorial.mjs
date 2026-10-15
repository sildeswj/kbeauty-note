// Rehype plugin para dar formato editorial de revista al cuerpo del artículo:
// 1) Envuelve encabezados de "Conclusión / Puntos clave / Resumen" y la lista siguiente en .summary-box
// 2) Envuelve tablas en .table-wrap con scroll horizontal
// 3) Limpia <hr> innecesarios antes de h2
const text = (n) => (n.type === 'text' ? n.value : (n.children || []).map(text).join(''));
const isHeading = (n) => n.type === 'element' && /^h[2-4]$/.test(n.tagName);

function fixStars(node) {
	if (!node.children) return;
	const next = [];
	for (const c of node.children) {
		if (c.type === 'text' && c.value.includes('**')) {
			const parts = c.value.split(/\*\*([^*]+?)\*\*/);
			parts.forEach((v, i) => {
				if (!v) return;
				next.push(i % 2 ? { type: 'element', tagName: 'strong', properties: {}, children: [{ type: 'text', value: v }] } : { type: 'text', value: v });
			});
		} else {
			if (c.type === 'element' && c.tagName !== 'code' && c.tagName !== 'pre') fixStars(c);
			next.push(c);
		}
	}
	node.children = next;
}

export default function rehypeEditorial() {
	return (tree) => {
		const out = [];
		const kids = tree.children;
		for (let i = 0; i < kids.length; i++) {
			const n = kids[i];
			if (isHeading(n) && /conclusi[oó]n|puntos\s*clave|resumen|en\s*pocas\s*palabras|lo\s*esencial/i.test(text(n))) {
				const box = {
					type: 'element',
					tagName: 'aside',
					properties: { className: ['summary-box'] },
					children: [{ ...n, tagName: 'p', properties: { className: ['summary-title'] } }],
				};
				let j = i + 1;
				while (j < kids.length && !isHeading(kids[j]) && !(kids[j].type === 'element' && kids[j].tagName === 'hr')) {
					box.children.push(kids[j]);
					j++;
				}
				out.push(box);
				i = j - 1;
				continue;
			}
			if (n.type === 'element' && n.tagName === 'table') {
				out.push({ type: 'element', tagName: 'div', properties: { className: ['table-wrap'] }, children: [n] });
				continue;
			}
			out.push(n);
		}
		const els = out.filter((n) => n.type === 'element');
		const firstH = els.findIndex(isHeading);
		tree.children = out.filter((n) => {
			if (!(n.type === 'element' && n.tagName === 'hr')) return true;
			const i = els.indexOf(n);
			const nextEl = els[i + 1];
			return !(firstH === -1 || i < firstH || (nextEl && nextEl.tagName === 'h2'));
		});
		fixStars(tree);
	};
}
