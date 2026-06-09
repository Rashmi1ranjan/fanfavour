const WebsiteReferralHistory = require('./../models/WebsiteReferralHistory')
const WebsiteReferral = require('./../models/WebsiteReferral')
const mongoose = require('mongoose')
const _ = require('lodash')

/**
 * website referral migration in referral master
 */
async function websiteReferralMigrationInMaster() {
    const referrals = []
    const newDate = new Date()
    await allWebsiteReferralHistoryLoop(async (referral) => {
        if (referral.referral_type === 'normal' && referral.referral_name !== '') {
            let findRecord = _.findIndex(referrals, function (n) {
                return (n.name === referral.referral_name) ? n : false
            })
            if (findRecord === -1) {
                referrals.push({
                    name: referral.referral_name,
                    created_at: newDate
                })
            }
        }
        if (referral.referral_type1 === 'normal' && referral.referral_name1 !== '') {
            let findRecord = _.findIndex(referrals, function (n) {
                return (n.name === referral.referral_name1) ? n : false
            })
            if (findRecord === -1) {
                referrals.push({
                    name: referral.referral_name1,
                    created_at: newDate
                })
            }
        }
        if (referral.referral_type2 === 'normal' && referral.referral_name2 !== '') {
            let findRecord = _.findIndex(referrals, function (n) {
                return (n.name === referral.referral_name2) ? n : false
            })
            if (findRecord === -1) {
                referrals.push({
                    name: referral.referral_name2,
                    created_at: newDate
                })
            }
        }
    })
    await WebsiteReferral.deleteMany()
    await WebsiteReferral.insertMany(referrals)
}

/**
 * website referral history loop
 *
 * @param {object} callback callback
 * @returns {object} referral object
 */
async function allWebsiteReferralHistoryLoop(callback) {
    let totalReferrals = 0
    try {
        totalReferrals = await WebsiteReferralHistory.find({}).countDocuments()
    } catch (error) {
        console.log(error)
        return
    }

    if (totalReferrals > 0) {
        let limit = 50
        let totalPages = Math.ceil(totalReferrals / limit)
        for (let index = 0; index < totalPages; index++) {
            let offset = index * limit
            let referrals = []
            try {
                referrals = await WebsiteReferralHistory.find({}).skip(offset).limit(limit)
            } catch (error) {
                console.log(error)
                return
            }
            for (let i = 0; i < referrals.length; i++) {
                await callback(referrals[i])
            }
        }
    }
}

/**
 * add referral id into website referral history
 */
async function addReferralIdIntoWebsiteReferralHistory() {
    const referrals = await WebsiteReferral.find()
    await allWebsiteReferralHistoryLoop(async (referral) => {
        if (referral.referral_type === 'normal' && referral.referral_name !== '') {
            let findRecord = _.findIndex(referrals, function (n) {
                return (n.name === referral.referral_name) ? n : false
            })
            if (findRecord !== -1) {
                referral.referral_id = new mongoose.Types.ObjectId(referrals[findRecord]._id)
                await referral.save()
            }
        }
        if (referral.referral_type1 === 'normal' && referral.referral_name1 !== '') {
            let findRecord = _.findIndex(referrals, function (n) {
                return (n.name === referral.referral_name1) ? n : false
            })
            if (findRecord !== -1) {
                referral.referral_id1 = new mongoose.Types.ObjectId(referrals[findRecord]._id)
                await referral.save()
            }
        }
        if (referral.referral_type2 === 'normal' && referral.referral_name2 !== '') {
            let findRecord = _.findIndex(referrals, function (n) {
                return (n.name === referral.referral_name2) ? n : false
            })
            if (findRecord !== -1) {
                referral.referral_id2 = new mongoose.Types.ObjectId(referrals[findRecord]._id)
                await referral.save()
            }
        }
    })
}
module.exports = { websiteReferralMigrationInMaster, addReferralIdIntoWebsiteReferralHistory }
