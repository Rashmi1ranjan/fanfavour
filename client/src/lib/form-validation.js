import { emailRegex } from "./constant"


export const validateField = (name, value, formData) => {
    const error = {}
    switch (name) {
        case 'email':
            if (!value.trim()) error[name] = 'Email is required.'
            else if (!emailRegex.test(value))
                error[name] = 'Enter a valid email address.'
            break
        case 'password':
            if (!value.trim()) {
                error.password = 'Password is required.'
            } else if (
                formData.confirm_password &&
                value !== formData.confirm_password
            ) {
                error.confirm_password = 'Passwords do not match.'
            }
            break
        case 'name':
            if (!value.trim()) {
                error[name] = 'Name is required.'
            }
            break
        case 'phone_number':
            if (!value.trim()) {
                error[name] = 'Phone Number is required.'
            }
            break
        case 'confirm_password':
            if (!value.trim()) {
                error.confirm_password = 'Confirm password is required.'
            } else if (
                formData.password &&
                value !== formData.password
            ) {
                error.confirm_password = 'Passwords do not match.'
            }
            break
        case 'terms':
            if (!value) {
                error[name] = 'Please accept the terms and conditions.'
            }
            break
    }
    return error
}

export const validateAllFields = (formData) => {
    const allErrors = {}

    for (const [name, value] of Object.entries(formData)) {
        Object.assign(allErrors, validateField(name, value, formData))
    }

    return allErrors
}