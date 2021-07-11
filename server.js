const express = require('express')
const cors = require('cors')
const axios = require('axios')
const bodyParser = require('body-parser')
const path = require('path')
const compression = require('compression')
const enforce = require('express-sslify')


// Niitykumpu: bb50f09c-03e7-4410-a37a-79e1bb0b837c
const config = {
	urlLocations: 'https://visits.fressi24.fi/api/v1/locations?operator=d0f2d7cc-e7b4-4eb1-b979-910f772e3e3f',
	urlDetails: 'https://visits.fressi24.fi/api/v1/locations/{id}/current',
	urlTimeline: 'https://visits.fressi24.fi/api/v1/locations/{id}/timeline'
}

// TODO: Mem-cache
let cacheLocations = false

if(process.env.NODE_ENV !== 'production') require('dotenv').config()

const app = express()
const port = process.env.PORT || 5000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())

if(process.env.NODE_ENV === 'production') {
	app.use(compression())
	app.use(enforce.HTTPS({ trustProtoHeader: true }))
	app.use(express.static(path.join(__dirname, 'client/build')))
	app.get('*', (req, res) => {
		res.sendFile(path.join(__dirname, 'client/build', 'index.html'))
	})
}

app.listen(port, error => {
	if(error) throw error
	console.log('Server running on port ', port)
})

app.get('/ping', (req, res) => {
	res.status(200).send({ hello: 'world' })
})

const requestRemote =(res, targetUrl, responseDataHandler)=> {
	// tbd
}

app.get('/locations', (req, res) => {
	if(cacheLocations) {
		res.status(200).send(cacheLocations)
		return
	}

	axios.get(config.urlLocations)
		.then(response => {
			if(response.status === 200) {
				cacheLocations = (response.data || []).map(({id, name}) => {
					const [ type, place ] = name.split(', ')
					return { id, place, type }
				})
				res.status(200).send(cacheLocations)
			}else {
				const error = { message: 'could not get data from remote' }
				console.error(error)
				res.status(500).send(error)
			}
		}).catch(error => {
			console.error(error)
			res.status(500).send(error)
		})
})

app.get('/occupancy/:locationId', (req, res) => {
	const { locationId } = req.params
	if(!locationId) {
		res.status(500).send({ message: 'no data supplied' })
		return
	}

	axios.get(config.urlDetails.replace('{id}', locationId))
		.then(({data, status}) => {
			if(status === 200) {
				const [ type, place ] = (data.name || '').split(', ')
				res.status(200).send({...data, type, place })
			}else {
				const error = { message: 'could not get data from remote' }
				console.error(error)
				res.status(500).send(error)
			}
		}).catch(error => {
			console.error(error)
			res.status(500).send(error)
		})
})

app.get('/forecast/:locationId', (req, res) => {
	const { locationId } = req.params

	axios.get(config.urlTimeline.replace('{id}', locationId))
		.then(response => {
			if(response.status === 200) {
				res.status(200).send(response.data)
			}else {
				const error = { message: 'could not get data from remote' }
				console.error(error)
				res.status(500).send(error)
			}
		}).catch(error => {
			console.error(error)
			res.status(500).send(error)
		})
})