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

//Function to create a new user
app.post('/api/register', (req, res) => {
    const { name, password } = req.body;
    const users = readUsers();

    //Checks if name is already in use
    if (user.find(user => user.name === name)) {
        return res.status(400).json({ error: 'Name already exists' })
    }

    const id = uuid();
    const newUser = { id, name, password: bcrypt.hashSync(password, 8) };
    users.push(newUser);
    writeUsers(users);
    res.json({ message: 'User registered successfully' });
});

//Multer settings to manage file uploading
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'tmp') //Specifies destination folder
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`) //Sets unic name to uploaded files
    }
});

const upload = multer({ storage: storage }); //Configurates multer to manage the uploading of a unique file with "foto" field

//Function to upload an image with hashtags
app.post('/api/upload', checkToken, upload.single('image'), async (req, res) => {
    const { userId, hashtags } = req.body;
    const image = req.file;

    //Resize image before saving it
    try {
        await sharp(image.path)
            .resize({ width: 800 })
            .toFile(`${imagesFolder}/${image.filename}`)
            .then(async () => {
                //Delete original image after resize
                await fs.unlink(image.path, (err) => err ? console.log(err) : () => { });
            });
    } catch (error) {
        //Throw error
        return res.status(500).json({ error: 'Failed to process image xx' });
    }

    //Save image information in images.json file
    const images = readImages();
    images.push({ userId: req.userId, filename: image.filename, hashtag });
    fs.writeFileSync(imagesFile, JSON.stringify(images, null, 2));

    res.json({ message: 'Image uploaded successfully' });
});

//Endpoint to get a user's images
app.get('/api/user/:userId/images', checkToken, (req, res) => {
    const userId = req.params.userId;
    const userImages = readImages().filter(image => image.userId === userId);
    res.json(userImages);
});

//Endpoint to get images by hashtag
app.get('/api/images/:hashtag', checkToken, (req, res) => {
    const hashtag = req.params.hashtag;
    const hashtagImages = readImages().filter(image => image.hashtags.includes(hashtag));
    res.json(hashtagImages);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})