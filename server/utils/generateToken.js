import { v4 as uuidv4 } from 'uuid'

export const generateToken = () => {
    // list containing characters for the random string
    const randomString = uuidv4()

    return randomString
}
