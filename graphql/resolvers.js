const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const generator = require('generate-password')
const axios = require('axios')
const webConfig = require('config')
const AuthenticationError = require('apollo-server').AuthenticationError

const createToken = (user, secret, expiresIn) => {
  const { username, email } = user
  return jwt.sign({
    username, email
  }, secret, { expiresIn })
}

const resolvers = {
  OrderStateEnum: {
    ORDER_ADDED: 0,
    EN_ROUTE_TO_MERCHANT: 1,
    ARRIVED_AT_MERCHANT: 2,
    EN_ROUTE_TO_CUSTOMER: 3,
    ARRIVED_AT_CUSTOMER: 4,
    ORDER_COMPLETE: 5,
  },
  Query: {
    getCurrentUser: async (root, args, { currentUser, User }) => {
      if (!currentUser) {
        return null
      }
      try {
        const user = await User.findOne({ email: currentUser.email })
        return user
      } catch(err) {
        console.log(err)
      }
    },
    getUserProfile: async (root, args, { currentUser, User }) => {
      if (!currentUser) {
        return null
      }
      const user = await User.findOne({ email: currentUser.email })
      return user
    },
    getAllUsers: async (root, args, { User }) => {
      const users = await User.find().sort({
        joinDate: 'desc'
      })
      return users
    },
    profilePage: async (root, { username }, { User }) => {
      const profile = await User.findOne({ username })
      return profile
    },
    getDrivers: async (root, {}, { Driver }) => {
      try {
        const drivers = await Driver.find({})
        return drivers
      } catch (e) {
        throw new Error('Error getting drivers', e)
      }
    },
    getDriversById: async (root, { ids }, { Driver }) => {
      try {
        console.log('getting drivers by ids', ids)
        const drivers = await Driver.find({ _id: { $in: ids } })
        return drivers
      } catch (e) {
        throw new Error('Error getting drivers by id', e)
      }
    },
    getOrders: async (root, {}, { Order }) => {
      const orders = await Order.find().populate({ path: 'drivers' })
      return orders
    },
    getOrderPreviews: async (root, {}, { Order }) => {
      const orders = await Order.find()
        .select('_id date vendor orderId headcount drivers merchantCity customerCity orderState')
        .populate({ path: 'drivers', select: 'name' })
        .sort({ date: 1 })
      return orders
    },
    getOrder: async (root, { id }, { Order }) => {
      const order = await Order.findOne({ _id: id }).populate({ path: 'drivers' })
      return order
    },
    getOrdersByDriver: async (root, { driverId }, { Order }) => {
      const orders = await Order.find({ drivers: { $in: [driverId] } })
      console.log('ordersByDriver', driverId, orders)
      return orders
    },
    getActivities: async (root, { id }, { Activity }) => {
      try {
        const activities = await Activity.find({ order: id })
          .select('_id order type createdAt')
          .populate({ path: 'order', select: 'vendor orderId merchantName customerName' })
        return activities
      } catch(e) {
        throw new Error('Error getting activities:', e)
      }
    },
  },
  Mutation: {
    signupUser: async (root, { email, username, password }, { User }) => {
      const user = await User.findOne({ email })
      if (user) {
        throw new AuthenticationError('User already exists')
      }
      const newUser = await new User({
        email,
        username,
        password,
      }).save()
      
      return { token: createToken(newUser, process.env.JWT_SECRET, '24hr')}
    },
    signinUser: async (root, { email, password }, { User }) => {
      const user = await User.findOne({ email })
      if (!user) {
        throw new AuthenticationError('User not found')
      }
      const isValidPassword = await bcrypt.compare(password, user.password)

      if (!isValidPassword) {
        throw new AuthenticationError('Invalid password')
      }

      return { token: createToken(user, process.env.JWT_SECRET, '24hr')}
    },
    editProfile: async (root, { email, bio }, { User }) => {
      const user = await User.findOneAndUpdate({ email }, { $set: { bio }}, { new: true })
      if (!user) {
        throw new Error('User not found')
      }
      return user
    },
    setProfileIMG: async (root, { email, profileImage }, { User }) => {
      const user = await User.findOneAndUpdate({ email }, { $set: { profileImage }}, { new: true })
      if (!user) {
        throw new Error('User not found')
      }
      return user
    },
    changeEmail: async (root, { currentEmail, newEmail }, { User }) => {
      if (!user) {
        throw new Error('User not found')
      }
      return user
    },
    changePassword: (root, { email, password }, { User }) => {
      const saltRounds = 10
      return bcrypt.hash(password, saltRounds).then(async hash => {
        const user = await User.findOneAndUpdate({ email }, { $set: { password: hash }}, { new: true })
        if (!user) {
          throw new Error('User not found')
        }
        return user
      })
    },
    passwordReset: async (root, { email }, { User }) => {
      const saltRounds = 10
      const generatedPassword = generator.generate({ length: 10, numbers: true })
      return bcrypt.hash(heneratedPassword, saltRounds).then(async hash => {
        const user = await User.findOneAndUpdate({ email }, { $set: { password: hash }}, { new: true })
        if (!user) {
          throw new Error('User not found')
        } else {
          const data = {
            email,
            generatedPassword,
          }

          axios.post(`${webConfig.siteURL}/password-reset`, data)
          .then(response => {
            console.log('Email sent!')
          })
          .catch(e => {
            console.log(e)
          })
        }
        return user
      })
    },
    addDriver: async (root, { name, phone }, { Driver }) => {
      const driver = await new Driver({
        name,
        phone,
      }).save()

      return driver
    },
    addOrder: async (root, { values }, { Order }) => {
      const savedOrder = await new Order(values).save()
      const order = await Order.findOne({ _id: savedOrder._id }).populate('drivers')
      return order
    },
    deleteOrder: async (root, { orderId }, { Order }) => {
      const order = await Order.findOneAndDelete({ _id: orderId }, { useFindAndModify: false })
      return order
    },
    setOrderState: async (root, { orderId, orderState }, { Activity, Order }) => {
      const order = await Order.findOne({ _id: orderId })
      order.orderState = orderState
      const savedOrder = await order.save()
      // console.log('order --> orderId', orderId)
      // const activity = await new Activity({
      //   type: orderState,
      //   order: orderId,
      // })
      // const savedActivity = await activity.save()
      return savedOrder
    },
    addActivity: async (root, { values }, { Activity }) => {
      try {
        const activity = await new Activity(values).save()
        const savedActivity = await Activity.find({ _id: activity._id })
          .select('_id order type createdAt')
          .populate({ path: 'order', select: 'vendor orderId merchantName customerName' })
        return savedActivity
      } catch(e) {
        throw new Error('Error adding activity', e)
      }
    }
  }
}

module.exports = resolvers