const Website = require('./../models/Website')

/**
 * @description assign auto increment id for all websites
 */
async function assignWebsiteId() {
    console.log('Command execution started')
    const allWebsite = await Website.find({})
    let website_id = 1
    for (const website of allWebsite) {
        await Website.updateOne({ website_url: website.website_url }, { $set: { website_id: website_id } })
        website_id++
    }
    console.log('Command execution Completed')
}

module.exports = { assignWebsiteId }
