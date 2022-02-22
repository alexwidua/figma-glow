export function clamp(num: number, min: number, max: number): number {
	return Math.min(Math.max(num, min), max)
}

export function normalize(value: number, min: number, max: number): number {
	return (value - min) / (max - min)
}

export function denormalize(value: number, min: number, max: number): number {
	return value * (max - min) + min
}

export function round(value: number, decimals: number = 0) {
	return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}
