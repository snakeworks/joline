import { createServer } from "http"
import { readFileSync } from "fs"
import { WebSocketServer } from "ws";
import { Player, Food } from "../game/game.js";

const port = 3000
const indexHtml = readFileSync("../client/index.html")
const indexJs = readFileSync("../client/index.js")

let playerCount = 0;
const entities = {}

export const handler = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    switch (req.url) {
        default:
        case "/":
            onIndexHtml(req, res);
            break;
        case "/index.js":
            onIndexJs(req, res);    
            break;
    }
}

const onIndexHtml = (_req, res) => {
    res.writeHead(200, {'Content-Type': "text/html"});
    res.write(indexHtml)
    res.end()
}

const onIndexJs = (_req, res) => {
    res.writeHead(200, {'Content-Type': "text/javascript"});
    res.write(indexJs)
    res.end()
}

function generatePlayerId() {
    const length = 24;
    return Math.random().toString(36).substring(2, length+2);
}

const server = createServer(handler)
server.listen(
    3000, "192.168.0.9",
    () => {
        console.log(`Server listening on port ${port}`)
    }
)

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
    let playerId = generatePlayerId();
    entities[playerId] = new Player(playerId);
    
    ws.on("message", (data) => {
        const parsedData = JSON.parse(data);
        
        if (!Object.hasOwn(parsedData, "type")) {
            return;
        }
        
        //console.log(`[WS] From client: ${data}`);
        
        switch (parsedData.type) {
            case "setup":
                entities[playerId].username = parsedData.username;
                entities[playerId].color = parsedData.color;
                console.log(`[WS] Player (${entities[playerId].username}) connected`)
                ws.send(JSON.stringify({
                    type: "playerCreate", 
                    player: entities[playerId]
                }));
                playerCount++;
                break;
            case "update":
                entities[playerId].x = parsedData.player.x;
                entities[playerId].y = parsedData.player.y;
                break;
        }
    });
        
    ws.on("close", (code, reason) => {
        console.log(`[WS] Player (${playerId}) disconnected, ${code} ${reason}`);
        delete entities[playerId];
        playerCount--;
    });
});

function isOverlappingEntity(entity1, entity2) {
    return entity1.x < entity2.x + entity2.size.x &&
           entity1.x + entity1.size.x > entity2.x &&
           entity1.y < entity2.y + entity2.size.y &&
           entity1.y + entity1.size.y > entity2.y;
}

const gameLoop = setInterval(() => {
    wss.clients.forEach((client) => {
        for (const [_name, entity] of Object.entries(entities)) {
            if (Object.hasOwn(entity, "username")) {
                for (const [_name2, entity2] of Object.entries(entities)) {
                    if (Object.hasOwn(entity2, "username")){
                        continue;
                    }
                    if (isOverlappingEntity(entity, entity2)) {
                        entity.size.x += entity2.energy;
                        entity.size.y += entity2.energy;
                        delete entities[entity2.name];
                    }
                }
            } 
        }

        if (client.readyState === 1) {
            client.send(JSON.stringify({
                type: "update",
                entities: entities,
            }));
        }
    });
    console.log(`[WS] Server tick occured`)
}, 16);

function createScene() {
    const maxFoodCount = 100;

    for (let i = 0; i < maxFoodCount; i++) {
        const foodName = `food_${i}`;
        const x = Math.random() * 1600;
        const y = Math.random() * 900;
        entities[foodName] = new Food(foodName);
        entities[foodName].x = x;
        entities[foodName].y = y;
    }
}

createScene();
