
import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import _ from 'lodash'
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'

interface Props {
    rootStore: RootStore
}

const ChangeFeaturedModelText: React.FC<Props> = ({ rootStore }) => {
    const [featuredModel, setFeaturedModel] = useState('')
    const history = useNavigate()
    const { ModelStore } = rootStore
    const {
        getFeaturedModelText,
        saveFeaturedModelText,
        featuredModelText,
        isTextLoading
    } = ModelStore

    useEffect(() => {
        getFeaturedModelText()
    }, [getFeaturedModelText])

    useEffect(() => {
        setFeaturedModel(featuredModelText)
    }, [featuredModelText])

    const handleChange = (e: any) => {
        setFeaturedModel(e.target.value)
    }

    const handleSubmit = (e: any) => {
        e.preventDefault()

        const data = {
            featured_model_text: featuredModel
        }

        saveFeaturedModelText(data, (success: boolean) => {
            if (success === true) {
                toast.success('Changed featured model text successfully')
                setTimeout(redirect, 3000)
            }
        })
    }

    const redirect = () => {
        clearTimeout(3000)
        history('/model-list')
    }

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <div className='row py-2'>
                <div className='col'>
                    <h4>Change Featured Model Text</h4>
                </div>
            </div>
            <div className='form-group col-6 mb-3'>
                <input
                    name='featured_model_text'
                    type='text'
                    className='form-control'
                    value={featuredModel}
                    onChange={(e) => handleChange(e)}
                    disabled={isTextLoading}
                />
            </div>
            <div className='col-6 my-3'>
                <button type='submit' className='btn btn-primary' disabled={isTextLoading} style={{ marginRight: '20px' }} onClick={handleSubmit}>
                    {(isTextLoading) && (
                        <span
                            className='spinner-border spinner-border-sm me-1'
                            role='status'
                            aria-hidden='true'
                        ></span>
                    )}
                    Save
                </button>
                <button type='button' className='btn btn-danger' disabled={isTextLoading} onClick={() => {
                    history('/model-list')
                }}>
                    Cancel
                </button>
            </div>
            <ToastContainer
                position='top-right'
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </Container >
    )
}

export default observer(ChangeFeaturedModelText)
