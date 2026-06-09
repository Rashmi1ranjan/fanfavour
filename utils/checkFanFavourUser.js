const BlockedUsers = require('../models/BlockedUsers')
const Website = require('../models/Website')

const checkBlockUser = async (domain, email) => {
    const website = await Website.findOne({ website_url: domain }, 'website_id')
    if (website === null) {
        return false
    }
    const query = {
        email: email,
        domain_id: { $in: [0, website.website_id] }
    }

    let rows = await BlockedUsers.findOne(query, '_id')
    if (rows === null) {
        return false
    }
    await BlockedUsers.updateOne({ _id: rows._id }, {
        $inc: {
            times_blocked: 1
        }
    })
}

module.exports = { checkBlockUser }
