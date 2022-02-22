import { h, JSX, ComponentChildren, RefObject } from 'preact'
import { useRef, useState, useEffect, useCallback } from 'preact/hooks'
import {
	Button,
	Columns,
	Container,
	SegmentedControl,
	Text,
	IconControlCheckboxChecked12,
	IconCircleHelp16,
	IconEllipsis32,
	createClassName,
	OnValueChange,
	TextboxNumeric,
	Divider,
	Props,
	VerticalSpace
} from '@create-figma-plugin/ui'
import {
	intensityToPercentage,
	percentageToRawIntensityValue
} from '../light/light'

import { Panel, Tooltip } from '@alexwidua/create-figma-plugin-components'
import styles from './menu.css'

import { SelectionState } from '../../utils/selection'

interface MenuProps {
	containerRef: RefObject<HTMLDivElement>
	selectionState: SelectionState
	intensity: number
	matchFillColor: string
	onOptionChange: (name: OptionKey, value: string) => void
	onIntensityChange: (value: number) => void
	onApplyButtonClick: () => void
}

export type OptionKey = 'match-fill-color'

export function Menu({
	containerRef,
	selectionState,
	intensity,
	matchFillColor,
	onOptionChange,
	onIntensityChange,
	onApplyButtonClick
}: MenuProps) {
	const [optionsPanelOpen, setOptionsPanelOpen] = useState<boolean>(false)
	const menuRef = useRef<HTMLDivElement>(null)
	const options = [
		{ value: '', children: '-' },
		{ value: 'true', children: <IconControlCheckboxChecked12 /> }
	]

	const [tempIntensity, setTempIntensity] = useState('0%')
	const validateIntensity = (value: null | number) => {
		if (value === null) return null
		const valid = value >= 0 && value <= 100
		if (valid) {
			const normalized = percentageToRawIntensityValue(value)
			onIntensityChange(normalized)
		}

		return valid
	}

	useEffect(() => {
		setTempIntensity(`${intensityToPercentage(intensity)}%`)
	}, [intensity])

	const effectIsApplicable =
		selectionState !== 'INVALID' && selectionState !== 'EMPTY'

	return (
		<div className={styles.menu} ref={menuRef}>
			<Panel
				open={optionsPanelOpen}
				boundsRef={containerRef}
				anchorRef={menuRef}
				anchorAlign="RIGHT"
				anchorMargin={0}
				onClose={() => setOptionsPanelOpen(false)}>
				<Container style={{ padding: 16 }}>
					<TextboxNumeric
						name={'intensity'}
						suffix={'%'}
						maximum={100}
						minimum={0}
						icon={
							<IconIntensity16
								v={1 - intensityToPercentage(intensity) / 50}
							/>
						}
						onInput={(e: JSX.TargetedEvent<HTMLInputElement>) =>
							setTempIntensity(e.currentTarget.value)
						}
						value={tempIntensity}
						validateOnBlur={validateIntensity}
						noBorder
					/>
					<VerticalSpace space={'small'} />
					<Divider
						style={{
							//@ts-ignore next-line
							marginLeft: 'calc(var(--space-small)*-1)',
							//@ts-ignore next-line
							width: 'calc(100% + (var(--space-small)*2))'
						}}
					/>
					<VerticalSpace space={'small'} />
					<div className={styles.grid}>
						<div style={{ display: 'flex', alignItems: 'center' }}>
							<Text
								style={{
									whiteSpace: 'nowrap',
									selfAlign: 'center',
									marginRight: 4
								}}>
								Match Fill color
							</Text>
							<Tooltip
								value={{
									tooltip: `Match fill color to the current glow color.`,

									children: (
										<IconCircleHelp16
											style={{
												opacity: 0.4
											}}
										/>
									)
								}}
								width={194}
							/>
						</div>
						<SegmentedControl
							name={'match-fill-color' as OptionKey}
							onChange={(e) =>
								onOptionChange(
									e.currentTarget.name as OptionKey,
									e.currentTarget.value
								)
							}
							options={options}
							value={matchFillColor}
						/>
					</div>
				</Container>
			</Panel>
			<Columns space={'extraSmall'}>
				<IconButton
					onChange={() => setOptionsPanelOpen((prev) => !prev)}
					value={optionsPanelOpen}>
					<IconEllipsis32 color={'white'} />
				</IconButton>
				<Button
					onClick={onApplyButtonClick}
					style={{
						minWidth: 96,
						background: effectIsApplicable
							? 'var(--color-blue)'
							: 'rgb(90,90,90)'
					}}
					disabled={!effectIsApplicable}>
					Apply
				</Button>
			</Columns>
		</div>
	)
}

