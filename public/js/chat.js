const socket = io()

// socket.on('countUpdated', (count) => {
//     console.log('count has been updated!', count)
// })

// function increment() {
//     console.log('Clicked')
//     socket.emit('increment')
// }

// Elements
const msgInput = document.getElementById('msg')
const msgbutton = document.getElementById('msg_click')
const locationButton = document.getElementById('send-location')
const messages = document.getElementById('messages')

// templates
const messageTemplate = document.getElementById('message-template').innerHTML
const locationTemplate = document.getElementById('location-template').innerHTML
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML

//options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

function autoScroll() {
    //New Message Element
    const newMessage = messages.lastElementChild

    //Hieght of new Message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    //visible Height
    const visibleHeight = messages.offsetHeight

    //Height of messages container
    const containerHeight = messages.scrollHeight

    //How far have I scrolled ?
    const scrollOffset = messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('WelcomeUser', (message) => {
    console.log(message.text)

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML("beforeend", html)
    autoScroll()
})

function send_msg() {
    console.log('send')
    //disable button
    msgbutton.setAttribute('disabled','disabled')

    socket.emit('sendMsg', document.getElementById('msg').value, (error) => {
        msgbutton.removeAttribute('disabled')
        msgInput.value = ''
        msgInput.focus()
        if(error)
        return console.log(error)

        console.log('Message Delivered')
    })
}

socket.on('recieveMsg', message => {

    console.log("Message Recieved: " + message.text)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML("beforeend", html)
    autoScroll()
})

socket.on('recieveLocation', url => {

    console.log("Location Recieved: " + url)
    const html = Mustache.render(locationTemplate, {
        username: url.username,
        url: url.text,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML("beforeend", html)
    autoScroll()
})

function sendLocation() {
    if(!navigator.geolocation)
     return alert('Geolocation API not supported by your browser')

     locationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition(position => {
        // console.log(position)
        // socket.emit('location', position.coords.latitude, position.coords.longitude)
        socket.emit('location', {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }, result => {
            locationButton.removeAttribute('disabled')
            console.log(result)
        })
    })
}

socket.emit('join', {username, room}, error =>{
    if(error) {
        alert(error)
        location.href = '/'
    }
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.getElementById('sidebar').innerHTML = html
})