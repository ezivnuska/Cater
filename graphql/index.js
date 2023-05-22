const ApolloServer = require('apollo-server-express').ApolloServer
const typeDefs = require('./typeDefs')
const resolvers = require('./resolvers')
const User = require('../models/User')
// import Driver from '../models/Driver'
// import Activity from '../models/Activity'
// import Order from '../models/Order'

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => ({
    User,
    // Activity,
    // Driver,
    // Order,
    currentUser: req.currentUser
  }),
  playground: {
    endpoint: '/graphql',
    settings: {
      'editor.theme': 'light'
    }
  }
})

module.exports = server
