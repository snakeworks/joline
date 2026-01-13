const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const loginScreen = document.getElementById("loginScreen");
const usernameInput = document.getElementById("usernameInput");
const colorInput = document.getElementById("colorInput");
const joinButton = document.getElementById("joinButton");
const backgroundColor = "#505050";
const inputMap = {};

let socket = undefined
let myPlayer = undefined
let entities = {}
let lastTime = Date.now()

function drawCircle(x, y, radius, color) {
    context.beginPath()
    context.arc(x, y, radius, 0, 2 * Math.PI)
    context.strokeStyle = color
    context.stroke()
}

function drawCircleFilled(x, y, radius, color) {
    context.beginPath()
    context.arc(x, y, radius, 0, 2 * Math.PI)
    context.fillStyle = color
    context.fill()
}

function drawRectFilled(x, y, size, color) {
    context.fillStyle = color;
    context.fillRect(x, y, size.x, size.y);
}

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = backgroundColor
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fill()

    for (const [_name, entity] of Object.entries(entities)) {
        if (Object.hasOwn(entity, "username")) {
            drawRectFilled(entity.x, entity.y, entity.size, entity.color);
            context.font = "12px 'Courier New', monospace";
            context.textAlign = "center";
            context.fillStyle = "#ffffff";
            context.fillText(entity.username, entity.x + entity.size.x / 2, entity.y - 8.0);
        } else {
            drawCircleFilled(entity.x, entity.y, entity.size.x, entity.color);
        }
    }
}

function update() {
    if (isPressed("KeyW")) {
        myPlayer.y -= myPlayer.speed * delta;
    }
    if (isPressed("KeyS")) {
        myPlayer.y += myPlayer.speed * delta;
    }
    if (isPressed("KeyD")) {
        myPlayer.x += myPlayer.speed * delta;
    }
    if (isPressed("KeyA")) {
        myPlayer.x -= myPlayer.speed * delta;
    }

    socket.send(JSON.stringify({
        type: "update",
        player: myPlayer
    }));
}

function onKeyDown(event) {
    inputMap[event.code] = true
}

function onKeyUp(event) {
    inputMap[event.code] = false
}

function isPressed(keyCode) {
    return inputMap[keyCode]
}

function joinServer() {
    const username = usernameInput.value;
    const color = colorInput.value;

    if (username.length < 3) {
        return;
    }

    joinButton.disabled = true;

    socket = new WebSocket("ws://192.168.0.9:3000");

    socket.addEventListener("open", () => {
        loginScreen.style.display = "none";
        socket.send(JSON.stringify({
            type: "setup",
            username: username,
            color: color
        }));
    });

    socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        
        console.log(`[WS] From server: ${event.data}`);
        
        if (!Object.hasOwn(message, "type")) {
            return;
        }

        switch (message.type) {
            case "playerCreate":
                myPlayer = message.player;
                break;
            case "playerConnect":
                break;
            case "playerDisconnect":
                break;
            case "update":
                entities = message.entities;
                break;
        }
    });
}

function onRequestAnimationFrame() {
    window.requestAnimationFrame(onRequestAnimationFrame)
    
    if (myPlayer === undefined) {
        return;
    }

    let currentTime = Date.now()
    delta = (currentTime - lastTime) * 0.001
    lastTime = currentTime
    
    update()
    draw()
}

function onResize(_window, _event) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
}

window.requestAnimationFrame(onRequestAnimationFrame)
addEventListener("keydown", onKeyDown)
addEventListener("keyup", onKeyUp)
addEventListener("resize", onResize)
addEventListener("blur", () => {
    for (const key in inputMap) {
        inputMap[key] = false;
    }
})
onResize()


joinButton.addEventListener("click", joinServer);
