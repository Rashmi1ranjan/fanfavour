import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

const StyledSpan = styled.span`
    /*Disables default tooltip on safari*/
    &::after {
        content: '';
        display: block;
    }
`

export default function LastMessage({ lastMessage }) {
    return <StyledSpan className='truncate block'>{lastMessage}</StyledSpan>
}
