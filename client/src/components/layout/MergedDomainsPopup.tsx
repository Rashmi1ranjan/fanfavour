import React from 'react'
import { observer } from 'mobx-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import moment from 'moment'

interface UserDetailsProps {
    email: string
    name: string
    createdAt: string
    universal_login_merged_domains: Array<string>
}

interface Props {
    userDetails: UserDetailsProps
    setShowViewPopup: (key: boolean) => void
}

const MergedDomainsPopup: React.FC<Props> = (props) => {
    const { userDetails, setShowViewPopup } = props
    const { email, name, createdAt, universal_login_merged_domains } = userDetails

    return <div className='modal fade show' role='dialog' style={{ display: 'block', backgroundColor: '#00000080' }}>
        <div className='modal-dialog modal-dialog-centered modal-dialog-scrollable modal-md'>
            <div className='modal-content'>
                <div className='modal-header' style={{ justifyContent: 'space-between' }}>
                    <h6 className='modal-title'>Merged Domains</h6>
                    <div className='p-1' style={{ cursor: 'pointer' }} onClick={() => setShowViewPopup(false)}>
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
                            <span>{moment(createdAt).format('MM/DD/YYYY HH:mm:ss')} ({moment(createdAt).fromNow()})</span>
                        </div>
                    </div>
                    {universal_login_merged_domains.map((domain, i) => {
                        return (<>
                            <a
                                key={i}
                                href={`https://${domain}`}
                                target='_blank'
                                rel='noreferrer'
                            >
                                {domain}
                            </a>
                            <br />
                        </>)
                    })}
                </div>
            </div>
        </div>
    </div>
}

export default observer(MergedDomainsPopup)
