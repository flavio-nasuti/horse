"use strict"

const canvas = document.getElementById("canvas")
const context = canvas.getContext("2d")
const speed = 260
const itemSize = 20
const swipeLimit = 80
const topWallPosition = 0
const leftWallPosition = 0
let bottomWallPosition = 0
let rightWallPosition = 0
let fullScreen = 0
let halfScreen = 0
let gameOver = false
let isFoodGenerated = false
let isPoisonGenerated = false
let poisonsPositions = []
let swipeStartX = 0
let swipeStartY = 0
let currentFrameTimestamp = 0
let previousFrameTimestamp = 0
let secondsPassed = 0

class Sprite
{
    constructor(positionX, positionY, sizeX, sizeY, color)
    {
        this.positionX = positionX
        this.positionY = positionY
        this.sizeX = sizeX
        this.sizeY = sizeY
        this.color = color
    }
    drawSprite()
    {
        context.beginPath()
        context.rect(this.positionX, this.positionY, this.sizeX, this.sizeY)
        context.fillStyle = this.color
        context.fill()
    }
    eraseSprite()
    {
        context.clearRect(this.positionX, this.positionY, this.sizeX, this.sizeY)
    }
}

const food = new Sprite(0, 0, itemSize, itemSize, "green")
const poison = new Sprite(0, 0, itemSize, itemSize, "red")

class Horse extends Sprite
{
    constructor(positionX, positionY, sizeX, sizeY, color, direction, speed, score)
    {
        super(positionX, positionY, sizeX, sizeY, color)
        this.direction = direction
        this.speed = speed
        this.score = score
    }
    positionHorizontaly()
    {
        this.sizeX = 40
        this.sizeY = 20
    }
    positionVerticaly()
    {
        this.sizeX = 20
        this.sizeY = 40
    }
    move()
    {
        if (this.direction == "right")
        {
            this.positionHorizontaly()
            this.positionX += Math.round(this.speed * secondsPassed)
        }
        else if (this.direction == "left")
        {
            this.positionHorizontaly()
            this.positionX -= Math.round(this.speed * secondsPassed)
        }
        else if (this.direction == "up")
        {
            this.positionVerticaly()
            this.positionY -= Math.round(this.speed * secondsPassed)
        }
        else if (this.direction == "down")
        {
            this.positionVerticaly()
            this.positionY += Math.round(this.speed * secondsPassed)
        }
    }
}

const horse = new Horse(0, 0, 40, 20, "brown", "right", speed, 0);

function getKeyInput(key)
{
    if (!gameOver)
    {
        if (key.code == "ArrowUp" && horse.direction != "down")
        {
            horse.direction = "up"
        }
        else if (key.code == "ArrowDown" && horse.direction != "up")
        {
            horse.direction = "down"
        }
        else if (key.code == "ArrowRight" && horse.direction != "left")
        {
            horse.direction = "right"
        }
        else if (key.code == "ArrowLeft" && horse.direction != "right")
        {
            horse.direction = "left"
        }    
    }
    else
    {
        startGame()
    }
}

function getTouchInput(swipe)
{
    if (!gameOver)
    {
        swipeStartX = swipe.touches[0].clientX
        swipeStartY = swipe.touches[0].clientY
        window.addEventListener('touchend', endTouchInput)
    }
    else
    {
        startGame()
    }
}

function endTouchInput(swipe)
{
    const swipeEndX = swipe.changedTouches[0].clientX
    const swipeEndY = swipe.changedTouches[0].clientY

    if (swipeStartX < (swipeEndX - swipeLimit) &&
        Math.abs(swipeStartX - swipeEndX) > Math.abs(swipeStartY - swipeEndY) &&
        horse.direction != "left")
    {
        horse.direction = "right"
    }
    else if (swipeStartX > (swipeEndX + swipeLimit) &&
        Math.abs(swipeStartX - swipeEndX) > Math.abs(swipeStartY - swipeEndY) &&
        horse.direction != "right")
    {
        horse.direction = "left"
    }
    else if (swipeStartY < (swipeEndY - swipeLimit) &&
        Math.abs(swipeStartX - swipeEndX) < Math.abs(swipeStartY - swipeEndY) &&
        horse.direction != "up")
    {
        horse.direction = "down"
    }
    else if (swipeStartY > (swipeEndY + swipeLimit) &&
        Math.abs(swipeStartX - swipeEndX) < Math.abs(swipeStartY - swipeEndY) &&
        horse.direction != "down")
    {
        horse.direction = "up"
    }

    window.removeEventListener('touchend', endTouchInput)
}

function animateHorse()
{
    horse.eraseSprite()
    horse.move()
    horse.drawSprite()
}

function isPoisonNotOnHorse()
{
    if ((poison.positionX > horse.positionX + 80 || poison.positionX < horse.positionX - 60) &&
        (poison.positionY > horse.positionY + 80 || poison.positionY < horse.positionY - 60))
    {
        return true
    }
    else
    {
        return false
    }
}

