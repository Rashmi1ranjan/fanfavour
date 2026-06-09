const express = require('express')
const router = express.Router()
const CountryList = require('./../models/CountryList')
const StateList = require('./../models/StateList')
const CityList = require('./../models/CityList')

router.post('/get_all_countries', async (req, res) => {
    let allCountries
    let currentPage = parseInt(req.body.page_num, 10)
    const totalRows = await CountryList.countDocuments()
    let limit = 20
    let totalPages = Math.ceil(totalRows / limit)
    let offset = (currentPage - 1) * limit
    if (totalRows > 0) {
        allCountries = await CountryList.find().sort({ name: 'asc' }).skip(offset).limit(limit)
    }
    return res.send({
        countries: allCountries,
        totalPages,
        currentPage,
        totalRows,
        limit
    })
})

router.post('/get_all_state', async (req, res) => {
    let iso2_code = req.body.inputCountry.trim().toUpperCase()
    let allState = []
    let totalPages = 1
    let currentPage = parseInt(req.body.page_num, 10)
    let totalRows = 0
    let limit = 20
    let offset
    let filteredStates
    if (iso2_code === '') {
        totalRows = await StateList.countDocuments()
        limit = 20
        totalPages = Math.ceil(totalRows / limit)
        offset = (currentPage - 1) * limit
        if (totalRows > 0) {
            allState = await StateList.aggregate([
                {
                    $sort: {
                        'name': 1
                    }
                },
                {
                    $skip: offset
                },
                {
                    $limit: limit
                },
                {
                    $lookup: {
                        from: 'countrylists',
                        localField: 'country_id',
                        foreignField: '_id',
                        as: 'countryDetails'
                    }
                },
                {
                    $unwind: '$countryDetails'
                }
            ])
        }
    } else {
        let Country = await CountryList.findOne({ iso2: iso2_code })

        if (Country !== null) {
            totalRows = await StateList.countDocuments({ country_id: Country._id }).sort({ name: 'asc' })
            limit = 20
            totalPages = Math.ceil(totalRows / limit)
            offset = (currentPage - 1) * limit
            filteredStates = await StateList.find({ country_id: Country._id }).sort({ name: 'asc' })
                .skip(offset)
                .limit(limit)
            let countryDetails = { name: Country.name, iso2: Country.iso2 }
            allState = JSON.parse(JSON.stringify(filteredStates))
            allState = allState.map((ele) => {
                ele.countryDetails = countryDetails
                return ele
            })
        }
    }

    return res.send({
        allState,
        totalPages,
        currentPage,
        totalRows,
        limit
    })
})

