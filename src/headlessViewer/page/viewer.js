import xeokit from './lib/xeokit-bim-viewer.min.amd.js'


const architectureModelId = getQueryParam('architectureModelId')
const engineeringModelId = getQueryParam('engineeringModelId')
launchViewer(architectureModelId, engineeringModelId)

function launchViewer(architectureModelId, engineeringModelId) {
  const { BIMViewer, Server } = xeokit
  const { value: building } = await object.getValueAsync('exonProjectId')
  const BIM_SERVICE_URL_ALIAS = 'ggidf291-2c33-4e3f-ae6f-ceec2e0f8b4b'
  const bimServiceUrl = await object.factory.getSettings(BIM_SERVICE_URL_ALIAS)

  const server = new Server({
    dataDir: `${ bimServiceUrl }/xeokit`,
  })

  const bimViewer = new BIMViewer(server, {
    // canvasElement: document.getElementById("myCanvas"), // WebGL canvas
    // keyboardEventsElement: document.getElementById("myCanvas"), // Optional, defaults to canvasElement
    // explorerElement: document.getElementById("myExplorer"), // Left panel
    // toolbarElement: document.getElementById("myToolbar"), // Toolbar
    // inspectorElement: document.getElementById("myInspector"), // Right panel
    // navCubeCanvasElement: document.getElementById("myNavCubeCanvas"),
    busyModelBackdropElement: document.getElementById("myViewer"),
  })

  // bimViewer.bimViewer._propertiesInspector.showObjectPropertySets = this.showObjectPropertySets
  this.bimViewer = bimViewer
  this.server = server
  const viewerDiv = document.getElementById('myViewer')
  return new Promise((resolve, reject) => {
    bimViewer.loadProject(building,
      () => {
        console.log('The project is loaded successfully')
        viewerDiv.classList.add('models-loaded')
        resolve()
      },
      (errMsg) => {
        console.log('There was an error loading this project: ' + errMsg)
        reject(errMsg)
      })
  })
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