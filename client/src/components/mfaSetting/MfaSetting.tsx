import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import { useForm } from 'react-hook-form'
import QRCode from 'qrcode.react'

interface Props {
    rootStore: RootStore
}

const MfaSetting: React.FC<Props> = ({ rootStore }) => {
    const { MfaSettingStore } = rootStore
    const { mfaSetting, mfaSecret, mfaQrCode, enableMfa, isLoading, mfaEnabled, disableMfa } = MfaSettingStore
    const { register, handleSubmit, formState: { errors } } = useForm()

    useEffect(() => {
        mfaSetting()
    }, [register])

    useEffect(() => {/* */}, [mfaEnabled])

    const onSubmit = (data: { token: string }) => {
        if (mfaEnabled === false) {
            enableMfa(data)
        } else {
            disableMfa(data)
        }
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row justify-content-center'>
            {
                isLoading === false ?
                    <>
                        <div className='col-md-6'>
                            <div className='card'>
                                <div className="card-header">{ mfaEnabled === true ? 'Disable MFA' : 'Enable MFA' }</div>
                                <div className="card-body">
                                    <form  onSubmit={handleSubmit(onSubmit)}>
                                        {
                                            mfaEnabled === false ?
                                                <>
                                                    <p className="card-text">Scan the QR code or enter the secret key in Google Authenticator.</p>
                                                    <div className='mfa_qr_code text-center'>
                                                        <QRCode value={mfaQrCode} />
                                                    </div>
                                                    <div className="mfa_secret mb-3">
                                                        <strong>Secret Key:</strong> <code>{mfaSecret}</code>
                                                    </div>
                                                    <div className="form-group">
                                                        <label htmlFor="token" className='mb-2'>Enter MFA Auth code</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            id="token"
                                                            placeholder="Enter MFA Auth Code"
                                                            name="token"
                                                            ref={register({
                                                                required: true
                                                            })}
                                                        />
                                                        {(errors.token && errors.token.type === 'required') && <p className="text-danger mb-0">Please enter MFA auth code</p>}
                                                    </div>
                                                </> : <>
                                                    <div className="form-group">
                                                        <label htmlFor="password" className='mb-2'>Enter Password</label>
                                                        <input
                                                            type="password"
                                                            className="form-control mb-3"
                                                            id="password"
                                                            placeholder="Enter Password"
                                                            name="password"
                                                            ref={register({
                                                                required: true
                                                            })}
                                                        />
                                                        {(errors.password && errors.password.type === 'required') && <p className="text-danger mb-0">Please enter Your password</p>}
                                                    </div>
                                                    <div className="form-group">
                                                        <label htmlFor="token" className='mb-2'>Enter MFA Auth code</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            id="token"
                                                            placeholder="Enter MFA Auth Code"
                                                            name="token"
                                                            ref={register({
                                                                required: true
                                                            })}
                                                        />
                                                        {(errors.token && errors.token.type === 'required') && <p className="text-danger">Please enter MFA auth code</p>}
                                                    </div>
                                                </>
                                        }
                                        <button type="submit" className='btn btn-primary btn-block w-100 mt-3'>
                                            { mfaEnabled === true ? 'Disable MFA' : 'Enable MFA' }
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </>
                    :
                    <></>
            }
        </div>
    </Container>
}

export default observer(MfaSetting)
