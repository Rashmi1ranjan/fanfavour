require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('./models/User')

const keepUsers = {
  'darren@themccandlessgroup.com': process.env.DARREN_PW,
  'ddamiano42@gmail.com': process.env.DDAMIANO_PW,
  'steve@themccandlessgroup.com': process.env.STEVE_PW,
  'nick@nickmccandless.com': process.env.NICK_PW,
  'workwithmadhup@gmail.com': process.env.MADHUP_PW
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI)

  const emails = Object.keys(keepUsers)
  const found = await User.find({ email: { $in: emails } }, 'email').lean()
  const foundEmails = found.map(x => x.email.toLowerCase())
  const missing = emails.filter(x => !foundEmails.includes(x))

  if (missing.length) {
    throw new Error(`Missing required users: ${missing.join(', ')}`)
  }

  for (const [email, plainPassword] of Object.entries(keepUsers)) {
    if (!plainPassword) {
      throw new Error(`Missing password input for ${email}`)
    }

    const hashed = await hashPassword(plainPassword)

    await User.updateOne(
      { email },
      {
        $set: {
          password: hashed,
          role: 'SUPER_ADMIN',
          isAdmin: true,
          is_deleted: false,
          is_mfa_enabled: false,
          mfa_secret: ''
        }
      }
    )
  }

  await User.updateMany(
    { email: { $nin: emails } },
    { $set: { is_deleted: true } }
  )

  const finalUsers = await User.find(
    {},
    'email role isAdmin is_deleted is_mfa_enabled'
  ).sort({ email: 1 }).lean()

  console.table(finalUsers)
  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error(err.message)
  try { await mongoose.disconnect() } catch {}
  process.exit(1)
})
