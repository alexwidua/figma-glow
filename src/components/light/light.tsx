import { h } from 'preact'
import { useState, useMemo } from 'preact/hooks'
import chroma from 'chroma-js'
import useUpdateEffect from '../../hooks/useUpdateEffect'
import { useSoundEffect } from './private/useSoundEffect'
import { useSpring, animated, config } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { createClassName } from '@create-figma-plugin/ui'
import { normalize, denormalize, clamp } from '../../utils/math'
import { brightenColor } from '../../utils/color'
import { getGlowLayers } from '../../utils/glow'
import { PLUGIN_HEIGHT, INTENSITY_FACTOR } from '../../constants'
import styles from './light.css'

interface LightProps {
	glowColor: string
	intensity: number
	matchFillColor: boolean
	onIntensityChange: (intensity: number) => void
	onMatchFillColorChange: () => void
}

const INTENSITY_SCRUB_RANGE = 50

export function intensityToPercentage(value: number) {
	return Math.round(normalize(value, 0, INTENSITY_FACTOR) * 100)
}

export function percentageToRawIntensityValue(value: number) {
	return denormalize(value, 0, INTENSITY_FACTOR) / 100
}

export function Light({
	glowColor,
	intensity,
	matchFillColor,
	onIntensityChange,
	onMatchFillColorChange
}: LightProps) {
	const [pluggedIn, setPluggedIn] = useState(true)
	const [plugPosition, setPlugPosition] = useState({ x: 0, y: 0 })
	const [dragPointerDown, setDragPointerDown] = useState(false)
	const brightenedColor = brightenColor(glowColor)

	/**
	 * Play sound effect on plug/unplug
	 */
	const { plugSound, unplugSound } = useMemo(
		() => useSoundEffect({ volume: 0.085 }),
		[]
	)
	useUpdateEffect(() => {
		if (pluggedIn && !dragPointerDown) {
			plugSound.play()
		} else {
			unplugSound.play()
		}
	}, [pluggedIn])

	/**
	 * Handle intensity scrub
	 */

	const [isScrubbing, setIsScrubbing] = useState(false)
	const scrub: any = useDrag(
		({ down, offset: [_, oy] }) => {
			const value =
				normalize(-oy, -INTENSITY_SCRUB_RANGE, INTENSITY_SCRUB_RANGE) *
				INTENSITY_FACTOR
			onIntensityChange(value)
			setIsScrubbing(down)
		},
		{
			bounds: { top: -50, bottom: 50 }
		}
	)

	/**
	 * Handle plug drag
	 */
	const handlePlugPositionChange = () => {
		const pos = { x: x.get(), y: y.get() }
		setPlugPosition(pos)
		const treshold = 8
		const isPluggedIn = dragPointerDown
			? false
			: Math.abs(pos.x) <= treshold && Math.abs(pos.y) <= treshold
		setPluggedIn(isPluggedIn)
	}

	const [{ x, y }, animate] = useSpring(() => ({
		x: 0,
		y: 0,
		onChange: handlePlugPositionChange,
		config: config.stiff
	}))
	const drag: any = useDrag(({ down, movement: [mx, my] }) => {
		animate.start({ x: down ? mx : 0, y: down ? my : 0, immediate: down })
		setDragPointerDown(down)
	})

	const tiltPlugRelativeToPosition = clamp(
		plugPosition.x * normalize(-plugPosition.y, PLUGIN_HEIGHT, 100),
		-73,
		73
	)

	/**
	 * Styles
	 */
	const cablePath = `M0.5 1C0.5 
	${0.87 + 0.85 * normalize(plugPosition.y, 0, PLUGIN_HEIGHT)}
	${0.5 + normalize(plugPosition.x, 0, PLUGIN_HEIGHT)}
	${0.8 + normalize(plugPosition.y, 0, PLUGIN_HEIGHT)}
	${0.5 + normalize(plugPosition.x, 0, PLUGIN_HEIGHT)} 
	${0.8 + normalize(plugPosition.y, 0, PLUGIN_HEIGHT)}`

	const plugStyle = {
		transform: `translate3d(-50%,60px,0) rotate(${tiltPlugRelativeToPosition}deg)`,
		x,
		y
	}

	const lightBulbFillStyle = {
		background: matchFillColor ? `${brightenedColor}` : `#${glowColor}`,
		opacity: pluggedIn ? normalize(intensity, 0, INTENSITY_FACTOR) : 0,
		boxShadow: pluggedIn
			? getGlowLayers({
					glowColor,
					matchFillColor,
					intensity
			  })
					.map(
						(glow) =>
							`${glow.offset.x}px ${glow.offset.y}px ${
								glow.radius
							}px rgba(${chroma
								.gl(
									glow.color.r,
									glow.color.g,
									glow.color.b,
									glow.color.a
								)
								.rgba()})`
					)
					.toString()
			: 'none'
	}

	const innerGlowStyle = {
		background: matchFillColor ? `${brightenedColor}` : `#${glowColor}`
	}

	return (
		<div className={styles.wrapper}>
			<svg
				viewBox="0 0 1 1"
				xmlns="http://www.w3.org/2000/svg"
				style={{ width: '100%', height: '100%' }}>
				<animated.path
					className={styles.cable}
					vectorEffect="non-scaling-stroke"
					d={cablePath}
				/>
				<animated.path
					className={styles.cableHighlight}
					vectorEffect="non-scaling-stroke"
					d={cablePath}
					transform="translate(-0.005,0)"
				/>
			</svg>
			<animated.div
				className={createClassName([
					styles.plugBbox,
					dragPointerDown ? styles.pointerDown : null
				])}
				style={plugStyle}
				{...drag()}>
				<span
					className={createClassName([styles.connector, styles.left])}
				/>
				<span
					className={createClassName([
						styles.connector,
						styles.right
					])}
				/>
				<div className={styles.plug} />
			</animated.div>
			<div className={styles.lightBulb}>
				<Filament pluggedIn={pluggedIn} />
			</div>
			<div
				className={createClassName([
					styles.innerGlow,
					pluggedIn && !dragPointerDown ? styles.plugged : null
				])}
				style={innerGlowStyle}
			/>
			<animated.div
				className={createClassName([
					styles.fill,
					pluggedIn && !dragPointerDown ? styles.plugged : null
				])}
				style={lightBulbFillStyle}
				onDoubleClickCapture={onMatchFillColorChange}
				{...scrub()}
			/>
			<div
				className={styles.badge}
				style={{ opacity: isScrubbing ? 1 : 0 }}>
				Intensity: {intensityToPercentage(intensity)}%
			</div>
		</div>
	)
}

