const http = require('http')
const express = require('express')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocation } = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname,'../public')
app.use(express.static(publicDirectoryPath))

const io = socketio(server)

// let count = 0

io.on('connection', (socket) => {
    console.log('New Web Socket connection established.')
    // socket.emit('countUpdated', count)

    // socket.on('increment', () => {
    //     count++
    //     // socket.emit('countUpdated', count)           // this will only listen to that same connection or for example that same page
    //     io.emit('countUpdated', count)                  // this will emit to all other connections or for example differnt pages
    // })

    // socket.emit('WelcomeUser', generateMessage('Welcome!'))
    // socket.broadcast.emit('WelcomeUser', generateMessage('A new User has joined!'))         // for sending to all clients except for the same client

    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({ id: socket.id, username, room })
        // const {error, user} = addUser({ id: socket.id, ...options }) we can use this syntax also if we don't get the params in destructure format

        if(error) {
            return callback(error)
        }

        socket.join(user.room)

        // for room we will be using io.to.emit (for sending to everyone in that room only)  and socket.broadcast.to.emit (for sending to everyone except to that user in that room)
        socket.emit('WelcomeUser', {username: 'Admin', ...generateMessage('Welcome!')})
        socket.broadcast.to(user.room).emit('WelcomeUser', {username: 'Admin', ...generateMessage(`${user.username} has joined!`)})         // for sending to all clients except for the same client
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMsg', (message, callback) => {
        // console.log(message)
        const filter = new Filter()

        if(filter.isProfane(message))
        return callback('Profanity not allowed')

        const user = getUser(socket.id)

        if(user)
        io.to(user.room).emit('recieveMsg', {username: user.username, ...generateMessage(message)})

        callback()
    })

    socket.on('location', (coords, callback) => {
        const user = getUser(socket.id)

        if(user)
        socket.broadcast.to(user.room).emit('recieveLocation', {username: user.username, ...generateLocation(`https://www.google.com/maps?q=${coords.lat},${coords.long}`)})

        callback('Location Shared!')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('WelcomeUser', {username: 'Admin', ...generateMessage(`${user.username} has left!`)})
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

app.get('', (req, res) => {
    res.render('index')
})

server.listen(port, () => {
    console.log('The server is running on port ' + port)
})