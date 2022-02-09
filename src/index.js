const puppeteer = require('puppeteer')
const { QueryHandler } = require('query-selector-shadow-dom/plugins/puppeteer')
const { getNextGuessWord } = require('../util/filter')

function delay(time) {
	return new Promise(function (resolve) {
		setTimeout(resolve, time)
	})
}

;(async () => {
	try {
		await puppeteer.registerCustomQueryHandler('shadow', QueryHandler)
		const browser = await puppeteer.launch({
			headless: false,
		})
		const page = await browser.newPage()
		await page.goto('https://www.powerlanguage.co.uk/wordle/')

		// Ensure close instruction button loads and click it
		await page.waitForSelector('shadow/.close-icon')
		await delay(1000)
		const btn = await page.$('shadow/.close-icon')
		await btn.click()

		let guessWord = 'orate'
		let attemptNumber = 1
		while (guessWord !== 'YOU WIN!') {
			if (attemptNumber > 6) {
				console.log('Game Over :/')
				break
			}
			guessWord = await getNextGuessWord(guessWord, page, delay, attemptNumber)
			attemptNumber++
		}
		console.log(guessWord)
		delay(4000)
		await browser.close()
	} catch (e) {
		console.error(e)
	}
})()
