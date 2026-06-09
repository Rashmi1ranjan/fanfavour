import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import { useNavigate, NavLink, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

interface Props {
    rootStore: RootStore
}

const EditBlockCode: React.FC<Props> = ({ rootStore }) => {
    const { BlockCodeStore } = rootStore
    const { clearBlockCodeData, editBlockCode, setBlockCodeDetailById, setBlockCodeData, isLoading } = BlockCodeStore
    const history = useNavigate()
    const { id } = useParams<string>()
    const { register, handleSubmit, formState: { errors } } = useForm()

    useEffect(() => {
        clearBlockCodeData()
        setBlockCodeDetailById(id ? id : '')
    }, [])

    const onSubmit = (data: { block_code: string, message: string }) => {
        if (data.message.trim() === '') {
            toast.error('Message can not be empty.')
            return
        }
        editBlockCode.code = data.block_code
        editBlockCode.message = data.message.trim()
        setBlockCodeData((isError: boolean) => {
            if (!isError) {
                toast.success('Data updated successfully')
                setTimeout(redirect, 3000)
            } else {
                toast.error('Something went wrong.')
            }
        })
    }

    const redirect = () => {
        clearTimeout(3000)
        history('/block-code-list')
    }

    if (isLoading) {
        return <>Loading</>
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row border-bottom mb-3'>
            <div className='col-md-6'>
                <h4 className='card-title'>Edit Block Code</h4>
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </div>
            <div className='col-md-6'>
                <NavLink className="float-end" to="/block-code-list" >Back</NavLink>
            </div>
        </div>
        <div className='row'>
            <div className='col-md-12'>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className='form-group mb-3'>
                        <label className='mb-2'>Block Code</label>
                        <input
                            name='block_code'
                            type='number'
                            className='form-control'
                            placeholder='Block Code'
                            ref={register({
                                required: 'Please enter block code'
                            })}
                            defaultValue={editBlockCode.code}
                        />
                        {(errors.block_code) && <p className="text-danger">{errors.block_code.message}</p>}
                    </div>
                    <div className='form-group mb-4'>
                        <label className='mb-2'>Message</label>
                        <input
                            name='message'
                            type='text'
                            className='form-control'
                            placeholder='Message'
                            ref={register({
                                required: 'Please enter message'
                            })}
                            defaultValue={editBlockCode.message}
                        />
                        {(errors.message) && <p className="text-danger">{errors.message.message}</p>}
                    </div>
                    <button type='submit' disabled={isLoading} className="btn btn-primary me-2">Update</button>
                    <NavLink className="ms-2 btn btn-outline-primary" to="/block-code-list" style={{ textAlign: 'right' }} >Cancel</NavLink>
                </form>
            </div>
        </div>
    </Container>
}

export default observer(EditBlockCode)
