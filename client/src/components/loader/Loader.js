import React from 'react'
import PropTypes from 'prop-types'

function Loader({isLoading = false, color = '#d3d3d3'}) {
    if (isLoading === false) {
        return (<></>)
    }

    return (
        <div className='text-center'>
            <div className="spinner-border" role="status" style={{ color }}>
                <span className="sr-only">Loading...</span>
            </div>
        </div>
    )
}

Loader.propTypes = {
    isLoading: PropTypes.bool,
    color: PropTypes.string
}

export default Loader
