const router = require('express').Router();
const userDb = require('../db/user.db');
const User = require('../models/user');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.get('/generate', async (req, res) => {
    try {
        console.log('generate User')
        const result = await User.insertMany(userDb)
        res.send(result)
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const filter = {}
        if (req.params.id) filter._id = req.params.id
        else {
            res.status(400).json({ msg: 'ID required' })
            return
        }
        const result = await User.findOne(filter)
        res.json(result)
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})


router.get('/atelier/:loginType', async (req, res) => {
    try {
        // console.log("atelier");
        console.log(req.params.loginType);
        const filter = {}
        if (req.params.loginType) {
            filter.loginType = req.params.loginType;
        }
        else {
            res.status(400).json({ msg: 'ID required' })
            return
        }
        const result = await User.find({
            "loginType": req.params.loginType,
            // "voiture.estDansLeGarage": false
        });
        console.log("Get all client type: ", result);
        res.json(result);
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})

router.get('/financier/:loginType', async (req, res) => {
    try {
        console.log("Finance");
        const filter = {}
        if (req.params.loginType) {
            filter.loginType = req.params.loginType;
        }
        else {
            res.status(400).json({ msg: 'ID required' })
            return
        }
        const result = await User.find({
            "loginType": req.params.loginType,
            "voiture.estPayer": false
        });
        // console.log("Get all client type: ", result);
        res.json(result);
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})

router.get('/chart/:loginType', async (req, res) => {
    try {
        console.log("chart");
        const filter = {}
        if (req.params.loginType) {
            filter.loginType = req.params.loginType;
        }
        else {
            res.status(400).json({ msg: 'ID required' })
            return
        }
        const result = await User.aggregate(
            [
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$date" } }
                    }
                }
            ],

            function (err, result) {
                if (err) {
                    res.send(err);
                } else {
                    res.json(result);
                }
            }
        );
        console.log("Get all client type: ", result);
        res.json(result);
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})


router.get('/', async (req, res) => {
    try {
        // console.log('get All User')
        const filter = {}
        if (req.query.id) filter._id = req.query.id
        const result = await User.find(filter, null, { sort: { updatedAt: 1 } })
        res.json(result)
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})

router.post('/login', async (req, res) => {
    try {
        console.log("Login");
        const filter = {}
        let good = false
        if (req.body.email) filter.email = req.body.email
        else return res.status(400).json({ msg: 'Email requis' })
        // else return res.status(400).json({ msg: 'Nom d\'utilisateur requis' })
        const result = await User.findOne(filter)
        if (!result) return res.status(404).json({ msg: 'Utilisateur non trouvé' })
        if (req.body.password) good = await bcrypt.compare(req.body.password, result.password)
        else return res.status(400).json({ msg: 'Mot de passe requis' })
        if (good) {
            const token = jwt.sign(
                { userId: result._id, email: result.email, username: result.usename },
                process.env.TOKEN_KEY,
                { expiresIn: "24h" }
            )
            delete result.password
            res.send({ user: result, token })
        }
        else res.status(403).json({ msg: 'Mot de passe incorrect' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})

router.post('/signup', async (req, res) => {
    try {
        console.log('signupss', req.body)
        const user = new User(req.body)
        const result = await User.findOne({ $or: [{ email: user.email }, { nom: user.nom }] })
        console.log('result', result)
        if (result) {
            res.status(409).json({ msg: "L'utilisateur existe déjà" })
            return
        }
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() + 1);
        user.activationLimit = dateLimit
        user.password = await bcrypt.hash(user.password, 10)
        user.activationCode = Math.floor(100000 + Math.random() * 900000)
        user.roles = []
        delete user._id
        await user.save()
        const newUser = await User.findOne({ email: user.email }).select('-password')
        // delete newUser.password
        console.log('new', newUser)
        res.send(newUser)
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})

router.put('/', async (req, res) => {
    try {
        const data = req.body
        console.log("Update User: ", data);
        const filter = {}
        if (data._id) filter._id = data._id
        else {
            res.status(404).json({ success: false, msg: "ID required" })
            return
        }
        const user = await User.findOneAndUpdate(filter, data)
        res.json(user)
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const filter = {}
        if (req.params.id) filter._id = req.params.id
        else {
            res.status(400).json({ msg: 'ID required' })
            return
        }
        const result = await User.deleteOne(filter)
        res.json(result)
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})

router.put('/voiture/:id', async (req, res) => {
    try {
        var voiture_id = req.params.id;
        const data = req.body
        User.update({ 'voiture._id': voiture_id },
            {
                '$set': {
                    'voiture.$.estDansLeGarage': true,
                }
            },
            function (err, model) {
                if (err) {
                    console.log(err);
                    return res.send(err);
                }
                return res.json(model);
            });

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})

router.put('/voiture/:id/:idMateriel', async (req, res) => {
    try {
        var voiture_id = req.params.id;
        var materiel_id = req.params.idMateriel;
        const data = req.body
        User.update(
            {
                "user._id": data._id,
                "voiture": {
                    "$elemMatch": {
                        "voiture_id": voiture_id, "materiel._id": materiel_id
                    }
                }
            },
            {
                "$set": {
                    "voiture.$[outer].materiel.$[inner].estReparer": true
                }
            },
            {
                "arrayFilters": [
                    { "outer._id": voiture_id },
                    { "inner._id": materiel_id }
                ]
            }, (err, result) => {
                if (err) {
                    console.log('Error updating service: ' + err);
                    res.send({ 'error': 'An error has occurred' });
                } else {
                    console.log(result)
                    return res.json(result);
                }
            })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})

router.put('/bondesortie/:id', async (req, res) => {
    try {
        console.log("Facture");
        var voiture_id = req.params.id;
        const data = req.body
        console.log(voiture_id);
        User.updateOne({ 'voiture._id': voiture_id },
            {
                '$set': {
                    'voiture.$.bonDeSortie': true,
                }
            },
            function (err, model) {
                if (err) {
                    console.log(err);
                    return res.send(err);
                }
                console.log(model);
                return res.json(model);
            });

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})

router.put('/voiture_reparer/:id', async (req, res) => {
    try {
        var voiture_id = req.params.id;
        const data = req.body
        User.update({ 'voiture._id': voiture_id },
            {
                '$set': {
                    'voiture.$.estTerminer': true,
                }
            },
            function (err, model) {
                if (err) {
                    console.log(err);
                    return res.send(err);
                }
                return res.json(model);
            });
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})


router.post('/sendEmail', async (req, res) => {
    try {
        console.log("request came");
        let data = req.body;
        console.log(data.email);
        console.log(data.body);
        console.log(data.objet);
        const nodemailer = require('nodemailer');

        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            service: 'gmail',
            secure: false,
            auth: {
                user: 'nomenjanaharymandaaroniaina@gmail.com',
                pass: 'fukdxneowpfmkjzs'
            },
            debug: false,
            logger: true
        });

        let mailOptions = {
            from: 'nomenjanaharymandaaroniaina@gmail.com',
            to: data.email,
            subject: data.objet,
            text: data.body
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.send(error);
            } else {
                console.log('Email sent: ' + info.response);
                return res.json(info.response);
            }
        });


    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})


router.put('/payement/:id', async (req, res) => {
    try {
        console.log("Facture");
        var voiture_id = req.params.id;
        const data = req.body
        console.log(voiture_id);
        User.updateOne({ 'voiture._id': voiture_id },
            {
                '$set': {
                    'voiture.$.estPayer': true
                }
            },
            function (err, model) {
                if (err) {
                    console.log(err);
                    return res.send(err);
                }
                console.log(model);
                return res.json(model);
            });

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})

router.post('/ajout_materiel/:id/:idVoiture', async (req, res) => {
    try {
        console.log("Mande ny code")
        var user_id = req.params.id;
        var voiture_id = req.params.idVoiture;
        console.log("Ajout materiel: ",req.body.materiel);
        console.log("Id voiture:", voiture_id);
        console.log("User voiture:", user_id);
        var add = "voiture." + voiture_id + ".materiel";
        console.log(add);
        User.findByIdAndUpdate(
            user_id,
            { $push: { [add]: req.body.materiel } },

            { safe: true, upsert: true }, (err, model) => {
                if (err) {
                    console.log(err);
                    return res.send(err);
                }
                console.log("modele:", model);
                return res.json(model);
            });
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})


router.post('/ajout_voiture/:id', async (req, res) => {
    try {
        console.log("Mande ny code")
        var user_id = req.params.id;
        console.log("Ajout voiture: ",req.body.voiture);
        User.findByIdAndUpdate(
            user_id,
            { $push: { "voiture": req.body.voiture } },

            { safe: true, upsert: true }, (err, model) => {
                if (err) {
                    console.log(err);
                    return res.send(err);
                }
                console.log("modele:", model);
                return res.json(model);
            });
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})


router.delete('/delete_voiture/:id/:idVoiture', async (req, res) => {
    try {
        console.log("Supprimer voiture");
        var user_id = req.params.id;
        var voiture_id = req.params.idVoiture;
        console.log("Delete voiture: ", user_id + " - " + voiture_id);
        User.findByIdAndUpdate(
            user_id,
            { $pull: { 'voiture': { _id: voiture_id } } }, function (err, model) {
                if (err) {
                    console.log(err);
                    return res.send(err);
                }
                console.log(model);
                return res.json(model);
            });

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})

router.get('/voitureTemp', async (req, res) => {
    try {
        console.log("Stat");
        const result = await User.find({
            "loginType": "0",
        });
        // console.log("Get all client type: ", result);
        res.json(result);
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})

router.put('/payer/:id', async (req, res) => {
    try {
        console.log("Facture");
        var voiture_id = req.params.id;
        const data = req.body
        console.log(voiture_id);
        User.updateOne({ 'voiture._id': voiture_id },
            {
                '$set': {
                    'voiture.$.payer': true,
                }
            },
            function (err, model) {
                if (err) {
                    console.log(err);
                    return res.send(err);
                }
                console.log(model);
                return res.json(model);
            });

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})

router.put('/estPayer/:id', async (req, res) => {
    try {
        console.log("Facture");
        var voiture_id = req.params.id;
        const data = req.body
        console.log(voiture_id);
        User.updateOne({ 'voiture._id': voiture_id },
            {
                '$set': {
                    'voiture.$.estPayer': true,
                }
            },
            function (err, model) {
                if (err) {
                    console.log(err);
                    return res.send(err);
                }
                console.log(model);
                return res.json(model);
            });

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: error })
    }
})


module.exports = router;