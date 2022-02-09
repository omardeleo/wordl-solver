let { wordList } = require('../wordList')

const correctFilter = (arr, i) => word =>
	word[arr[i].position] === arr[i].letter

const absentFilter = (arr, i, correctLetters, emptyIdx) => {
	const { letter } = arr[i]

	if (correctLetters.includes(letter)) {
		const filters = []
		emptyIdx.forEach(idx => filters.push(word => word[idx] !== letter))
		return word => filters.every(f => f(word))
	} else {
		return word => !word.includes(letter)
	}
}

const presentFilter = (arr, i) => word =>
	word.includes(arr[i].letter) && word[arr[i].position] !== arr[i].letter

/** This function returns a function */
const createFilter = (arr, filter, correct, emptyIdx) => {
	const filters = []

	for (let i = 0; i < arr.length; i++) {
		filters.push(filter(arr, i, correct, emptyIdx))
	}

	return word => filters.every(f => f(word))
}

/** This function returns a function */
const combineFilters = (letters, correctArr, emptyIdx) => {
	const { correct, absent, present } = letters
	const filters = []

	if (correct.length > 0) filters.push(createFilter(correct, correctFilter))
	if (absent.length > 0)
		filters.push(createFilter(absent, absentFilter, correctArr, emptyIdx))
	if (present.length > 0) filters.push(createFilter(present, presentFilter))

	return word => filters.every(f => f(word))
}

// Generate filter
const getGuess = async (idx, page) => {
	const tileSelector = `shadow/game-row:nth-of-type(${idx}) game-tile`
	const tiles = await page.$$(tileSelector)
	let letterCount = 0
	const guess = { correct: [], absent: [], present: [] }
	for (const tile of tiles) {
		const letter = await page.evaluate(el => el.getAttribute('letter'), tile)
		const position = letterCount
		const evaluation = await page.evaluate(
			el => el.getAttribute('evaluation'),
			tile
		)
		letterCount++
		guess[evaluation].push({ letter, position })
	}
	return guess
}

const enterGuess = async (guess, page) => {
	await page.keyboard.type(guess)
	await page.keyboard.press('Enter')
}

const getNextGuessWord = async (guessWord, page, delay, attemptNumber) => {
	await enterGuess(guessWord, page)
	const guess = await getGuess(attemptNumber, page)
	const correct = guess.correct.map(obj => obj.letter)
	const emptyIdx = [
		...guess.present.map(obj => obj.position),
		...guess.absent.map(obj => obj.position),
	]
	const filters = combineFilters(guess, correct, emptyIdx)
	wordList = wordList.filter(filters)
	await delay(2000)

	if (correct.length === 5) {
		return 'YOU WIN!'
	} else {
		return wordList[0]
	}
}

module.exports = { combineFilters, getGuess, enterGuess, getNextGuessWord }
