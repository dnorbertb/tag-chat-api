import express, { Response } from 'express';

const app = express();
app.use(express.json());

interface IMessage {
    senderId: string,
    receiverId: string,
    content: string
}

/**
 * @param registeredUsers would be useful for permamently registered users
 */
const registeredUsers = [];
const SSEClients: Array<{
    id: string,
    response: Response
}> = [];
const messageQueue: IMessage[] = []

// User register function
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

// SSE emiter
app.get('/events', (req, res) => {
    const userId = req.query.id as string;
    if (!userId) res.send(400).json({ success: false, error: 'No username specified' });

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    });

    req.on('close', () => {
        console.log(userId + ' is offline');
        const clientIndex = SSEClients.findIndex(item => item.id === userId);
        if (clientIndex < 0) return;
        SSEClients.splice(clientIndex);
    });

    SSEClients.push({
        id: userId,
        response: res
    });

    console.log(userId + ' is now listetning for server events');

    // Check for awaiting messages and send event message
    if (hasMessagesInQueue(userId)) {
        emitMessageEventToUser(userId);
    };
});

// Sending/downloading messages
app.post('/message', (req, res) => {
    if (!req.body.senderId && !req.body.receiverId && !req.body.content) res.send(400).json({ success: false, error: 'No receiverId or content' });
    messageQueue.push({ ...req.body });
    emitMessageEventToUser(req.body.receiverId);
    res.status(200).json({ success: true })
});

app.get('/message', (req, res) => {
    const userId = req.query.id as string;
    if (!userId) res.send(400).json({ success: false, error: 'No username specified' });
    const messagesToUser = messageQueue.filter(m => m.receiverId === userId);
    const [statusCode, responseData] = messagesToUser.length > 0 ? [200, { data: messagesToUser }] : [204, { message: 'No content' }];
    res.status(statusCode).json(responseData);
});


const hasMessagesInQueue = (userId: string) => {
    const awaitingUserIds = messageQueue.map(m => m.receiverId)
    return awaitingUserIds.includes(userId);
};

const emitMessageEventToUser = (userId: string) => {
    const SSEClient = SSEClients.find(c => c.id === userId);
    if (!SSEClient) return;
    SSEClient.response.write(`data: ${JSON.stringify({ newContent: { type: 'message' } })}\n\n`);
};

app.listen(3000, () => {
    console.log('App is up and running!')
});