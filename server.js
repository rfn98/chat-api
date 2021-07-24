const express = require('express')
const http = require('http')
const WebSocket = require('ws')

const port = 4545
const server = http.createServer(express)
const ws = require('ws');
const wss = new WebSocket.Server({server})

const knex = require('knex')({
  client: 'pg',
  connection: {
    host : 'localhost',
    user : 'postgres',
    password : '123',
    database : 'spk'
  }
});

/*const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'spk',
  password: '123',
  port: 5432,
})*/

const bodyParser = require('body-parser')
const app = express()

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});

const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', socket => {
  socket.on('message', function incoming(data) {
  	wsServer.clients.forEach(async function each(client) {
  		console.log('sender', client._receiver._writableState.writing)
  		console.log('msg', data)
  		if (client._receiver._writableState.writing) {
	  		knex('chat.chats').insert({text: data}).then(async () => {
	  			const chats = await knex('chat.chats');
	  			// console.log(chats)
	  			client.send(JSON.stringify(chats))
	  		})
  		} else {
  			const chats = await knex('chat.chats');
  			// console.log(chats)
  			client.send(JSON.stringify(chats))
  		}
  	})
  });
});

/*wss.on('connection', function connection(ws) {
	ws.on('message', function incoming(data) {
		wss.clients.forEach(function each(client) {
			// if (client !== ws && client.readyState === WebSocket.OPEN) {
			// if (client !== ws && client.readyState === WebSocket.OPEN) {
				console.log('client', client._receiver._writableState.writing)
				knex('chat.chats').insert({text: data})
				console.log(data)
				client.send(data)
			// }
		})
	})
})*/

app.get('/get-user', async (request, response) => {
	try {
        let users = await knex('chat.users');
        response.json(users)
    } catch (e) {
        console.log(e);
    }
})

app.get('/get-chats', async (request, response) => {
	try {
        let users = await knex('chat.chats');
        response.json(users)
    } catch (e) {
        console.log(e);
    }
})



app.get('/test', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
})

/*const getUsers = (request, response) => {
}*/

/*app.listen(port, function() {
	console.log('Server is listening on port ' + port)
})*/

app.listen(port).on('upgrade', (request, socket, head) => {
	console.log('Server is listening on port ' + port)
  	wsServer.handleUpgrade(request, socket, head, socket => {
    wsServer.emit('connection', socket, request);
  });
});