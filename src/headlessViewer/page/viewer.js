import xeokit from './lib/xeokit-bim-viewer.min.amd.js'


const architectureModelId = getQueryParam('architectureModelId')
const engineeringModelId = getQueryParam('engineeringModelId')
const bimServiceUrl = getQueryParam('bimServiceUrl')
launchViewer(architectureModelId, engineeringModelId, bimServiceUrl)

function launchViewer(architectureModelId, engineeringModelId, bimServiceUrl) {
  const { BIMViewer, Server } = xeokit

  const server = new Server({
    dataDir: `${ bimServiceUrl }/xeokit`,
  })

  const bimViewer = new BIMViewer(server, {
    canvasElement: document.getElementById("myCanvas"), // WebGL canvas
    // keyboardEventsElement: document.getElementById("myCanvas"), // Optional, defaults to canvasElement
    // explorerElement: document.getElementById("myExplorer"), // Left panel
    // toolbarElement: document.getElementById("myToolbar"), // Toolbar
    // inspectorElement: document.getElementById("myInspector"), // Right panel
    // navCubeCanvasElement: document.getElementById("myNavCubeCanvas"),
    busyModelBackdropElement: document.getElementById("myViewer"),
  })

  this.bimViewer = bimViewer
  this.server = server
  const viewerDiv = document.getElementById('myViewer')
  return Promise.all([ architectureModelId, engineeringModelId ].map((modelId) => (
    new Promise((resolve, reject) => {
      bimViewer.loadModel(modelId,
        () => {
          console.log(`Model ${modelId} is loaded successfully`)
          resolve()
        },
        (errMsg) => {
          console.log('There was an error loading this model: ' + modelId + errMsg)
          reject(errMsg)
        })
    })
  ))).then(() => viewerDiv.classList.add('models-loaded'))
}

function getQueryParam(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
  results = regex.exec(url);
  if (!results) return null;
  if (!results[ 2 ]) return '';
  return decodeURIComponent(results[ 2 ].replace(/\+/g, ' '));
}