/* Forked from https://github.com/yuanqing/create-figma-plugin/blob/main/packages/ui/src/components/icon-button/icon-button.tsx */
type IconButtonProps<Name extends string> = {
	children: ComponentChildren
	disabled?: boolean
	name?: Name
	onChange?: OmitThisParameter<JSX.GenericEventHandler<HTMLInputElement>>
	onValueChange?: OnValueChange<boolean, Name>
	propagateEscapeKeyDown?: boolean
	value: boolean
}
function IconButton<Name extends string>({
	children,
	disabled = false,
	name,
	onChange = function () {},
	onValueChange = function () {},
	propagateEscapeKeyDown = true,
	value,
	...rest
}: Props<HTMLInputElement, IconButtonProps<Name>>): JSX.Element {
	const handleChange = useCallback(
		function (event: JSX.TargetedEvent<HTMLInputElement>): void {
			onValueChange(!value, name)
			onChange(event)
		},
		[name, onChange, onValueChange, value]
	)

	const handleKeyDown = useCallback(
		function (event: JSX.TargetedKeyboardEvent<HTMLInputElement>): void {
			if (event.key !== 'Escape') {
				return
			}
			if (propagateEscapeKeyDown === false) {
				event.stopPropagation()
			}
			event.currentTarget.blur()
		},
		[propagateEscapeKeyDown]
	)

	return (
		<label
			class={createClassName([
				styles.iconButton,
				disabled === true ? styles.disabled : null
			])}>
			<input
				{...rest}
				checked={value === true}
				class={styles.input}
				disabled={disabled === true}
				name={name}
				onChange={handleChange}
				onKeyDown={disabled === true ? undefined : handleKeyDown}
				tabIndex={disabled === true ? -1 : 0}
				type="checkbox"
			/>
			<div class={styles.fill}>
				<div class={styles.icon}>{children}</div>
			</div>
		</label>
	)
}

const IconIntensity16 = ({ v = 0 }) => {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg">
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M8 6.5C7.17157 6.5 6.5 7.17157 6.5 8C6.5 8.82843 7.17157 9.5 8 9.5C8.82843 9.5 9.5 8.82843 9.5 8C9.5 7.17157 8.82843 6.5 8 6.5ZM5.5 8C5.5 6.61929 6.61929 5.5 8 5.5C9.38071 5.5 10.5 6.61929 10.5 8C10.5 9.38071 9.38071 10.5 8 10.5C6.61929 10.5 5.5 9.38071 5.5 8Z"
				fill="currentColor"
			/>
			<path d={`M5 5L${3 + v} ${3 + v}`} stroke="currentColor" />
			<path d={`M${1 + v} 8H4`} stroke="currentColor" />
			<path d={`M${3 + v} ${13 - v}L5 11`} stroke="currentColor" />
			<path d={`M8 ${15.5 - v}L8 12`} stroke="currentColor" />
			<path d={`M${13 - v} ${13 - v}L10.5 11`} stroke="currentColor" />
			<path d={`M12 8H${15 - v}`} stroke="currentColor" />
			<path d={`M10.5 5L${13 - v} ${3 + v}`} stroke="currentColor" />
			<path d={`M8 4L8 ${v + 1}`} stroke="currentColor" />
		</svg>
	)
}
