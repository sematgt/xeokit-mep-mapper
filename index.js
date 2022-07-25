/*eslint-env node*/
const http = require('http')
const GeometryMapper = require('./src/geometryMapper')


const host = 'localhost'
const port = 8000

const requestListener = async (req, res) => {
  if (req.url === '/api/mapping' && req.method === 'POST') {
    const requestData = await new Promise((resolve, reject) => {
      let requestString = ''
      req.on('data', chunk => requestString += chunk)
      req.on('end', () => resolve(JSON.parse(requestString)))
      req.on('error', (error) => {
        throw new Error('Failed to parse request body:', error)
      })
    })

    const { projectId, architectureModelId, engineeringModelId, bimServiceUrl } = requestData
    const mapper = new GeometryMapper(projectId, architectureModelId, engineeringModelId, bimServiceUrl)
    const mappingData = await mapper.mapElementsToSpaces()

    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)
    res.end(mappingData)
  } else {
    res.writeHead(400)
    res.end('Not found')
  }
}

const server = http.createServer(requestListener)
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`)
})