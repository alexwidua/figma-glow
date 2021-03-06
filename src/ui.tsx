import { h } from 'preact'
import { useRef, useState, useEffect, useCallback } from 'preact/hooks'
import { render } from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { debounce } from './utils/debounce'
import { stripHash } from './utils/color'
import { Light } from './components/light/light'
import { ColorInput } from './components/color-input/color-input'
import { Menu } from './components/menu/menu'
import {
	DEFAULT_INTENSITY,
	DEBOUNCE_MS,
	DEFAULT_COLOR,
	DEFAULT_MATCH_FILL_COLOR
} from './constants'
import { OptionKey } from './components/menu/menu'
import { SelectionState } from './utils/selection'
import { SelectionChangeEvent } from './main'
import styles from './ui.css'

function Plugin() {
	const containerRef = useRef(null)
	const [intensity, setIntensity] = useState(DEFAULT_INTENSITY)
	const [glowColor, setGlowColor] = useState(DEFAULT_COLOR)
	const [matchFillColor, setMatchFillColor] = useState(
		DEFAULT_MATCH_FILL_COLOR ? 'true' : ''
	)

	const handleIntensityChange = useCallback((intensity: number) => {
		setIntensity(intensity)
		debounceEmitEvent('INTENSITY_CHANGE_FROM_UI', intensity)
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

	const handleMatchFillColorChange = useCallback(
		(matchFillColor: boolean) => {
			const key = 'match-fill-color'
			const value = matchFillColor ? '' : 'true'
			setMatchFillColor(value)
			emit('OPTION_CHANGE_FROM_UI', {
				key,
				value: value === 'true'
			})
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

	const handleSelectionChange = useCallback((data: SelectionChangeEvent) => {
		const { state, fill } = data
		let color = DEFAULT_COLOR
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
	}, [])

	return (
		<div className={styles.container} ref={containerRef}>
			<Light
				glowColor={glowColor}
				intensity={intensity}
				matchFillColor={matchFillColor ? true : false}
				onIntensityChange={handleIntensityChange}
				onMatchFillColorChange={() =>
					handleMatchFillColorChange(matchFillColor === 'true')
				}
			/>
			<Menu
				containerRef={containerRef}
				selectionState={selectionState}
				intensity={intensity}
				matchFillColor={matchFillColor}
				onOptionChange={handleGlowOptionsChange}
				onIntensityChange={handleIntensityChange}
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
