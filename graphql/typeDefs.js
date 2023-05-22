const gql = require('apollo-server-express').gql

const typeDefs = gql`
  scalar Date
  
  type User {
    _id: ID
    password: String!
    bio: String
    profileImage: String
    email: String!
    username: String!
    joinDate: String
  }

  type Driver {
    _id: ID!
    name: String!
    phone: String!
  }

  enum OrderStateEnum {
    ORDER_ADDED
    EN_ROUTE_TO_MERCHANT
    ARRIVED_AT_MERCHANT
    EN_ROUTE_TO_CUSTOMER
    ARRIVED_AT_CUSTOMER
    ORDER_COMPLETE
  }

  type Order {
    _id: ID!
    date: Date!
    vendor: String!
    orderId: String!
    headcount: String!
    pickup: Date!
    dropoff: Date!
    drivers: [Driver]
    merchantName: String!
    merchantAddress: String!
    merchantCity: String!
    customerName: String!
    customerAddress: String!
    customerCity: String!
    orderState: OrderStateEnum
  }

  input OrderInput {
    date: Date!
    vendor: String!
    orderId: String!
    headcount: String!
    pickup: Date!
    dropoff: Date!
    drivers: [ID]
    merchantName: String!
    merchantAddress: String!
    merchantCity: String!
    customerName: String!
    customerAddress: String!
    customerCity: String!
  }

  input ActivityInput {
    type: OrderStateEnum!
    order: ID!
  }

  type Activity {
    _id: ID
    type: OrderStateEnum
    order: Order
    createdAt: Date
  }

  type Token {
    token: String!
  }

  type Query {
    getCurrentUser: User
    getUserProfile: User
    getAllUsers: [User]
    profilePage(username: String!): User
    getDrivers: [Driver]
    getDriversById(ids: [ID!]): [Driver]
    getOrders: [Order]
    getOrderPreviews: [Order]
    getOrder(id: ID!): Order
    getOrdersByDriver(driverId: ID!): [Order]
    getActivities(id: ID!): [Activity]
  }

  type Mutation {
    signupUser(email: String!, username: String!, password: String!): Token
    signinUser(email: String!, password: String!): Token
    editProfile(email: String!, bio: String): User
    setProfileIMG(email: String!, profileImage: String!): User
    changeEmail(currentEmail: String!, newEmail: String!): User
    changePassword(email: String!, password: String!): User
    passwordReset(email: String!): User
    addDriver(name: String!, phone: String!): Driver
    addOrder(values: OrderInput): Order
    deleteOrder(orderId: ID!): Order
    setOrderState(orderId: ID!, orderState: OrderStateEnum): Order
    addActivity(values: ActivityInput!): Activity
  }
`

module.exports = typeDefs
