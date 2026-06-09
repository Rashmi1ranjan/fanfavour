const express = require("express")
const router = express.Router()
const geoip = require('geoip-lite')
const rp = require("request-promise")
const parseString = require('xml2js').parseString
const _ = require('lodash')

router.get("/", async (req, res) => {
    const ip = req.query.ip
    let geo = geoip.lookup(ip)
    let result = true

    if (geo === null) {
        try {
            let response = await rp.get({
                url: `http://api.geoiplookup.net/?query=${ip}`
            })

            parseString(response, async function (error, results) {
                if (error) {
                    result = false
                } else {
                    const parsedResponse = _.get(results, 'ip.results[0].result[0]', false)
                    if (parsedResponse !== false) {
                        const city = _.get(parsedResponse, 'city[0]', false)
                        const country = _.get(parsedResponse, 'countrycode[0]', false)

                        if (city !== false && country !== false) {
                            geo = {
                                city: city,
                                region: '',
                                country: country
                            }
                        } else {
                            result = false
                        }
                    } else {
                        result = false
                    }
                }
            })
        } catch (error) {
            const resData = {
                result: false
            }

            return res.send(resData)
        }
    }

    let resData = {
        geo: geo,
        result: result
    }

    return res.send(resData)
})

module.exports = router
