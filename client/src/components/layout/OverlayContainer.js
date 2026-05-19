'use client'
import styled from 'styled-components'

const size = {
    mobileS: '320px',
    mobileM: '375px',
    mobileL: '425px',
    tablet: '767px',
    laptop: '1024px',
    laptopL: '1440px',
    desktop: '1850px',
    desktopL: '2560px'
}

export const OverlayContainer = styled.div`
    margin: auto;
    position: relative;
    display: block;
    width: fit-content;
    padding: 0px;
    height: auto;

    &::after {
        content: '${props => props.auth.appSettings.enable_watermark === true ? props.auth.user._id : ''}';
        font-size: ${props => props.auth.appSettings.watermark_size}rem;
        color: ${props => props.auth.appSettings.watermark_color};
        position: absolute;
        margin-bottom: 2rem;
        
        ${props => props.auth.appSettings.watermark_position === 'top-left' ? 'top: 0; left: 2px;' :
        props.auth.appSettings.watermark_position === 'top-right' ? 'top: 0; right: 2px;' :
            props.auth.appSettings.watermark_position === 'bottom-left' ? 'bottom: 0; left: 2px;' :
                props.auth.appSettings.watermark_position === 'bottom-right' ? 'bottom: 0; right: 2px;' :
                    'top: 0;'
    }
    }

    @media (min-width: ${size.mobileS}) and (max-width: ${size.tablet}) {
        &::after{
            font-size: 1em;
        }
    }
`
