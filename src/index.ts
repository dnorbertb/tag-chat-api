import express, { Response } from 'express';

const app = express();
app.use(express.json());

const registeredUsers = [];
const eventClients: Array<{
    id: string,
    response: Response
}> = [];


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

app.get('/events', (req, res) => {
    const userId = req.query.id;
    if (!userId) res.send(400).json({ success: false, error: 'No userId specified' });


    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    });

    const data = `data: ${JSON.stringify({ id: userId })}\n\n`;

    res.write(data);

    eventClients.push({
        id: String(userId),
        response: res
    });

    console.log('Events client added');
})

app.get('/test', (req, res) => {
    eventClients.forEach(c => {
        console.log(c.id)
        c.response.write(`data: ${JSON.stringify({ newDataType: 'message' })}\n\n`);
    });
    res.status(200).json({ success: true })
})


app.listen(3000, () => {
    console.log('App is up and running!')
})