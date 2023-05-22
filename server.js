const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');


// Import nodemailer and express-handlebars
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const SESSION_SECRET = require('./config').JWT_SECRET;
const Users = require('./models/User');
const db = require('./config').DB_CONNECTION_STRING;
const EMAIL = require('./config').MAILER_EMAIL;
const PASSWORD = require('./config').MAILER_PASSWORD;

const AWS = require('aws-sdk')

// Import Routers
// const PetsRouter = require('./routers/pets');
// const UsersRouter = require('./routers/Users');
// const OrdersRouter = require('./routers/Orders');
// const CartsRouter = require('./routers/Carts');
// const PaymentRouter = require('./routers/Payment');


const server = require('./graphql')
const PORT = process.env.PORT || 5000

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

const app = express()

// Setup some middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

server.applyMiddleware({ app })

// Reusable part for send email
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: EMAIL,
        pass: PASSWORD,
    },
});

// Send email to reset password
app.put('/forget_password', (req, res) => {
    const email = req.body.email;
    User
        .findOne({email})
        .then(user => {
            if (user) {
                // create a random token
                const token = crypto.randomBytes(20).toString('hex');
                return User
                    .findOneAndUpdate(
                        { email }, 
                        {
                            reset_password_token: token, 
                            reset_password_expires: Date.now() + 86400000  // Token will be expired in 24 hours
                        },
                        { new: true } // return the updated user
                    ); 
            } else {
              return res.json({success: false, msg: "User not found"});  
            }    
        })
        .then(user => {
            const token = user.reset_password_token;
            const uri = encodeURIComponent(`://192.168.0.107:19000/--/reset_password/${token}`);
            
            const mailOptions = {
                from: EMAIL,
                to: email,
                subject: 'Pets e-Shopping: Reset password link',
                html: 
                `
                <div>
                    <h3>Dear ${user.username},</h3>
                    <p>You requested for a password reset, kindly Click this <a href=https://expo.io/--/to-exp/exp${uri}>link</a> to reset your password</p>
                    <br>
                    <p>https://expo.io/--/to-exp/exp${uri}</p>
                    <br>
                    <p>Cheers!</p>
                </div>
                `
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.log(err);
                } else {
                    res.status(200).json({success: true});
                }
            })
        })
        .catch(err => console.log("Error when varify email of reseting pw: " + err));
});

app.get('/reset_password', (req, res) => {
    const { token } = req.query;
    Users
        .findOne({
            reset_password_token: token,
            reset_password_expires: { $gt: Date.now() }
        })
        .then(user => {
            if (!user) {
                res.json({success: false, msg: "Reset passwork link is invalid or expired!"});
            } else {
                res.status(200).json({success: true, username: user.username, email: user.email })
            }
        })
        .catch(err => console.log("Error when open reset_password link: " + err));   
});

app.put('/reset_password', (req, res) => {
    const { token, newPW } = req.body;

    bcrypt.hash(newPW, 11, (err, hashedPW) => {
        if (err) {
            res.status(422).json({resetPW: false, "error": err});
        } else {
            const newHashedPW = hashedPW;
            Users
                .findOneAndUpdate(
                    { reset_password_token: token },
                    { 
                        password: newHashedPW,
                        reset_password_expires: null,
                        reset_password_token: '', 
                    },
                )
                .then(result => res.status(200).json({resetPW: true, result}))
                .catch(err => console.log("Error when update password: " + err));
        }
    });
});

// Middleware: Validate user for all the routers, except '/signin' and '/singup'
app.use((req, res, next) => {
    if (req.originalUrl === '/signin' || req.originalUrl === '/signup') return next();
    if (!req.session.email) {
        res.json({msg: "User is not logged in"});
        return;
    } 
    next();
});

// Sign Up User
app.post('/signup', (req, res) => {
    bcrypt.hash(req.body.password, 11, (err, hashedPW) => {
        if (err) {
            res.status(422).json({"error": err});
        } else {
            const user = req.body;
            user.password = hashedPW;
            Users
                .create(user)
                .then(result => res.status(200).json({success: true, result}))
                .catch(err => console.log(err));
        }
    });
});

// Sign In User
app.post('/signin', (req, res) => {
    const { email } = req.body;
    Users
        .findOne({ email })
        .then(user => {
            const hashedPW = user.password;
            bcrypt
                .compare(req.body.password, hashedPW)
                .then(result => {
                    if (!result) throw new Error();
                    req.session.email = req.body;
                    req.user = user;
                    // user.password cound not be deleted, change to undefined to hide the password
                    req.user.password = undefined;
                    req.user.creatAt = undefined;
                    req.user.__v = undefined;
                    res.json({success: true, user: req.user});
                })
                .catch(err => res.json({msg: "Failed when comparing password"}));
        })
        .catch(err => res.json({msg: "Failed to find the user"}));
});

// Sign Out User
app.post('/signout', (req, res) => {
    delete req.session.email;
    delete req.user;
    res.json({success: true, msg: "User Sign Out", session: req.session});
});

// Using Routers
// server.use('/pets', PetsRouter);
// server.use('/users', UsersRouter);
// server.use('/orders', OrdersRouter);
// server.use('/carts', CartsRouter);
// server.use('/payments', PaymentRouter);


// Charge customer with token
// app.post('/payment', (req, res) => {
//     return stripe.charges.create({
//         amount: req.body.amount,
//         currency: req.body.currency,
//         source: req.body.source,
//         description: req.body.description,
//     })
//     .then(result => res.status(200).json(result))
//     .catch(error => console.log(error));
// });


// Connect to MongoDB
mongoose.Promise = global.Promise;
mongoose
    .connect(db, {useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

server.listen(PORT, () => console.log(`server listen on ${PORT}`));