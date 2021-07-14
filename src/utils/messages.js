const generateMessage = text => {
    return {
        text,
        createdAt: new Date().getTime()
    }
}

const generateLocation = text => {
    return {
        text,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocation
}