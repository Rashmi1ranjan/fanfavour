import express from 'express'
const router = express.Router()
import {
    getCountryList,
    getCountryBasedOnIp,
    getStateOfCountry,
    getCityOfState
} from './../controller/subscription.controller.js'

// auth user route
router.get('/get_all_country_list', getCountryList)
router.get('/get-country-from-ip', getCountryBasedOnIp)
router.post('/get_states_of_country', getStateOfCountry)
router.post('/get_cities_of_state', getCityOfState)


export default router