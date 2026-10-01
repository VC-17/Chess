const socket = io();
const chess = new Chess()
const boardElement = document.querySelector(".chessboard")

let draggedPiece = null
let sourceSquare = null
let playerRole = null

const renderBoard = () => {
    const board = chess.board()
    boardElement.innerHTML=""
    board.forEach((row,rowindex)=>{
        row.forEach((square , squareindex)=>{
            const squareElement = document.createElement("div")
            squareElement.classList.add("square",
                (rowindex+squareindex)%2==0 ? "light" : "dark"
            )

            squareElement.dataset.row = rowindex
            squareElement.dataset.col = squareindex

            if(square){
                const pieceElement = document.createElement("div")
                pieceElement.classList.add("piece",square.color==='w' ? "white" : "black")
                pieceElement.innerText=getPieceUnicode(square)
                pieceElement.draggable = playerRole===square.color
                pieceElement.addEventListener("dragstart" , (e)=>{
                    if(pieceElement.draggable){
                        draggedPiece = pieceElement
                        sourceSquare = {row:rowindex , col:squareindex}
                        e.dataTransfer.setData("text/plain","")
                    }
                })
                pieceElement.addEventListener("dragend",()=>{
                    draggedPiece=null
                    sourceSquare=null
                })

                squareElement.appendChild(pieceElement)
            }
            squareElement.addEventListener("dragover",(e)=>{
                e.preventDefault()
            })
            squareElement.addEventListener("drop",(e)=>{
                e.preventDefault()
                if(draggedPiece){
                    const targetSource = {
                        row : parseInt(squareElement.dataset.row),
                        col : parseInt(squareElement.dataset.col)
                    }
                    handleMove(sourceSquare,targetSource)
                }
            })
            boardElement.appendChild(squareElement)
        })
    })
    if(playerRole==='b'){
        boardElement.classList.add('flipped')
    }
    else{
        boardElement.classList.remove('flipped')
    }
}

// const handleMove = (source, target) => {
//     const move = {
//         from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
//         to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
//         promotion: "q",
//     };
//     socket.emit("move",move)
// };

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    };

    const piece = chess.get(move.from);

    // Check for pawn promotion
    if (
        piece &&
        piece.type === "p" &&
        (move.to[1] === "8" || move.to[1] === "1")
    ) {
        const promotion = prompt(
            "Promote to:\nq = Queen\nr = Rook\nb = Bishop\nn = Knight"
        );

        if (!["q", "r", "b", "n"].includes(promotion)) {
            return;
        }

        move.promotion = promotion;
    }

    // Send the move to the server
    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        K: "♔︎", // King
        Q: "♕︎", // Queen
        R: "♖︎", // Rook
        B: "♗︎", // Bishop
        N: "♘︎", // Knight
        P: "♙︎", // Pawn

        k: "♚︎", // King
        q: "♛︎", // Queen
        r: "♜︎", // Rook
        b: "♝︎", // Bishop
        n: "♞︎", // Knight
        p: "♟︎"  // Pawn
    };

    return unicodePieces[piece.type] || "";
};

socket.on("playerRole" , function(role){
    playerRole = role
    renderBoard()
})

socket.on("spectatorRole" , function(){
    playerRole = null
    renderBoard()
})

socket.on("boardState" , function(fen){
    chess.load(fen)
    renderBoard()
})

socket.on("move", function(move) {
    chess.move(move);
    renderBoard();

    if (chess.in_checkmate()) {
        const winner = chess.turn() === "w" ? "Black" : "White";

        alert(`Checkmate! ${winner} player wins!`);
    }
    else if (chess.in_draw()) {
        alert("Game Draw!");
    }
    else if(chess.in_stalemate()){
        alert("OOPS Thats a stalemate")
    }
});

renderBoard()