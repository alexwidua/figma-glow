import chroma, { Color } from 'chroma-js'

export function GLtoHex(color: RGBA) {
	return chroma.gl(color.r, color.g, color.b, color.a).hex()
}

export function hexToGL(color: Color | string): RGBA {
	const hexToRGBA = chroma(color).gl()
	return {
		r: hexToRGBA[0],
		g: hexToRGBA[1],
		b: hexToRGBA[2],
		a: hexToRGBA[3]
	}
}

export function brightenColor(color: string, factor: number = 3.125) {
	return chroma(color).brighten(factor)
}

export function stripHash(color: string) {
	return color.replace('#', '')
}
