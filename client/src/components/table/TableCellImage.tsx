import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import _ from 'lodash'
import { Cell } from '../../types/types'

const VideoThumbnail = styled.div`
    position: relative;
    display: inline-block;
    cursor: pointer;

    &:before {
        position:absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        -webkit-transform: translate(-50%, -50%);
        content: "\f01d";
        font-family: FontAwesome;
        font-size: 60px;
        color: #fff;
        opacity: .4;
        text-shadow: 0px 0px 30px rgba(0, 0, 0, 0.5);
    }
    &:hover:before {
        
    }
`

const TableCellImage: React.FC<Cell> = (props) => {
    const value = props.value || ''
    const data = props.data || {}
    const onTableAction = props.onTableAction || null

    const type = _.get(data, 'type', 'image')

    if (value === '') {
        return (<></>)
    }

    if (type === 'video') {
        return (
            <VideoThumbnail>
                <img src={value} width="150px" alt="" onClick={() => {
                    if (onTableAction != null) {
                        onTableAction('image', value, data)
                    }
                }} />
            </VideoThumbnail>
        )
    }
    return (<img src={value} width="150px" alt="" />)
}


TableCellImage.propTypes = {
    value: PropTypes.any.isRequired
}

export default TableCellImage
