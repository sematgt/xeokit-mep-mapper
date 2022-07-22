const projectId = getQueryParam('projectId')
const architectureModelId = getQueryParam('architectureModelId')
const engineeringModelId = getQueryParam('engineeringModelId')
const bimServiceUrl = getQueryParam('bimServiceUrl')
launchViewer(projectId, architectureModelId, engineeringModelId, bimServiceUrl)

function launchViewer(projectId, architectureModelId, engineeringModelId, bimServiceUrl) {
	// eslint-disable-next-line no-undef
	const server = new Server({
		dataDir: `${ bimServiceUrl }/xeokit`,
	})

	// eslint-disable-next-line no-undef
	const bimViewer = new BIMViewer(server, {
		canvasElement: document.getElementById('myCanvas'), // WebGL canvas
		keyboardEventsElement: document.getElementById('myCanvas'), // Optional, defaults to canvasElement
		explorerElement: document.getElementById('myExplorer'), // Left panel
		toolbarElement: document.getElementById('myToolbar'), // Toolbar
		inspectorElement: document.getElementById('myInspector'), // Right panel
		navCubeCanvasElement: document.getElementById('myNavCubeCanvas'),
		busyModelBackdropElement: document.getElementById('myViewer'),
	})

	this.bimViewer = bimViewer
	this.server = server
	const viewerDiv = document.getElementById('myViewer')
	return new Promise((resolve, reject) => {
		bimViewer.loadProject(projectId, resolve, reject)
			.then(() => {
				console.log(`Project ${ projectId } is loaded successfully`)
				viewerDiv.classList.add('models-loaded')
			})
			.catch((error) => {
				throw new Error('There was an error loading this project: ' + projectId + error)
			})
	})
}

function getQueryParam(name, url) {
	if (!url) url = window.location.href
	name = name.replace(/[[\]]/g, '\\$&')
	var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
		results = regex.exec(url)
	if (!results) return null
	if (!results[ 2 ]) return ''
	return decodeURIComponent(results[ 2 ].replace(/\+/g, ' '))
}