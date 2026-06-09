/**
 * @description remove index from database
 * @param {object} model database model
 * @param {string} index index to remove
 */
const findAndDropIndex = async (model, index) => {
    const collectionIndex = await model.collection.getIndexes()
    if (collectionIndex[index] !== undefined) {
        try {
            const dropIndex = await model.collection.dropIndex(index)
            console.log('Index Dropped', index, dropIndex)
        } catch (error) {
            console.log('Error in index drop', index, error)
        }
    } else {
        console.log('index not found', index)
    }
}

/**
 * @description Remove unused index from database
 */
async function removeUnusedIndexFromDatabase() {
    const CCBillErrorLog = require('./../models/CCBillErrorLog')
    await findAndDropIndex(CCBillErrorLog, 'error_from_1')
}

module.exports = { removeUnusedIndexFromDatabase }
