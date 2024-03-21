const express = require('express');
const cors = require('cors'); //cross-origin
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs'); //encrypt password
const uuid = require('uuid'); // universal id creation
const multer = require('multer'); // file upload
const sharp = require('sharp'); // image editing
const jwt = require('jsonwebtoken'); // Import json web token library

const SECRET_KEY = "como-una-loncha-de-queso-en-un-sandwich-preso"; // to be used in jsonwebtoken creation

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(cookieParser());

const userFile = 'users.json';
const imagesFolder = 'uploads';
const imagesFile = 'images.json';

//Function to read users from JSON file
function readUser() {
    const data = fs.readFileSync(userFile);
    return JSON.parse(data);
}

//Function to write users in JSON file
function writeUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

//Function to read images from JSON file
function readImages() {
    const data = fs.readFileSync(imagesFile);
    return JSON.parse(data);
}

//Function to write images in the JSON file
function writeUImages(data) {
    fs.writeFileSync(imagesFile, JSON.stringify(data, null, 2))
}

//Middleware to verify JWT in the cookie
const checkToken = (req, res, next) => {
    const token = req.cookies?.token; //Gets token from request cookie
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' }); //Returns 401 error if there is no token
    }
    try {
        const decodedToken = jwt.verify(token, SECRET_KEY); //Verifies token using secret keyç
        req.userId = decodedToken.userId; //Sets user ID to rquest object
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' }) //Returns 401 error if token is not valid
    }
}


//LOGIN
//Endpoint to log in
app.post('/api/login', (req, res) => {
    const { name, password } = req.body;
    const users = readUsers();

    const user = users.find(user => user.name === name);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid name or password' });
    }

    const token = jwt.sign({ userId: user.id, userName: user.name }, SECRET_KEY, { expiresIn: '2h' }) //Generates a JWT token 2h valid
    res.cookie('token', token, { httpOnly: false, maxAge: 7200000 }); //Sets token as a cookie

    res.json({ message: 'Login successful', userId: user.id, name: user.name });
});

//REFRESH verifies if token is valid
app.get('/api/refresh', checkToken, async (req, res) => {
    const users = readUsers();

    const user = user.find(user => user.id === userId);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'User not found' })
    }

    return res.json({ id: user.id, name: user.name })
})



const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})