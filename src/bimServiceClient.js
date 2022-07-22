const request = require('request')


class BimServiceClient {
	constructor(url) {
		this.url = url
	}

	async getAttributes(exonModelId, queryJson) {
		const ops = {
			method: 'POST',
			url: this.url + `/models/${ exonModelId }/attributes`,
			body: JSON.stringify(queryJson || {}),
		}

		return new Promise((resolve, reject) => request(ops, function (error, response, body) {
			if (error) {
				console.log('error', error)
				reject(error)
			} else {
				resolve(JSON.parse(body))
			}
		}))


	}
}

module.exports = BimServiceClient