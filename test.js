/*eslint-env node*/
const GeometryMapper = require('./src/geometryMapper')


const mapper = new GeometryMapper('ggid6654-a49f-4cdb-b070-6403a5bd8fd3', '62c74edcd12e50fb16153c91', '62c74f5fd12e50fb16153da0', 'http://exploit-bim-gaskar-dev.gaskar.group:9085/api');

(async () => {
  const { elementsData } = await mapper.mapElementsToSpaces()
  console.log(elementsData)
})()
