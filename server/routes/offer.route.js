import express from 'express'
const router = express.Router()
import { getAllPromotionOffers } from './../controller/offer.controller.js'

router.post('/check-offer', getAllPromotionOffers)

export default router