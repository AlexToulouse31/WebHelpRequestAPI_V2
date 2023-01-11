import ticketsRouter from './routes/ticketsRouter';
import usersRouter from './routes/usersRouter';

const express = require('express');
const { Client } = require('pg');
require('dotenv').config()
const bcrypt = require('bcrypt');

const app = express();
const port = 8000;
const client = new Client({
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
});

client.connect();

app.use(express.json());

app.post('/api/users/register', async (req, res) => {

    const password = req.body.password;
    const user_name = req.body.user_name;

    bcrypt.hash(password, 10, async (err, hash) => {
        try {

            const data = await client.query('INSERT INTO users (user_name, password) VALUES ($1, $2) returning *;', [user_name, hash]);

            res.status(201).json({
                status: "created",
                data: { post: data.rows }
            })
        }

        catch (err) {
            console.log(err);
            res.status(404).json({
                status: "not found",
                data: null
            })
        }
    });
});

app.post("/api/users/login", async (req, res) => {
    const user_name = req.body.user_name;
    const password = req.body.password;

    try {
        const data = await client.query('SELECT * FROM users WHERE user_name = $1', [user_name]);
        if (data.rows.length === 0) {
         //verifie qu un utilisateur existe ou pas 
            res.status(404).json({error: "User not found"});
        } else {
            const dbHash = data.rows[0].password;
            bcrypt.compare(password, dbHash, function(err, result) {
                if (result === true) {
                    res.json({message: "Login successful"});
                } else {
                    res.status(401).json({error: "Incorrect password"});
                }
            });
        }
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({error: "An error occured while trying to log in"});
    }
});

app.get('/api/tickets', async (req, res) => {
    try {
        const data = await client.query('SELECT * FROM tickets');

        res.status(200).json({
            status: "success",
            data: { post: data.rows }
        })
    }

    catch (err) {
        res.status(404).json({
            status: "not found",
            data: null
        })
    }
});

app.get('/api/tickets/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const data = await client.query('SELECT * FROM tickets where id = $1', [id]);

        res.status(200).json({
            status: "success",
            data: { post: data.rows }
        })
    }

    catch (err) {
        res.status(404).json({
            status: "not found",
            data: null
        })
    }
});

app.post('/api/tickets', async (req, res) => {

    try {
        const message = req.body.message;

        const data = await client.query('INSERT INTO tickets (message) VALUES ($1) returning *', [message]);

        res.status(201).json({
            status: "created",
            data: { post: data.rows }
        })
    }

    catch (err) {
        res.status(404).json({
            status: "not found",
            data: null
        })
    }
});

app.put('/api/tickets/:id', async (req, res) => {
    const id = req.params.id;
    const message = req.body.message;

    try {
        const data = await client.query('UPDATE tickets SET (message, done) = ($2, true) WHERE id = $1 returning *', [id, message]);

        res.status(200).json({
            status: "success",
            data: { post: data.rows }

        })
    }

    catch (err) {
        res.status(404).json({
            status: "not found",
            data: null
        })
    }
});


app.delete('/api/tickets/:id', async (req, res) => {

    const id = req.params.id;

    try {
        const data = await client.query('DELETE FROM tickets where id = $1', [id]);

        res.status(200).json({
            status: "deleted",
            data: data.rows
        })
    }

    catch (err) {
        res.status(404).json({
            status: "not found",
            data: null
        })
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port:${port}`)
});
