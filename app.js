// const express = require('express')
// const socket = require('socket.io')
// const http = require('http')
// const path = require('path')
// const { Chess } = require('chess.js')
// const { title } = require('process')

// const app = express()

// const server = http.createServer(app)
// const io = socket(server)

// const chess = new Chess()
// let players = {}
// let currentPlayer = 'W'

// app.set('view engine' , 'ejs')
// app.use(express.static(path.join(__dirname,"public")))

// app.get('/' , (req,res)=>{
//     res.render('index',{title : "Chess Game"})
// })

// io.on("connection" , function(uniqueSocket){
//     console.log("COnnected")
// })

// server.listen(3000 , function (){
//     console.log("Listening...")
// })

const express = require('express');
const socket = require('socket.io');
const http = require('http');
const path = require('path');
const { Chess } = require('chess.js');

const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = 'w';

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {
    res.render('index', { title: "Chess Game" });
});

// io.on("connection", function(uniqueSocket) {
//     console.log("Connected");

//     uniqueSocket.on("disconnect" , function(){
//         console.log("Disconnected")
//     })
// });

io.on("connection", function(uniqueSocket) {
   // console.log("Connected:", uniqueSocket.id);

    if(!players.white){
        players.white = uniqueSocket.id
        uniqueSocket.emit("playerRole","w")
    }
    else if(!players.black){
        players.black = uniqueSocket.id
        uniqueSocket.emit("playerRole","b")
    }
    else{
        uniqueSocket.emit("spectatorRole")
    }

    uniqueSocket.on("disconnect" , function(){
        if(uniqueSocket.id === players.white){
            delete players.white
        }
        else if(uniqueSocket.id === players.black){
            delete players.black
        }
    })

    uniqueSocket.on("move" , (move)=>{
        try {
            // the two lines make sure ki jiski chaal hai wo hi chal payga
            if(chess.turn() === "w" && uniqueSocket.id !== players.white) return
            if(chess.turn() === "b" && uniqueSocket.id !== players.black) return

            const result = chess.move(move) // if a legal move is played then only we get correct result
            // like 1.5 steps for horse is illegal move
            if(result){ //if result -> it was a valid move
                currentPlayer = chess.turn()
                io.emit("move" , move)
                io.emit("boardState" , chess.fen())
            } else{
                console.log("Invalid move : " , move)
                uniqueSocket.emit("Invalid move" , move)
            }
        } catch (error) {
            console.log(error)
            uniqueSocket.emit("Invalid move" , move)
        }
    })
});

server.listen(3000, function() {
    console.log("Listening...");
});