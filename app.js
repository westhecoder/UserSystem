const express = require('express')
const bcrypt = require('bcrypt')
const pool = require('./dbConfig')
const flash = require('express-flash')
const session = require('express-session')
const passport = require('passport')
const initializePassport = require('./passportConfig')
require('dotenv')


initializePassport(passport)
const app = express()

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))

app.use(session({
    secret: 'thisismysecret',
    resave: false,
    saveUninitialized: false,
    maxAge: 300000
}))

app.use(passport.session())
app.use(passport.initialize())
app.use(flash())

app.use((req, res, next) => {
    console.log(req.session) //express session will create this object here
    console.log('User:', req.user) //passport middleware will create this one here
    next()
})

app.get('/members/register', (req, res) => {
    res.render('register')
})

app.get('/members/login', (req, res) => {
    res.render('login')
})

app.get('/members/dashboard', checkAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.user.fname })
})

app.get('/members/logout', (req, res) => {
    req.logOut((err) => {
        if (err) return err
    })
    req.flash('success_msg', 'You have succefully logged out')
    res.redirect('/members/login')
})

app.post('/members/register', checkAuthenticated, async (req, res) => {

    const { fname, lname, email, password, password2 } = req.body

    const errors = []

    function validateEmail(email) {
        const re = /\S+@\S+\.\S+/
        return re.test(email)
    }

    if (!validateEmail(email)) {
        errors.push({ message: 'Invalid email address.' })
    }

    if (password.length <= 4) {
        errors.push({ message: 'Password should be longer than 4 characters.' })
    }

    if (password != password2) {
        console.log(password, password2)
        errors.push({ message: 'Passwords do not matach.' })
    }

    if (errors.length > 0) {
        res.render('register', { errors }) //We will list the errors in the registration page
    } else {
        const passwordHash = await bcrypt.hash(password, 10)

        pool.query(`SELECT * FROM taskcreator WHERE email = $1`, [email],
            (err, results) => {
                if (err) {
                    throw err
                }
                if (results.rows.length > 0) {
                    errors.push({ message: 'Email is already registered. ' })
                    res.render('register', { errors })
                } else {
                    pool.query(
                        `INSERT INTO taskcreator(fname, lname, email, password)
                    VALUES ($1, $2, $3, $4) RETURNING id, password`, [fname, lname, email, passwordHash],
                        (err, results) => {
                            if (err) {
                                throw err
                            }

                            console.log(results.rows)
                            req.flash('success_msg', 'You are now registered. Please Login.')
                            res.redirect('/members/login')
                        })
                }
            })
    }

})

app.post('/members/login', passport.authenticate('local', {
    successRedirect: '/members/dashboard',
    failureRedirect: '/members/login',
    failureFlash: true
}))

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next()
    } else {
        return res.redirect('/members/login')
    }
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(('Date: ', new Date().toLocaleDateString()), `Server started on port ${PORT} at`, new Date().toLocaleTimeString())
})