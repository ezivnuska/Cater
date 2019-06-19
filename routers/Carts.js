const express = require('express');
const CartsRouter = express.Router();
const Carts = require('../models/Cart');
const Pets = require('../models/Pet');

// If "pending" cart exist, populate pets info
// Else return empty cart
CartsRouter.get('', (req, res) => {
    const { userID } = req.query;
    Carts
        .find({userID, status: "Pending"})
        .populate('pets.pet', '_id name img price count')
        .then(cart => {
            res.status(200).json(cart);   
        })
        .catch(err => console.log(err));
});

// CartsRouter.post('', (req, res) => {
//     const cart = req.body;
//     Carts
//         .create(cart)
//         .then(result => {
//             res.status(200).json(result);
//             console.log(result);
//         })
//         .catch(err => console.log(err));
// });

CartsRouter.put('', (req, res) => {
    const { id } = req.query;
    const { userID } = req.query;
    const { petID } = req.query;
    const { status } = req.query;
    const amount  = Number(req.query.amount);
    const { cartItemID } = req.query;

    if (amount && cartItemID) {
        Carts
            .updateOne(
                {_id: id, 'pets._id': cartItemID},
                { $set: { 'pets.$.amount': amount }}
            )
            .then(result => {
                res.status(201).json(result);
                console.log(result);
            })
            .catch(err => console.log(err));
    } else if (status) {
        Carts
            .updateOne({_id: id}, { status })
            .then(result => res.status(201).json(result))
            .catch(err => console.log(err));
    } else if (petID) {
        // Push pet to cart, if cart doesn't exist, create one first
        Carts
            .updateOne(
                {userID, status: 'Pending'}, 
                { 
                    $set: { updatedAt: new Date()},
                    $push: { pets: { pet: petID }}
                },
                { upsert: true}
            )
            .then(result => {
                if (result.ok) {
                    // Reserve 1 pet for the user, update Pets with the new reservation
                    const quantity = 1;
                    return Pets
                        .updateOne(
                            { 
                                _id: petID, 
                                count: { $gte: quantity }
                            },
                            { 
                                $inc: { count: -quantity},
                                $push: {reserved: { userID, quantity }}
                            }
                        )
                }
            })
            .then(result => res.status(201).json(result))
            .catch(err => console.log(err));
    }    
});

module.exports = CartsRouter;