function Filament({ pluggedIn }: { pluggedIn: boolean }) {
	return (
		<svg
			className={styles.filament}
			width="38"
			height="76"
			viewBox="0 0 38 76"
			xmlns="http://www.w3.org/2000/svg">
			<path
				className={createClassName([
					styles.filamentStroke,
					pluggedIn ? styles.plugged : null
				])}
				d="M20.7164 75.5V42.2803C20.7164 40.9313 19.6228 39.8377 18.2738 39.8377H9.4817C4.89502 39.8377 1.17678 43.5559 1.17678 48.1426C1.17678 52.7293 4.89502 56.4475 9.4817 56.4475C14.0175 56.4475 17.704 52.8114 17.7852 48.295V23.2279C17.7852 21.8788 16.6916 20.7852 15.3426 20.7852H9.4817C5.08498 20.7852 1.17678 23.7164 1.17678 29.0902C1.17678 34.4639 5.32924 37.3951 9.4817 37.3951H28.1451C28.712 37.3951 29.2617 37.2005 29.7024 36.8437L33.991 33.372C36.9434 30.982 37.4763 26.6848 35.1972 23.646L35.0755 23.4838C32.3756 19.8839 26.9776 19.8262 24.1501 23.3268V23.3268C21.6534 26.418 22.2916 31.0128 25.566 33.2639L26.7076 34.0488C27.1009 34.3192 27.567 34.4639 28.0443 34.4639V34.4639H22.182C21.3726 34.4639 20.7164 33.8078 20.7164 32.9984V1H9.6717C7.51599 1 5.44857 1.85635 3.92425 3.38067L3.82372 3.48119C0.636305 6.66861 0.714949 11.8602 3.99745 14.9496V14.9496C5.47961 16.3446 7.43827 17.1213 9.47365 17.1213H28.6067C31.1672 17.1213 33.5712 15.8887 35.0657 13.8094V13.8094C37.0109 11.103 37.0626 7.47081 35.1951 4.71016L35.1133 4.58937C33.595 2.34478 31.0617 1 28.3517 1L25 1"
			/>
		</svg>
	)
}
