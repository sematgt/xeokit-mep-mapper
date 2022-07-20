const GeometryMapper = require('./src/geometryMapper')


const mapper = new GeometryMapper('62c74edcd12e50fb16153c91', '62c74f61d12e50fb16153dd6', 'http://exploit-bim-gaskar-dev.gaskar.group:9085/api')
	
mapper.mapElementsToSpaces()