'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FullScreenLoader from "../components/common/FullScreenLoader"
import { useDispatch, useSelector } from "react-redux"
import { configureApiInterceptors } from '../action/configure-api'

export default function ClientRoot({ children }) {
    const dispatch = useDispatch()
    const router = useRouter()

    useEffect(() => {
        configureApiInterceptors(dispatch, router)
    }, [])

    const isLoading = useSelector(state => state.models.mainScreenLoader)
    if (isLoading) {
        return <FullScreenLoader bgColor='bg-[#fff]' />
    }

    return children
}
