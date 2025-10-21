import { WebSocketServer } from 'ws';

let players = new Map();

const wss = new WebSocketServer({ port: 8080 });

setInterval(() => {
  if (players.size > 1) {
    let data = [];
    players.forEach((value, key) => {
      if (value.showonmap == true) {
        data.push({id: value.id, username: value.username, position: value.position,rotation: value.rotation});
      }
    });
    sendallclients(JSON.stringify({type: "update", data: data}));
  }
}, 50);

wss.on('connection', ws => {
  let id = Math.floor(Math.random()*10000);
  players.set(ws, {showonmap: false, id: id, username: '', position: [0,22,0], rotation: 0});

  ws.send(JSON.stringify({type: "id", id: id}));

  ws.on('close', () => {
    const player = players.get(ws);
    if (!player) return;
    players.delete(ws);
    if (player.showonmap) {
      sendallclients(JSON.stringify({ type: "leave", id: player.id }));
    }
  });
  
  ws.on('message', message => {
    let data = message.toString();
    
    try {
      data = JSON.parse(data);
    } catch (e) {
      return;
    }

    if (data.type == "join") {
      if (players.get(ws).showonmap == true) {
        return;
      }
      players.set(ws, {showonmap: true, id: id, username: data.username, position: [0,22,0],rotation: 0});
      sendallclients(JSON.stringify({type: "join", id: id, username: data.username}));
    } else if (data.type == "update") {
      if (players.get(ws).showonmap == false) {
        return;
      }
      players.set(ws, {showonmap: true, id: id, username: players.get(ws).username, position: data.position, rotation: data.rotation});
    } else if (data.type == "list") {
      if (players.get(ws).showonmap == false) {
        return;
      }
      let data = [];
      players.forEach((value, key) => {
        if (value.showonmap == true) {
          data.push({id: value.id, username: value.username})
        }
      });
      ws.send(JSON.stringify({type: "list", data: data}));
    }
  });
});

function sendallclients(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
