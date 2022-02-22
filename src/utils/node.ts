export function findSolidPaintLayer(fills: any) {
	return fills.find((fill: any) => fill.type === 'SOLID')
}
