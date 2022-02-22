/**
 * @file Modified useEffect hook that is skipping the first render.
 * @author https://usehooks-ts.com/react-hook/use-update-effect
 */

import { useEffect, useRef } from 'preact/hooks'

function useIsFirstRender(): boolean {
	const isFirst = useRef(true)

	if (isFirst.current) {
		isFirst.current = false

		return true
	}

	return isFirst.current
}

function useUpdateEffect(effect: any, deps?: any) {
	const isFirst = useIsFirstRender()

	useEffect(() => {
		if (!isFirst) {
			return effect()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps)
}

export default useUpdateEffect
