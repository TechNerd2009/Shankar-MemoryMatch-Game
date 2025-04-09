class MemoryGame {
    constructor() {
        this.gameBoard = document.getElementById('game-board');
        this.movesCount = document.getElementById('moves-count');
        this.timeDisplay = document.getElementById('time');
        this.startButton = document.getElementById('start-game');
        this.resetButton = document.getElementById('reset-game');
        this.winPopup = document.getElementById('win-popup');
        this.winMoves = document.getElementById('win-moves');
        this.winTime = document.getElementById('win-time');
        this.playAgainButton = document.getElementById('play-again');
        this.difficultyButtons = document.querySelectorAll('.difficulty-btn');
        this.difficultySelector = document.getElementById('difficulty-selector');
        this.gameInfo = document.getElementById('game-info');
        this.controls = document.querySelector('.controls');
        
        // Sound controls
        this.bgmToggle = document.getElementById('bgm-toggle');
        this.sfxToggle = document.getElementById('sfx-toggle');
        this.bgm = document.getElementById('bgm');
        
        // Sound states
        this.isBGMEnabled = true;
        this.isSFXEnabled = true;
        
        this.cards = [];
        this.flippedCards = [];
        this.moves = 0;
        this.time = 0;
        this.timer = null;
        this.gameStarted = false;
        this.currentDifficulty = 'easy';
        
        // Sound effects
        this.matchSound = document.getElementById('match-sound');
        this.mismatchSound = document.getElementById('mismatch-sound');
        this.winSound = document.getElementById('win-sound');
        
        this.initializeEventListeners();
        this.initializeSoundControls();
        this.updateControlsVisibility();
    }
    
    initializeEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.resetButton.addEventListener('click', () => this.resetGame());
        this.playAgainButton.addEventListener('click', () => this.resetGame());
        
        // Add difficulty selection listeners
        this.difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.difficultyButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.currentDifficulty = button.dataset.difficulty;
                this.resetGame();
            });
        });
    }
    
    initializeSoundControls() {
        // BGM toggle
        this.bgmToggle.addEventListener('click', () => {
            this.isBGMEnabled = !this.isBGMEnabled;
            this.bgmToggle.classList.toggle('muted', !this.isBGMEnabled);
            
            if (this.isBGMEnabled) {
                this.bgm.play().catch(e => console.log('Audio play failed:', e));
            } else {
                this.bgm.pause();
            }
        });

        // SFX toggle
        this.sfxToggle.addEventListener('click', () => {
            this.isSFXEnabled = !this.isSFXEnabled;
            this.sfxToggle.classList.toggle('muted', !this.isSFXEnabled);
        });

        // Start background music when game starts
        this.startButton.addEventListener('click', () => {
            if (this.isBGMEnabled) {
                this.bgm.play().catch(e => console.log('Audio play failed:', e));
            }
        });
    }

    playSound(soundId) {
        if (!this.isSFXEnabled) return;
        
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Audio play failed:', e));
        }
    }
    
    startGame() {
        if (this.gameStarted) return;
        
        this.gameStarted = true;
        this.moves = 0;
        this.time = 0;
        this.updateMoves();
        this.startTimer();
        
        // Hide difficulty selector and show game info
        this.difficultySelector.classList.add('hidden');
        this.gameInfo.classList.add('visible');
        
        // Update controls visibility
        this.updateControlsVisibility();
        
        // Create and shuffle cards
        this.createCards();
        this.shuffleCards();
        this.renderCards();
    }
    
    resetGame() {
        this.gameStarted = false;
        this.cards = [];
        this.flippedCards = [];
        this.moves = 0;
        this.time = 0;
        this.updateMoves();
        this.updateTimer();
        clearInterval(this.timer);
        this.gameBoard.innerHTML = '';
        
        // Stop and reset background music
        this.bgm.pause();
        this.bgm.currentTime = 0;
        
        // Show difficulty selector and hide game info
        this.difficultySelector.classList.remove('hidden');
        this.gameInfo.classList.remove('visible');
        
        // Update controls visibility
        this.updateControlsVisibility();
        
        // Hide win popup
        this.winPopup.classList.remove('active');
    }
    
    updateControlsVisibility() {
        if (this.gameStarted) {
            this.controls.classList.remove('start-screen');
            this.resetButton.style.display = 'block';
        } else {
            this.controls.classList.add('start-screen');
            this.resetButton.style.display = 'none';
        }
    }
    
    createCards() {
        // Create pairs of cards with emojis and unique colors
        const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
        this.cards = [];
        
        emojis.forEach((emoji, index) => {
            this.cards.push({ id: emoji, matched: false, pair: index });
            this.cards.push({ id: emoji, matched: false, pair: index });
        });
    }
    
    shuffleCards() {
        // Fisher-Yates shuffle algorithm
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    
    renderCards() {
        this.gameBoard.innerHTML = '';
        
        this.cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.dataset.index = index;
            cardElement.dataset.pair = card.pair;
            cardElement.dataset.difficulty = this.currentDifficulty;
            
            const cardInner = document.createElement('div');
            cardInner.className = 'card-inner';
            
            const cardFront = document.createElement('div');
            cardFront.className = 'card-front';
            cardFront.textContent = card.id;
            
            const cardBack = document.createElement('div');
            cardBack.className = 'card-back';
            
            cardInner.appendChild(cardFront);
            cardInner.appendChild(cardBack);
            cardElement.appendChild(cardInner);
            
            cardElement.addEventListener('click', () => this.flipCard(cardElement, index));
            
            this.gameBoard.appendChild(cardElement);
        });
    }
    
    flipCard(cardElement, index) {
        if (!this.gameStarted || this.flippedCards.length >= 2) return;
        
        const card = this.cards[index];
        if (card.matched || cardElement.classList.contains('flipped')) return;
        
        // Flip the card
        cardElement.classList.add('flipped');
        this.flippedCards.push({ element: cardElement, index });
        
        // Check for match if two cards are flipped
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateMoves();
            this.checkMatch();
        }
    }
    
    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const cardData1 = this.cards[card1.index];
        const cardData2 = this.cards[card2.index];
        
        if (cardData1.id === cardData2.id) {
            // Match found
            cardData1.matched = true;
            cardData2.matched = true;
            
            this.playSound('match-sound');
            
            this.flippedCards = [];
            
            // Check for win
            if (this.cards.every(card => card.matched)) {
                this.winGame();
            }
        } else {
            // No match
            this.playSound('mismatch-sound');
            
            // Add mismatch animation
            card1.element.classList.add('mismatch');
            card2.element.classList.add('mismatch');
            
            // Flip cards back after delay
            setTimeout(() => {
                card1.element.classList.remove('flipped', 'mismatch');
                card2.element.classList.remove('flipped', 'mismatch');
                this.flippedCards = [];
            }, 1000);
        }
    }
    
    updateMoves() {
        this.movesCount.textContent = this.moves;
    }
    
    startTimer() {
        this.timer = setInterval(() => {
            this.time++;
            this.updateTimer();
        }, 1000);
    }
    
    updateTimer() {
        const minutes = Math.floor(this.time / 60);
        const seconds = this.time % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    createConfetti() {
        const numConfetti = 1500; // Increased from 100 to 200
        const duration = 5500; // 3 seconds
        
        // Create confetti pieces with staggered timing
        for (let i = 0; i < numConfetti; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Random starting position across the top of the screen
            // Distribute more confetti vertically by using a wider range
            confetti.style.left = `${Math.random() * 100}vw`;
            
            // Random horizontal movement during fall
            const xOffset = (Math.random() - 0.5) * 300; // Increased from 200 to 300 for more spread
            confetti.style.setProperty('--x-offset', `${xOffset}px`);
            
            // Random delay for each piece (staggered effect)
            // Increased delay range for more vertical spread
            confetti.style.animationDelay = `${Math.random() * 2}s`; // Increased from 1s to 2s
            
            // Random size variation
            const size = Math.random() * 4 + 6; // Random size between 6px and 10px
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            
            document.body.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
            }, duration + 500); // Add 500ms buffer to ensure animation completes
        }
    }
    
    winGame() {
        clearInterval(this.timer);
        this.playSound('win-sound');
        
        // Update win popup content
        this.winMoves.textContent = this.moves;
        this.winTime.textContent = this.timeDisplay.textContent;
        
        // Show win popup
        this.winPopup.classList.add('active');
        
        // Create confetti
        this.createConfetti();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MemoryGame();
});

// Info popup functionality
const infoBtn = document.querySelector('.info-btn');
const infoPopup = document.querySelector('.info-popup');
const closeInfoBtn = document.querySelector('.close-info');

infoBtn.addEventListener('click', () => {
    infoPopup.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling when popup is open
});

closeInfoBtn.addEventListener('click', () => {
    infoPopup.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
});

// Close popup when clicking outside
infoPopup.addEventListener('click', (e) => {
    if (e.target === infoPopup) {
        infoPopup.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Close popup with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && infoPopup.classList.contains('active')) {
        infoPopup.classList.remove('active');
        document.body.style.overflow = '';
    }
}); 