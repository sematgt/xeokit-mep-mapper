/*eslint-env node*/
const path = require('path')
const puppeteer = require('puppeteer')


class HeadlessViewer {
  /**
   *
   * @param {string} architectureModelId
   * @param {string} engineeringModelId
   * @param {string} bimServiceUrl
   * @returns {Promise<puppeteer.Page>} page
   */
  async launch(projectId, architectureModelId, engineeringModelId, bimServiceUrl) {
    // Using the workaround to run chrome with
    // WebGL enabled
    this.browser = await puppeteer.launch({
      dumpio: true,
      headless: false,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: [
        '--hide-scrollbars',
        '--mute-audio',
        '--headless',
        '--no-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
      ]
    })

    // assumes files are in ./test relative directory
    // chrome doesn't support relative path
    const filename = path.resolve(__dirname, './page/viewer.html')

    const url = `file://${filename}?projectId=${projectId}&architectureModelId=${architectureModelId}&engineeringModelId=${engineeringModelId}&bimServiceUrl=${bimServiceUrl}`

    this.page = await this.browser.newPage()
    this.page.on('error', (error) => {
      console.log('Got error, closing browser: ', error.message)
      this.browser.close()
    })
    this.page.on('console', (msg) => {
      for (let i = 0; i < msg.args().length; ++i)
        console.log(`${i}: ${msg.args()[i]}`)
    })

    await this.page.goto(url)
    console.log({ url })
    // if (!fs.existsSync('./screenshots')){
    //   fs.mkdirSync('./screenshots')
    // }
    // waits for .geometry-loaded class being added
    await this.page.mainFrame().waitForSelector(
      'div#myViewer.models-loaded', {
        timeout: 200000,
      })
      // .then(() => this.page.screenshot({ path: `./screenshots/${new Date()}-success.png` }))
      .catch((error) => {
        console.error(error)
        this.browser.close()
      })

    return this.page
  }

  shutdown() {
    this.browser.close()
  }

  /**
   *
   * @param {string} elementId
   * @returns {Box3}
   */
  getElementBoundingBox(elementId) {
    return this.page.evaluate((elementId) => {
      const metaObject = window.bimViewer.viewer.metaScene.metaObjects[elementId]
      const objectId = metaObject.id
      const objectIds = window.bimViewer.viewer.metaScene.getObjectIDsInSubtree(objectId)   // IDs of leaf sub-objects
      const aabb = window.bimViewer.viewer.scene.getAABB(objectIds)

      const [ x1, y1, z1, x2, y2, z2 ] = aabb
      const vector1 = new window.THREE.Vector3(x1, y1, z1)
      const vector2 = new window.THREE.Vector3(x2, y2, z2)
      const bbox = new window.THREE.Box3(vector1, vector2)
      return bbox
    }, elementId)
  }
}

module.exports = HeadlessViewer