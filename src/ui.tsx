import { h } from 'preact'
import { useRef, useState, useEffect, useCallback } from 'preact/hooks'
import { render } from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { debounce } from './utils/debounce'
import { stripHash } from './utils/color'
import { Light } from './components/light/light'
import { ColorInput } from './components/color-input/color-input'
import { Menu } from './components/menu/menu'
import { DEFAULT_BRIGHTNESS, DEBOUNCE_MS } from './constants'
import { OptionKey } from './components/menu/menu'
import { SelectionState } from './utils/selection'
import styles from './ui.css'

function Plugin() {
	const containerRef = useRef(null)
	const [brightness, setBrightness] = useState(DEFAULT_BRIGHTNESS)
	const [glowColor, setGlowColor] = useState('ffffff')
	const [matchFillColor, setMatchFillColor] = useState('true')

	const handleBrightnessChange = useCallback((brightness: number) => {
		setBrightness(brightness)
		debounceEmitEvent('BRIGHTNESS_CHANGE_FROM_UI', brightness)
	}, [])

	const handleGlowColorChange = useCallback((color: string) => {
		setGlowColor(color)
		debounceEmitEvent('COLOR_CHANGE_FROM_UI', color)
	}, [])

	const handleGlowOptionsChange = useCallback(
		(key: OptionKey, value: string) => {
			if (key === 'match-fill-color') {
				setMatchFillColor(value)
				emit('OPTION_CHANGE_FROM_UI', {
					key,
					value: value === 'true'
				})
			}
		},
		[]
	)

	const debounceEmitEvent = useCallback(
		debounce((event, data) => emit(event, data), DEBOUNCE_MS),
		[]
	)

	/**
	 * Handle selection etc.
	 */
	const [selectionState, setSelectionState] =
		useState<SelectionState>('EMPTY')
	const [hasMixedColors, setHasMixedColors] = useState(false)

	useEffect(() => {
		on('SELECTION_CHANGE', handleSelectionChange)
	}, [])

	const handleSelectionChange = useCallback(
		(data: { state: SelectionState; fill: string }) => {
			const { state, fill } = data
			let color = 'ffffff'
			let mixed = false
			setSelectionState(state)
			if (fill) {
				if (fill === 'MIXED') {
					mixed = true
				} else {
					color = stripHash(fill)
				}
			}
			setHasMixedColors(mixed)
			if (state === 'EMPTY') return
			setGlowColor(color)
		},
		[]
	)

	return (
		<div className={styles.container} ref={containerRef}>
			<Light
				glowColor={glowColor}
				brightness={brightness}
				matchFillColor={matchFillColor ? true : false}
				onBrightnessChange={handleBrightnessChange}
			/>
			<Menu
				containerRef={containerRef}
				selectionState={selectionState}
				brightness={brightness}
				matchFillColor={matchFillColor}
				onOptionChange={handleGlowOptionsChange}
				onBrightnessChange={handleBrightnessChange}
				onApplyButtonClick={() => emit('APPLY')}
			/>
			<ColorInput
				hexColor={glowColor}
				onHexColorInput={handleGlowColorChange}
				opacity={'100%'}
				hasMixedColors={hasMixedColors}
			/>
		</div>
	)
}

export default render(Plugin)
