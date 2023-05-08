import express from 'express';

const app = express();
app.use(express.json());

const registeredUsers = [];


app.post('/register', (req, res) => {
    const username = req.body.username;
    if (!username) {
        res.status(400)
            .json({
                success: false,
                error: 'Request need to contain username'
            });
    }


    const time = new Date().getTime().toString();
    const idSuffix = time.slice(time.length - 4);
    const userId = username + idSuffix;
    registeredUsers.push(userId);

    res.status(200).json({ success: true, data: { username: userId } });
});


app.listen(3000, () => {
    console.log('App is up and running!')
})