router.post('/get_all_cities', async (req, res) => {
    let countryCode = req.body.inputCountryCode.trim().toUpperCase()
    let stateCode = req.body.inputStateCode.trim().toUpperCase()
    let allCity = []
    let totalPages = 1
    let currentPage = parseInt(req.body.page_num, 10)
    let totalRows = 0
    let limit = 20
    let offset

    if (countryCode === '' && stateCode === '') {
        totalRows = await CityList.countDocuments()
        limit = 20
        totalPages = Math.ceil(totalRows / limit)
        offset = (currentPage - 1) * limit
        if (totalRows > 0) {
            allCity = await CityList.aggregate([
                {
                    $sort: {
                        'name': 1
                    }
                },
                {
                    $skip: offset
                },
                {
                    $limit: limit
                },
                {
                    $lookup: {
                        from: 'countrylists',
                        localField: 'country_id',
                        foreignField: '_id',
                        as: 'country_list'
                    }
                },
                {
                    $unwind: '$country_list'
                },
                {
                    $lookup: {
                        from: 'statelists',
                        localField: 'state_id',
                        foreignField: '_id',
                        as: 'state_list'
                    }
                },
                {
                    $unwind: '$state_list'
                }
            ])
        }
    } else if (countryCode !== '' && stateCode === '') {
        let countries = await CountryList.findOne({ iso2: countryCode })
        if (countries !== null) {
            totalRows = await CityList.countDocuments({ country_id: countries._id })
            limit = 20
            totalPages = Math.ceil(totalRows / limit)
            offset = (currentPage - 1) * limit
            let filteredCities = await CityList.find({ country_id: countries._id }).sort({ name: 'asc' })
                .skip(offset)
                .limit(limit)
            let country_list = { name: countries.name, iso2: countries.iso2 }

            allCity = JSON.parse(JSON.stringify(filteredCities))
            for (let i = 0; i < allCity.length; i++) {
                let state_list = {}
                allCity[i].country_list = country_list
                let state_id = allCity[i].state_id
                let states = await StateList.findById(state_id)
                state_list.name = states.name
                state_list.state_code = states.state_code
                allCity[i].state_list = state_list
            }
        }
    } else if (countryCode === '' && stateCode !== '') {
        let States = await StateList.findOne({ state_code: stateCode })
        if (States !== null) {
            totalRows = await CityList.countDocuments({ state_id: States._id })
            limit = 20
            totalPages = Math.ceil(totalRows / limit)
            offset = (currentPage - 1) * limit
            let filteredCities = await CityList.find({ state_id: States._id }).sort({ name: 'asc' })
                .skip(offset)
                .limit(limit)
            let state_list = { name: States.name, state_code: States.state_code }
            allCity = JSON.parse(JSON.stringify(filteredCities))

            for (let i = 0; i < allCity.length; i++) {
                let country_list = {}
                allCity[i].state_list = state_list
                let country_id = allCity[i].country_id
                let country = await CountryList.findById(country_id)
                country_list.name = country.name
                country_list.iso2 = country.iso2
                allCity[i].country_list = country_list
            }
        }
    } else {
        let countries = await CountryList.findOne({ iso2: countryCode })
        if (countries !== null) {
            let States = await StateList.findOne({
                state_code: stateCode,
                country_id: countries._id
            })
            if (States !== null) {
                currentPage = parseInt(req.body.page_num, 10)
                if (States !== null && countries !== null) {
                    totalRows = await CityList.countDocuments({
                        country_id: countries._id,
                        state_id: States._id
                    })
                    limit = 20
                    totalPages = Math.ceil(totalRows / limit)
                    offset = (currentPage - 1) * limit

                    let countryID = countries._id
                    let stateID = States._id
                    let filteredCities = await CityList.find({
                        country_id: countryID,
                        state_id: stateID
                    }).sort({ name: 'asc' })
                        .skip(offset)
                        .limit(limit)
                    allCity = JSON.parse(JSON.stringify(filteredCities))

                    for (let i = 0; i < allCity.length; i++) {
                        let country_list = {}
                        let state_list = {}
                        let country_id = allCity[i].country_id
                        let country = await CountryList.findById(country_id)
                        country_list.name = country.name
                        country_list.iso2 = country.iso2
                        allCity[i].country_list = country_list
                        let state_id = allCity[i].state_id
                        let state = await StateList.findById(state_id)
                        state_list.name = state.name
                        state_list.state_code = state.state_code
                        allCity[i].state_list = state_list
                    }
                }
            }
        }
    }

    return res.send({
        allCity,
        totalPages,
        currentPage,
        totalRows,
        limit
    })
})

router.get('/get_all_countries', async (req, res) => {
    let allCountries = await CountryList.find({}).sort({ name: 'asc' })

    return res.send({ countries: allCountries })
})
router.get('/get_states_of_country', async (req, res) => {
    let countryId = req.query.country_id
    let statesOfCountry = await StateList.find({ country_id: countryId }).sort({
        name: 'asc'
    })

    return res.send({ states: statesOfCountry })
})

router.get('/get_cities_of_state', async (req, res) => {
    let countryId = req.query.country_id
    let stateId = req.query.state_id
    let citiesOfState = await CityList.find({
        country_id: countryId,
        state_id: stateId
    }).sort({ name: 'asc' })

    return res.send({ cities: citiesOfState })
})

router.get('/get_city_by_id', async (req, res) => {
    let cityId = req.query.city_id

    let city = await CityList.findOne({ _id: cityId })

    return res.send({ city: city })
})

module.exports = router
