const Joi = require('joi')

const LoginValidationSchema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
    mfa_code: Joi.number()
})

module.exports = LoginValidationSchema
