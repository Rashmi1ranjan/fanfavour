'use client'

const PULSE_KEYFRAME_NAME = 'ff-pulse-loader'

const cssValue = (value) => (typeof value === 'number' ? `${value}px` : value)

export default function Loader(props) {
    const {
        isLoading = false,
        color = '#fff',
        speedMultiplier = 1,
        size = 10,
        margin = 2,
        style,
        classes,
        ...additionalProps
    } = props

    if (!isLoading) {
        return null
    }

    const wrapperStyle = {
        display: 'inline-block',
        verticalAlign: 'middle',
        marginRight: '10px',
        marginLeft: '10px',
        ...style
    }

    const dotStyle = (i) => ({
        backgroundColor: color,
        width: cssValue(size),
        height: cssValue(size),
        margin: cssValue(margin),
        borderRadius: '100%',
        display: 'inline-block',
        animation: `${PULSE_KEYFRAME_NAME} ${0.75 / speedMultiplier}s ${((i - 1) * 0.12) / speedMultiplier}s infinite cubic-bezier(0.2, 0.68, 0.18, 1.08)`,
        animationFillMode: 'both'
    })

    return (
        <span style={wrapperStyle} className={classes} {...additionalProps}>
            <span style={dotStyle(1)} />
            <span style={dotStyle(2)} />
            <span style={dotStyle(3)} />
        </span>
    )
}
