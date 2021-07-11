const fs = require('fs')
const axios = require('axios')

const locationId = 'bb50f09c-03e7-4410-a37a-79e1bb0b837c'
const config = {
	urlDetails: `https://visits.fressi24.fi/api/v1/locations/${locationId}/current`,
	urlTimeline: `https://visits.fressi24.fi/api/v1/locations/${locationId}/timeline`
}

const formattedDate =()=> {
	const now = new Date()
	const d = `${now.getDate()}`.padStart(2, '0')
	const m = `${1 + now.getMonth()}`.padStart(2, '0')
	const y = now.getFullYear()

	const h = `${now.getHours()}`.padStart(2, '0')
	const mi = `${now.getMinutes()}`.padStart(2, '0')
	const s = `${now.getSeconds()}`.padStart(2, '0')
	return `${d}.${m}.${y} ${h}:${mi}:${s}`
}

let error = 0

const fetchData =async ()=> {
	let _data = { current: null, forecast: null, timestamp: formattedDate() }

	try {
		console.log('Fetching location ...')
		const current = await axios.get(config.urlDetails)
		if(current.status !== 200)
			throw new Error(`Current location fetching error ${current.status}`)
		const [ type, place ] = (current.data.name || '').split(', ')
		_data.current = { ...current.data, type, place }

		console.log('Fetching forecast ...')
		const forecast = await axios.get(config.urlTimeline)
		if(forecast.status !== 200)
			throw new Error(`Forecast fetching error ${forecast.status}`)
		_data.forecast = forecast.data
	}catch(err) {
		error++
		console.log(err)
	}

	return _data
}

const updateData =async ()=> {
	const data = await fetchData()

	console.log(`Dependent on errors = ${error}, saving file ...`)
	if(!error) {
		console.log('Saving updated data:', data)
		fs.writeFile("data.json", JSON.stringify(data), 'utf8', (err) => {
			if(err) {
				console.log("Error while serializing data.", err)
			}
			console.log('File successfully saved')
		})
	}
}

updateData()