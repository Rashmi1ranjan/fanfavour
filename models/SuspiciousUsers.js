const mongoose =  require('mongoose')
const Schema = mongoose.Schema

const SuspiciousUsersSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        index:true
    },
    count: {
        type: Number
    },
    tip_amount:{
        type: Number
    },
    website_url:{
        type: String
    },
    type:{
        type: String,
        enum:['tip', 'card']
    },
    notes:{
        type: Array
    },
    name:{
        type: String
    },
    email:{
        type: String
    },
    createdAt:{
        type: Date
    },
    updatedAt:{
        type: Date
    },
    model_message_count: {
        type: Number,
        default: 0
    },
    user_message_count: {
        type: Number,
        default: 0
    },
    total_user_message_count: {
        type: Number,
        default: 0
    },
    total_model_message_count: {
        type: Number,
        default: 0
    },
    fraudDetectionDate:{
        type:Date
    }
}, { timestamps: true })

module.exports = mongoose.model('SuspiciousUsers', SuspiciousUsersSchema)
