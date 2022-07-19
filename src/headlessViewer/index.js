const path = require('path')
const fs = require('fs')
// const { Box3 } = require('@types/three')
const puppeteer = require('puppeteer')


class HeadlessViewer {
  /**
   * 
   * @param {string} architectureModelId 
   * @param {string} engineeringModelId
   * @returns {Promise<puppeteer.Page>} page
   */
  async launch(architectureModelId, engineeringModelId) {
    // Using the workaround to run chrome with
    // WebGL enabled
    this.browser = await puppeteer.launch({
      dumpio: true,
      headless: false,
      args: [
        '--hide-scrollbars',
        '--mute-audio',
        '--headless',
        '--no-sandbox',
      ]
    })

    // assumes files are in ./test relative directory
    // chrome doesn't support relative path
    const filename = path.resolve(__dirname, './page/viewer.html')

    const url = `file://${filename}?architectureModelId=${architectureModelId}&engineeringModelId=${engineeringModelId}`
      
    this.page = await this.browser.newPage()
    this.page.on('error', (error) => console.log(error.message))
    this.page.on('console', (msg) => {
      for (let i = 0; i < msg.args().length; ++i)
      console.log(`${i}: ${msg.args()[i]}`)
    })

    await this.page.goto(url)
    console.log({ url })
    if (!fs.existsSync(`./screenshots`)){
      fs.mkdirSync(`./screenshots`)
    }
    this.page.screenshot({ path: `./screenshots/${new Date()}.png` })
    // waits for .geometry-loaded class being added
    await this.page.mainFrame().waitForSelector(
      'div#myViewer.models-loaded', {
        timeout: 300000
      }).then(() => this.page.screenshot({ path: `./screenshots/${new Date()}.png` }))
      
    return this.page
  }

  shutdown() {
    this.browser.close()
  }

    /**
   * 
   * @param {string} objectid 
   * @param {string} modelUrn 
   * @returns {Box3}
   */
     getElementBoundingBox(elementId) {
      return this.page.evaluate((objectid, modelUrn) => {
        const model = window.NOP_VIEWER.models.find((model) => model.model.myData.urn === modelUrn.slice(4))
        window.NOP_VIEWER.select([ objectid ], model.model)
        return window.NOP_VIEWER.utilities.getBoundingBox()
      }, objectid, modelUrn)
    }
}

module.exports = HeadlessViewer