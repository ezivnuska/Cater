const environment = process.env.NODE_ENV || 'development'
const port = process.env.PORT || '3000'
const isDev = environment === 'development'

const siteURL = isDev ? `http://localhost:${port}` : 'http://ezivnuska.herokuapp.com'

const assetPath = 'assets'
const assetURL = `${siteURL}/${assetPath}`

const bucket = 'readyset'
const profileImagesURL = 'https://ezivnuska.s3-us-west-1.amazonaws.com'
const profileImagesPath = 'user-uploads/profile-images'

const AWS_ACCESS_KEY_ID = 'AKIAZJ75Z7N3SPL5BTUK'
const AWS_SECRET_ACCESS_KEY = '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'
const DB_CONNECTION_STRING = 'mongodb://ezivnuska:Z1vnuska@ds263590.mlab.com:63590/heroku_jfl8mkbd'
const JWT_SECRET = 'super.super.secret.shhhh'

const MAILER_EMAIL = 'ezivnuska@gmail.com'
const MAILER_PASSWORD = 'L1ndsay!'

module.exports = {
  isDev,
  bucket,
  siteURL,
  assetPath,
  assetURL,
  profileImagesPath,
  profileImagesURL,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  DB_CONNECTION_STRING,
  JWT_SECRET,
  MAILER_EMAIL,
  MAILER_PASSWORD,
}