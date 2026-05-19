'use client'
import _ from 'lodash'
import React from 'react'

export default function Button(props) {
    const buttonType = _.get(props, 'type', 'button')
    return (
        <button
            className={`btn cursor-pointer ${props.classes || ''}`}
            type={buttonType}
            disabled={props.loading}
            onClick={props.onClick}>
            {props.children}
        </button>
    )
}
