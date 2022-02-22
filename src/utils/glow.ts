import { hexToGL, brightenColor } from './color'

const NUM_SHADOW_LAYERS = 6
const glowMap = [1, 2, 7, 14, 24, 42] // values fine-tuned by hand, just trial & error

interface GlowProps {
	glowColor: string
	matchFillColor: boolean
	size?: { width: number; height: number }
	intensity?: number
}

export function getGlowLayers({
	glowColor,
	matchFillColor,
	size = { width: 50, height: 50 },
	intensity = 8
}: GlowProps) {
	// scale effect with node size
	const { width, height } = size
	const longestSide = Math.max(width, height)
	const factor = longestSide / 100
	const scale = intensity * factor

	const brightened = brightenColor(glowColor)
	const mappedGlowColor = hexToGL(glowColor)
	const mappedFillColor = hexToGL(brightened)

	const glow = Array.from({ length: NUM_SHADOW_LAYERS }, (_, i) => {
		// if matchFillColor is set, add a glowy/blurry edge to the glwoing element
		const color =
			i < 3 && matchFillColor ? mappedFillColor : mappedGlowColor

		const effect: DropShadowEffect = {
			type: 'DROP_SHADOW',
			color,
			offset: {
				x: 0,
				y: 0
			},
			radius: scale * glowMap[i],
			spread: 0,
			visible: true,
			blendMode: 'NORMAL'
		}
		return effect
	})

	return glow
}
