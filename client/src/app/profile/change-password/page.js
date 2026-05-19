'use client'
import { useState } from "react";
import Sidebar from "../page";
import { useDispatch, useSelector } from "react-redux";
import Button from "@/components/common/Button";
import { Eye, EyeOff } from "lucide-react";
import { removeConfirmSweetAlert, setAlertLoader, setConfirmSweetAlert, setSweetAlert } from "../../../../store/slices/sweetAlertSlice";
import ConfirmSweetAlertsWrapper from "@/components/modals/ConfirmSweetAlertsWrapper";
import { changeOldPassword } from "@/action/auth.action";
import { withPrivateRoute } from "@/components/layout/PrivateRoute";
import BackLayout from "../BackLayout";

function ChangePassword() {
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')
    const [showOldPassword, setOldShowPassword] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmassword, setShowConfirmPassword] = useState(false)
    const [showAlert, setShowAlert] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const dispatch = useDispatch()
    const auth = useSelector((state) => state.auth)

    const handleChangePassword = (e) => {
        e.preventDefault()
        if (oldPassword.length === 0) {
            const payload = {
                description: 'Old password is required.'
            }
            return dispatch(setSweetAlert(payload))
        }
        if (newPassword.length === 0) {
            const payload = {
                description: 'New password is required.'
            }
            return dispatch(setSweetAlert(payload))
        }
        if (newPassword.length < 6 || newPassword.length > 36) {
            const payload = {
                description: 'Password must be at least 6 characters long max upto 36 characters.'
            }
            return dispatch(setSweetAlert(payload))
        }
        if (newPassword !== confirmNewPassword) {
            const payload = {
                description: 'New Password and Confirm New Password must be same.'
            }
            return dispatch(setSweetAlert(payload))
        }
        setShowAlert(true)
        dispatch(setConfirmSweetAlert({ description: 'Are you sure you want to change your password?' }))
    }

    const handleSubmitPassword = async () => {
        setIsLoading(true)
        dispatch(setAlertLoader(true))
        const data = {
            email: auth.user.email,
            old_password: oldPassword,
            new_password: newPassword,
            requestFrom: 'FF'
        }
        try {
            await changeOldPassword(auth.user.domain, data, dispatch)
            setIsLoading(false)
            resetForm()
        } catch (error) {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setOldPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
    }

    return (
        <div className='flex justify-center px-4 md:px-10 py-6'>
            <div className='w-full max-w-6xl'>
                <BackLayout />
                <div className='flex flex-col md:flex-row gap-6 items-start'>
                    <div className='w-full md:flex-1 hidden lg:block'>
                        <Sidebar />
                    </div>
                    <div className='w-full md:flex-[2] bg-white shadow-sm rounded-sm overflow-hidden'>
                        <div className='p-4 border-b font-medium'>
                            Change Password
                        </div>
                        <div className='flex flex-col items-center p-6 md:p-10 space-y-4'>
                            <div className='flex flex-col gap-5 w-full'>
                                <div className='flex flex-col gap-1'>
                                    <label className='text-sm'>
                                        Old Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showOldPassword ? 'text' : 'password'}
                                            value={oldPassword || ''}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            className='w-full bg-gray-50 border rounded-sm px-3 py-2'
                                        />
                                        <div className='absolute right-0 top-0 h-full flex items-center'>
                                            <button className="h-full px-3 border-l border-gray-300 flex items-center justify-center" onClick={() => setOldShowPassword(!showOldPassword)}>
                                                {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}

                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className='flex flex-col gap-1'>
                                    <label className='text-sm'>
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={`${showPassword ? 'text' : 'password'}`}
                                            value={newPassword || ''}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className='w-full bg-gray-50 border rounded-sm px-3 py-2 pr-10'
                                        />
                                        <div className='absolute right-0 top-0 h-full flex items-center'>
                                            <button
                                                className="h-full px-3 border-l border-gray-300 flex items-center justify-center"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className='flex flex-col gap-1'>
                                    <label className='text-sm'>
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={`${showConfirmassword ? 'text' : 'password'}`}
                                            value={confirmNewPassword || ''}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            className='w-full bg-gray-50 border rounded-sm px-3 py-2'
                                        />
                                        <div className='absolute right-0 top-0 h-full flex items-center'>
                                            <button
                                                type='button'
                                                onClick={() => setShowConfirmPassword(!showConfirmassword)}
                                                className='h-full px-3 border-l border-gray-300 flex items-center justify-center'
                                            >
                                                {showConfirmassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>

                                    </div>
                                </div>
                                <Button
                                    type='submit'
                                    loading={isLoading}
                                    onClick={handleChangePassword}
                                    classes={`bg-[#ff1a9d] w-full md:w-[200px] text-white py-3 rounded-md font-semibold text-sm mt-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Change Password
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showAlert &&
                <ConfirmSweetAlertsWrapper onConfirm={() => { handleSubmitPassword() }} onCancel={() => setAlertLoader(false)} />
            }
        </div>
    )
}

export default withPrivateRoute(ChangePassword, ['user'])
