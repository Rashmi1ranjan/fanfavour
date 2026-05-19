import Joi from 'joi'

export const LoginSchema = Joi.object({
    country_code: Joi.string().allow(''),
    email: Joi.string().trim().required().messages({
        'any.required': 'Email Id is required',
        'string.empty': 'Email Id is required'
    }),
    sourceDomain: Joi.string().trim().required().messages({
        'any.required': 'Domain is required',
        'string.empty': 'Domain is required'
    }),
    password: Joi.string().trim().required().messages({
        'any.required': 'Password is required',
        'string.empty': 'Password is required'
    }),
    action: Joi.string().trim().allow('')
}).required()

export const RegisterSchema = Joi.object({
    country_code: Joi.string().allow(''),
    name: Joi.string().trim().required().messages({
        'any.required': 'Name is required',
        'string.empty': 'Name is required'
    }),
    email: Joi.string().trim().required().messages({
        'any.required': 'Email Id is required',
        'string.empty': 'Email Id is required'
    }),
    // phone_number: Joi.string().trim().required().messages({
    //     'any.required': 'Phone number is required',
    //     'string.empty': 'Phone number is required'
    // }),
    password: Joi.string().trim().required().messages({
        'any.required': 'Password is required',
        'string.empty': 'Password is required'
    }),
    sourceDomain: Joi.string().trim().required().messages({
        'any.required': 'Domain is required',
        'string.empty': 'Domain is required'
    }),
    confirm_password: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Passwords do not match'
        }),
    action: Joi.string().trim().allow(''),
    utm_params: Joi.object().allow(null),
    isFFUser: Joi.boolean().allow(''),
    country_code: Joi.string().allow(''),
    full_phone: Joi.string().allow(''),
    terms: Joi.boolean().allow(true)
})

export const universalUserDetailsSchema = Joi.object({
    default_payment_method: Joi.string().valid('credit_card', 'crypto_currency').required(),
    card_id: Joi.string(),
    wallet_amount: Joi.number(),
    last_used_crypto_currency: Joi.string()
}).unknown()