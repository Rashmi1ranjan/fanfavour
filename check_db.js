const mongoose = require('mongoose');
require('dotenv').config();

const Website = require('./models/Website');
const FanFavourModel = require('./models/FanFavourModel');

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fanfavour');
  console.log('Connected to DB');

  const websites = await Website.find({}, 'website_url model_name status payment_gateway').lean();
  console.log('\n--- WEBSITES IN DB ---');
  console.table(websites);

  const ffModels = await FanFavourModel.find({}, 'website_url model_name display_order likes is_featured_model').lean();
  console.log('\n--- FAN FAVOUR MODELS IN DB ---');
  console.table(ffModels);

  await mongoose.disconnect();
}

check().catch(console.error);
