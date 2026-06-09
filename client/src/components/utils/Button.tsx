import React from 'react'
import PropTypes from 'prop-types'

interface IBadgeProps {
    title: string,
    classes: string,
    loading: boolean,
    type: 'button' | 'submit' | 'reset',
    // TODO : assign type
    onClick: any,
    disabled: boolean,
    icon: any
}

function Button(props: IBadgeProps) {
    const { title, classes, loading, onClick, disabled, icon } = props
    let { type } = props
    if (!type) type = 'button'

    const buttonClass = `btn ${classes}`
    return <button
        type={type}
        className={buttonClass}
        disabled={disabled || false}
        onClick={onClick}
    >
        {loading === true && <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
        {loading === false && icon}{title}
    </button>
}

Button.propTypes = {
    title: PropTypes.string.isRequired,
    classes: PropTypes.string.isRequired,
    loading: PropTypes.bool.isRequired,
    type: PropTypes.any.isRequired,
    onClick: PropTypes.func,
    icon: PropTypes.any
}

export default Button