function generatePoison()
{
    if (!isPoisonGenerated)
    {
        for (let i = 0; i < horse.score; i++)
        {
            // Set poisons positions, not too close to horse
            do
            {
                poison.positionX = Math.floor(Math.random() * (fullScreen - 20))
                poison.positionY = Math.floor(Math.random() * (fullScreen - 20)) 
            }
            while (!(isPoisonNotOnHorse()))

            // Get poisons positions for collision check
            let poisonPositionPair = []
            poisonPositionPair.push(poison.positionX)
            poisonPositionPair.push(poison.positionY)
            poisonsPositions.push(poisonPositionPair)

            poison.drawSprite()
            isPoisonGenerated = true
        }
    }
}

function isFoodOnPoison()
{
    for (let i = 0; i < poisonsPositions.length; i++)
    {
        if (poisonsPositions[i][0] < food.positionX + itemSize + 40 &&
            poisonsPositions[i][0] + itemSize + 40 > food.positionX &&
            poisonsPositions[i][1] < food.positionY + itemSize + 40 &&
            poisonsPositions[i][1] + itemSize + 40 > food.positionY)
        {
            return true
        }
        else
        {
            continue
        }
    }
}

function generateFood()
{
    if (!isFoodGenerated)
    {
        // Set food position, not too close to walls, nor on a poison
        do
        {
            food.positionX = Math.floor(Math.random() * (fullScreen - 80)) + 40
            food.positionY = Math.floor(Math.random() * (fullScreen - 80)) + 40
        }
        while (isFoodOnPoison())

        food.drawSprite()
        isFoodGenerated = true
    }
}

function checkWallCollision()
{
    if (horse.positionX > rightWallPosition ||
        horse.positionX < leftWallPosition ||
        horse.positionY > bottomWallPosition ||
        horse.positionY < topWallPosition)
    {
        gameOver = true
    }
}

function checkPoisonCollision()
{
    for (let i = 0; i < poisonsPositions.length; i++)
    {
        if (poisonsPositions[i][0] < horse.positionX + horse.sizeX &&
            poisonsPositions[i][0] + itemSize > horse.positionX &&
            poisonsPositions[i][1] < horse.positionY + horse.sizeY &&
            poisonsPositions[i][1] + itemSize > horse.positionY)
        {
            gameOver = true
            break
        }
    }
}

function checkFoodCollision()
{
    if (food.positionX < horse.positionX + horse.sizeX &&
        food.positionX + itemSize > horse.positionX &&
        food.positionY < horse.positionY + horse.sizeY &&
        food.positionY + itemSize > horse.positionY)
    {
        horse.score += 1
        food.eraseSprite()
        isFoodGenerated = false
        isPoisonGenerated = false
    }
}

class Text
{
    constructor(text, size)
    {
        this.text = text
        this.size = size
    }
    writeText()
    {
        context.font = this.size + "px sans-serif"
        context.fillStyle = "white"
        context.textAlign = "center"
        context.fillText(this.text, halfScreen, halfScreen)
    }
}

function displayGameOver()
{
    const blackRectangle = new Sprite(0, Math.floor((fullScreen - (fullScreen / 4)) / 2), fullScreen, (fullScreen / 4), "black")
    let highscore = localStorage.getItem("highscore")

    // Set highscore to zero at first game
    if (highscore == null)
    {
        highscore = 0
    }

    blackRectangle.drawSprite()

    if (horse.score > highscore)
    {
        highscore = horse.score
        localStorage.setItem("highscore", horse.score)
        const newHighscore = new Text("New Highscore " + highscore, 28)
        newHighscore.writeText()
    }
    else
    {
        const playerScore = new Text("Score " + horse.score + "  -  Highscore " + highscore, 28)
        playerScore.writeText()
    }
}

function sizeScreen()
{
    // Size canvas for both landscape and portrait displays
    if (window.innerHeight < window.innerWidth)
    {
        canvas.height = Math.floor(window.innerHeight) - 60
        canvas.width = canvas.height
    }
    else
    {
        canvas.width = Math.floor(window.innerWidth) - 60
        canvas.height = canvas.width
    }

    fullScreen = canvas.height
    halfScreen = Math.floor(fullScreen / 2)
    bottomWallPosition = fullScreen - 40
    rightWallPosition = fullScreen - 40
}

function resetGame()
{
    horse.positionX = halfScreen
    horse.positionY = halfScreen
    horse.direction = "right"
    horse.score = 0

    isFoodGenerated = false
    food.positionX = 0
    food.positionY = 0

    isPoisonGenerated = false
    poison.PositionX = 0
    poison.PositionY = 0
    poisonsPositions = []

    previousFrameTimestamp = window.performance.now()

    gameOver = false
}

function gameLoop(currentFrameTimestamp)
{   
    secondsPassed = (currentFrameTimestamp - previousFrameTimestamp) / 1000
    previousFrameTimestamp = currentFrameTimestamp
    
    generatePoison()
    generateFood()
    animateHorse() 
    checkWallCollision()
    checkPoisonCollision()
    checkFoodCollision()
    
    if (!gameOver)
    {
        window.requestAnimationFrame(gameLoop)
    }
    else
    {
        window.cancelAnimationFrame(gameLoop)
        displayGameOver()
    }
}

function startGame()
{
    sizeScreen()
    resetGame()
    window.requestAnimationFrame(gameLoop)
}

window.addEventListener("load", startGame)
window.addEventListener("resize", startGame)
window.addEventListener("keydown", getKeyInput)
window.addEventListener('touchstart', getTouchInput)
