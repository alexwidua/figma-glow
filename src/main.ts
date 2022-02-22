import {
	on,
	once,
	emit,
	showUI,
	getSceneNodeById
} from '@create-figma-plugin/utilities'
import { getGlowLayers } from './utils/glow'
import { GLtoHex, hexToGL, brightenColor } from './utils/color'
import { findSolidPaintLayer } from './utils/node'
import { SelectionState, validateSelection } from './utils/selection'
import {
	PLUGIN_WIDTH,
	PLUGIN_HEIGHT,
	VALID_NODE_TYPES,
	DEFAULT_BRIGHTNESS
} from './constants'
import { OptionKey } from './components/menu/menu'

export type GlowNode = FrameNode | RectangleNode
export type SelectionChangeEvent = {
	state: SelectionState
	fill: string | undefined
}

export default function () {
	let nodeRefs: Array<string> = []
	let existingNodeEffects: Array<{ id: string; effects: any; fills: any }> =
		[]

	// options
	let brightnessFromUI: number = DEFAULT_BRIGHTNESS
	let colorFromUI: string | undefined = undefined
	let matchFillColor: boolean = true

	let APPLIED_GLOW_EFFECTS: true | undefined

	const handleSelectionChange = () => {
		const selection = figma.currentPage.selection
		const state = validateSelection(selection, VALID_NODE_TYPES)
		let data: SelectionChangeEvent = {
			state,
			fill: undefined
		}
		switch (state) {
			case 'EMPTY':
				colorFromUI = undefined
				resetEverythingAndRestorePrevProps()
				break
			case 'INVALID':
				colorFromUI = undefined
				resetEverythingAndRestorePrevProps()
				figma.notify(
					`Element of type ${selection[0].type} does not support glow effects.`
				)
				break
			case 'MULTIPLE':
				resetEverythingAndRestorePrevProps()
				selection.forEach((node) => {
					const isNodeSupported = validateSelection(
						[node],
						VALID_NODE_TYPES
					)
					if (isNodeSupported === 'VALID') {
						const id = node.id
						nodeRefs = [...nodeRefs, id]
						const fills =
							node.type === 'GROUP'
								? null
								: (node as GlowNode).fills
						const effects = (node as GlowNode).effects
						existingNodeEffects = [
							...existingNodeEffects,
							{ id, fills, effects }
						]
						updateGlowLayers(node.id)
					} else {
						figma.notify(
							`Selection contains unsupported element of type ${node.type} that will be skipped.`
						)
					}
				})
				data = { ...data, fill: 'MIXED' }
				break
			case 'VALID':
				if (nodeRefs.length) {
					resetEverythingAndRestorePrevProps()
				}
				const node = selection[0] as GlowNode | GroupNode
				if (node.type === 'GROUP') {
					recursivelyUpdateGlowLayers(node.children)
					data = { ...data, fill: 'MIXED' }
				} else {
					const id = node.id
					nodeRefs = [...nodeRefs, id]
					const fills = node.fills
					const effects = node.effects
					existingNodeEffects = [
						...existingNodeEffects,
						{ id, fills, effects }
					]
					updateGlowLayers(id, (fill: string) => {
						data = { ...data, fill }
					})
				}
				break
			default:
				console.error(`Couldn't get selected elements.`)
		}
		emit('SELECTION_CHANGE', data)
	}

	function recursivelyUpdateGlowLayers(array: readonly SceneNode[]) {
		array.forEach((node) => {
			const isNodeSupported = validateSelection([node], VALID_NODE_TYPES)
			if (isNodeSupported === 'VALID') {
				if (node.type === 'GROUP') {
					recursivelyUpdateGlowLayers(node.children)
				} else {
					const id = node.id
					nodeRefs = [...nodeRefs, id]
					const fills = (node as GlowNode).fills
					const effects = (node as GlowNode).effects
					existingNodeEffects = [
						...existingNodeEffects,
						{ id, fills, effects }
					]
					updateGlowLayers(node.id)
				}
			} else {
				figma.notify(
					`Selection contains unsupported element of type ${node.type} that will be skipped.`
				)
			}
		})
	}

	function updateGlowLayers(id: any, fillCallback?: any) {
		let glowColor
		const node = figma.getNodeById(id) as GlowNode
		if (!node) return
		const fills = node.fills as Paint[]
		const hasSolidPaintLayer = findSolidPaintLayer(fills)

		if (hasSolidPaintLayer) {
			glowColor =
				colorFromUI ||
				GLtoHex({
					...(hasSolidPaintLayer as SolidPaint).color,
					a: hasSolidPaintLayer.opacity || 1
				})
			if (matchFillColor) {
				const brightened = brightenColor(glowColor)
				const toGL = hexToGL(brightened)
				node.fills = [
					{
						type: 'SOLID',
						visible: true,
						opacity: 1,
						blendMode: 'NORMAL',
						color: { r: toGL.r, g: toGL.g, b: toGL.b }
					}
				]
			}
		} else {
			if (figma.currentPage.selection.length === 1) {
				return figma.notify(
					`Selected element doesn't contain a solid fill layer.`
				)
			} else {
				return figma.notify(
					`One of the selected elements doesn't contain a solid fill layer.`
				)
			}
		}

		const size = { width: node.width, height: node.height }
		const glow: DropShadowEffect[] = getGlowLayers({
			glowColor,
			matchFillColor,
			size,
			brightness: brightnessFromUI
		})
		node.effects = glow
		if (fillCallback) fillCallback(glowColor)
	}

	function restorePreviousProperties(id: any) {
		const node = figma.getNodeById(id)
		if (node) {
			const restorePrevEffects = existingNodeEffects.find(
				(node) => node.id === id
			)
			if (restorePrevEffects) {
				;(node as GlowNode).effects = restorePrevEffects.effects
				;(node as GlowNode).fills = restorePrevEffects.fills
			}
		}
	}

	function resetEverythingAndRestorePrevProps(id = ''): void {
		if (APPLIED_GLOW_EFFECTS) return
		if (!id) {
			nodeRefs.forEach((id) => {
				restorePreviousProperties(id)
			})
			nodeRefs = []
			existingNodeEffects = []
		} else {
			const node = getSceneNodeById(id)
			if (!node || node.removed) return
			restorePreviousProperties(id)
		}

		nodeRefs = nodeRefs.filter((id) => id !== id)
		existingNodeEffects = existingNodeEffects.filter(
			(node) => node.id !== id
		)
	}

	/**
	 * Event listeners
	 */
	on('COLOR_CHANGE_FROM_UI', (value) => {
		colorFromUI = value
		handleSelectionChange()
	})
	on('BRIGHTNESS_CHANGE_FROM_UI', (value) => {
		brightnessFromUI = value
		handleSelectionChange()
	})
	on(
		'OPTION_CHANGE_FROM_UI',
		(option: { key: OptionKey; value: boolean }) => {
			const { key, value } = option
			if (key === 'match-fill-color') {
				matchFillColor = value
			}
			handleSelectionChange()
		}
	)
	once('APPLY', function () {
		APPLIED_GLOW_EFFECTS = true
		figma.closePlugin()
	})
	figma.on('close', resetEverythingAndRestorePrevProps)
	figma.on('selectionchange', handleSelectionChange)

	showUI({
		width: PLUGIN_WIDTH,
		height: PLUGIN_HEIGHT
	})
	handleSelectionChange()
}
