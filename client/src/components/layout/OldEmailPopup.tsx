import React from 'react'
import { observer } from 'mobx-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import moment from 'moment'
import styled from 'styled-components'

interface oldEmailDetailsProps {
    email: string
    name: string
    createdAt: string
    old_email: { email: string, created_at: string }[]
}

interface Props {
    oldEmailDetails: oldEmailDetailsProps
    setShowOldEmailPopup: (key: boolean) => void
}

const EmailDiv = styled.div<{ bottomBorder: boolean }>`
    border-bottom: ${props => props.bottomBorder ? '1px solid #d3d3d3' : ''};
`

const OldEmailPopup: React.FC<Props> = (props) => {
    const { oldEmailDetails, setShowOldEmailPopup } = props
    const { email, name, createdAt, old_email } = oldEmailDetails
    // sort by created date to show latest record top of the list
    old_email.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return <div className='modal fade show' role='dialog' style={{ display: 'block', backgroundColor: '#00000080' }}>
        <div className='modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg'>
            <div className='modal-content'>
                <div className='modal-header' style={{ justifyContent: 'space-between' }}>
                    <h6 className='modal-title'>Old Email</h6>
                    <div className='p-1' style={{ cursor: 'pointer' }} onClick={() => setShowOldEmailPopup(false)}>
                        <FontAwesomeIcon icon={faXmark} />
                    </div>
                </div>
                <div className='modal-body container'>
                    <div className='row text-muted mb-3 px-1'>
                        <div className='col-auto' >
                            <b>Email :</b><br />
                            <b>Name :</b><br />
                            <b>Date :</b><br />
                        </div>
                        <div className='col-auto' >
                            <span>{email}</span><br />
                            <span>{name}</span><br />
                            <span>{moment(createdAt).format('MM/DD/YYYY HH:mm:ss A')} ({moment(createdAt).fromNow()})</span>
                        </div>
                    </div>
                    <div className='p-2'>
                        {old_email.map((item, i) => {
                            return (
                                <EmailDiv key={i} bottomBorder={i < old_email.length - 1} className='row py-1'>
                                    <div className='col-md-6'>{item.email}</div>
                                    <div className='col-md-6'>{moment(item.created_at).format('MM/DD/YYYY HH:mm:ss A')} ({moment(item.created_at).fromNow()})</div>
                                </EmailDiv>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    </div>
}

export default observer(OldEmailPopup)
