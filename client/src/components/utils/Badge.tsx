import React from 'react'
import PropTypes from 'prop-types'

interface IBadgeProps {
    title: string,
    bgColorClass: string
}

function Badge(props: IBadgeProps) {
    const { title, bgColorClass } = props
    const badgeClass = `badge ${bgColorClass}`
    return (<span className={badgeClass}>{title}</span>)
}

Badge.propTypes = {
    title: PropTypes.string.isRequired,
    bgColorClass: PropTypes.string.isRequired
}

export default Badge
