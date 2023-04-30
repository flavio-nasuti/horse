"use strict"

const canvas = document.getElementById("canvas")
const context = canvas.getContext("2d")
const swipeLimit = 30
const speed = 240
const horseLength = 40
const horseWidth = 20
const itemSize = 20
const fontSize = 30
const lightBlack = "#303030"
const lightWhite = "#CFCFCF"
const topWallPosition = 0
const leftWallPosition = 0
let bottomWallPosition = 0
let rightWallPosition = 0
let gameAreaSize = 0
let gameAreaHalfSize = 0
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
        this.sizeX = horseLength
        this.sizeY = horseWidth
    }
    positionVerticaly()
    {
        this.sizeX = horseWidth
        this.sizeY = horseLength
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

const horse = new Horse(0, 0, horseLength, horseWidth, "brown", "right", speed, 0);

class Text
{
    constructor(text, size, color)
    {
        this.text = text
        this.size = size
        this.color = color
    }
    writeText()
    {
        context.font = this.size + "px sans-serif"
        context.fillStyle = this.color
        context.textAlign = "center"
        context.fillText(this.text, gameAreaHalfSize, gameAreaHalfSize)
    }
}

function getKeyInput(key)
{
    if (!gameOver)
    {
        if ((key.code == "ArrowUp" || key.code == "KeyW") && horse.direction != "down")
        {
            horse.direction = "up"
        }
        else if ((key.code == "ArrowDown" || key.code == "KeyS") && horse.direction != "up")
        {
            horse.direction = "down"
        }
        else if ((key.code == "ArrowRight" || key.code == "KeyD") && horse.direction != "left")
        {
            horse.direction = "right"
        }
        else if ((key.code == "ArrowLeft" || key.code == "KeyA") && horse.direction != "right")
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
        (horse.direction == "up" || horse.direction == "down"))
    {
        horse.direction = "right"
    }
    else if (swipeStartX > (swipeEndX + swipeLimit) &&
        (horse.direction == "up" || horse.direction == "down"))
    {
        horse.direction = "left"
    }
    else if (swipeStartY < (swipeEndY - swipeLimit) &&
        (horse.direction == "left" || horse.direction == "right"))
    {
        horse.direction = "down"
    }
    else if (swipeStartY > (swipeEndY + swipeLimit) &&
        (horse.direction == "left" || horse.direction == "right"))
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
    // Keep a horse length between new poisons and horse
    if ((poison.positionX > horse.positionX + (2 * horseLength) || poison.positionX < horse.positionX - itemSize - horseLength) &&
        (poison.positionY > horse.positionY + (2 * horseLength) || poison.positionY < horse.positionY - itemSize - horseLength))
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
            do
            {
                poison.positionX = Math.floor(Math.random() * (gameAreaSize - itemSize))
                poison.positionY = Math.floor(Math.random() * (gameAreaSize - itemSize)) 
            }
            while (!isPoisonNotOnHorse())

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
        // Keep a horse length between new food and poisons 
        if (poisonsPositions[i][0] < food.positionX + itemSize + horseLength &&
            poisonsPositions[i][0] + itemSize + horseLength > food.positionX &&
            poisonsPositions[i][1] < food.positionY + itemSize + horseLength &&
            poisonsPositions[i][1] + itemSize + horseLength > food.positionY)
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
        // Keep a horse length between new food and walls
        do
        {
            food.positionX = Math.floor(Math.random() * (gameAreaSize - (2 * horseLength))) + horseLength
            food.positionY = Math.floor(Math.random() * (gameAreaSize - (2 * horseLength))) + horseLength
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

function displayGameOver()
{
    const blackRectangle = new Sprite(0, Math.round(gameAreaSize * 3 / 8), gameAreaSize, Math.round(gameAreaSize / 4), lightBlack)
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
        const newHighscore = new Text("New Highscore " + highscore, fontSize, lightWhite)
        newHighscore.writeText()
    }
    else
    {
        const playerScore = new Text("Score " + horse.score + " - Highscore " + highscore, fontSize, lightWhite)
        playerScore.writeText()
    }
}

function sizeScreen()
{
    // Size canvas for both landscape and portrait displays
    if (window.innerHeight < window.innerWidth)
    {
        canvas.height = Math.floor(window.innerHeight) - 56
        canvas.width = canvas.height
    }
    else
    {
        canvas.width = Math.floor(window.innerWidth) - 56
        canvas.height = canvas.width
    }

    gameAreaSize = canvas.height
    gameAreaHalfSize = Math.floor(gameAreaSize / 2)
    bottomWallPosition = gameAreaSize - horseLength
    rightWallPosition = gameAreaSize - horseLength
}

function getRandomDirection()
{
    let randomNumber = Math.random()
    if (randomNumber < 0.25)
    {
        return "right"
    }
    else if (randomNumber >= 0.25 && randomNumber < 0.50)
    {
        return "left"
    }
    else if (randomNumber >= 0.50 && randomNumber < 0.75)
    {
        return "up"
    }
    else
    {
        return "down"
    }
}

function resetGame()
{
    horse.positionX = gameAreaHalfSize
    horse.positionY = gameAreaHalfSize
    horse.direction = getRandomDirection()
    horse.score = 0

    isFoodGenerated = false
    isPoisonGenerated = false
    poisonsPositions = []

    previousFrameTimestamp = window.performance.now()

    gameOver = false
}

function gameLoop(currentFrameTimestamp)
{   
    secondsPassed = (currentFrameTimestamp - previousFrameTimestamp) / 1000
    previousFrameTimestamp = currentFrameTimestamp
    // For debug on desktop
    // console.log(Math.round(secondsPassed * 3600) + " FPS")
    // For debug on mobile
    // document.getElementById("fps").innerHTML = Math.round(secondsPassed * 3600) + " FPS"

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
