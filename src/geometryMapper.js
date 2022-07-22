/*eslint-env node*/
const BimServiceClient = require('./bimServiceClient')
const HeadlessViewer = require('./headlessViewer')
const { intersectsBox, Vector, Box, Point } = require('./helpers')


class GeometryMapper {
  /**
   *
   * @param {*} architectureModelId exon model id
   * @param {*} engineeringModelId
   */
  constructor(projectId, architectureModelId, engineeringModelId, bimServiceUrl) {
    this.projectId = projectId
    this.architectureModelId = architectureModelId
    this.engineeringModelId = engineeringModelId
    this.bimServiceUrl = bimServiceUrl
    this.headlessViewer = new HeadlessViewer(bimServiceUrl)
  }

  /**
   * Returns object with elementIds as keys and corresponding spaceIds as values
   *
   * @returns {{
   * [elementId]: string,
   * }}
   */
  async mapElementsToSpaces() {
    this.page = await this.headlessViewer.launch(this.projectId, this.architectureModelId, this.engineeringModelId, this.bimServiceUrl)

    console.log('Initializing BimServiceClient')
    const bimServiceClient = new BimServiceClient(this.bimServiceUrl)
    console.log('Fetching spaces and elements info')
    const spaces = await bimServiceClient.getAttributes(this.architectureModelId, { 'Category': 'IfcSpace' })
    const elements = await bimServiceClient.getAttributes(this.engineeringModelId, {
      'Category': {
        '$nin': [
          'IfcDistributionPort',
          'IfcBuildingStorey'
        ]
      },
      '$or': [
        {
          'Attributes.Прочее (IFC Type).Категория': 'Оборудование'
        },
        {
          'Attributes.Прочее.Категория': 'Оборудование'
        },
        {
          'Attributes.Прочее.id_Vyzhimov': {
            '$exists': true
          }
        },
        {
          'Attributes.Текст.Technological_map': {
            '$exists': true
          }
        },
        {
          'Attributes.Текст.МСК_Код по классификатору': {
            '$in': [
              'ЭЛ 40 55 20',
              'ЭЛ 40 55 10',
              'ЭЛ 40 50 60',
              'ЭЛ 40 50 50',
              'ЭЛ 40 50 30',
              'ЭЛ 40 50 20',
              'ЭЛ 40 50 10',
              'ЭЛ 40 30 20',
              'ЭЛ 40 25 10',
              'ЭЛ 40 20 50'
            ]
          }
        }
      ]
    })
    console.log('Fetching done')

    const elementsData = await Promise.all(elements.map(async ({ elementId }) => ({
      elementId,
      bbox: await this.headlessViewer.getElementBoundingBox(elementId)
    })))

    const spacesData = await Promise.all(spaces.map(async ({ elementId }) => ({
      elementId,
      bbox: await this.headlessViewer.getElementBoundingBox(elementId),
    })))

    // map elements to spaces and filter multiple spaces inclusion
    let mappedElementsCount = 0
    elementsData.forEach(({ bbox: elementBbox, spaceId: elementSpaceId, spaceVectorLength }, index, array) => {
      process.stdout.write(`Mapping 1/2 - ${index}/${array.length - 1}${index < array.length - 1 ? '\r' : '\n'}`)
      // const elementArchStoreyIfcGuid = this.getElementArchStoreyElementId(element, this.archStoreys)
      // element.architectureStoreyIfcGuid = this.getStoreyMinusOne(elementArchStoreyIfcGuid, this.archStoreys)

      spacesData.forEach(({ elementId: spaceId, bbox: spaceBbox }) => {
        if (intersectsBox(spaceBbox, elementBbox)) {
          // if (element.architectureStoreyIfcGuid) {
          // 	delete element.architectureStoreyIfcGuid
          // }
          if (elementSpaceId) {
            const existingSpaceVectorLength = spaceVectorLength
            const newSpaceVector = new Vector(spaceBbox.min, spaceBbox.max)

            if (newSpaceVector.length < existingSpaceVectorLength) {
              elementSpaceId = spaceId
              spaceVectorLength = newSpaceVector.length
            }
          } else {
            elementSpaceId = spaceId
            mappedElementsCount++

            const spaceVector = new Vector(spaceBbox.min, spaceBbox.max)
            spaceVectorLength = spaceVector.length
          }
        }
      })

      delete elementsData[index].bbox
      delete elementsData[index].spaceVectorLength
    })
    console.log(`Mapped ${mappedElementsCount}/${elements.length} elements to spaces`)

    // // map spaces to elements
    // let spacesWithElementsCount = 0
    // spacesData.forEach((space, index, array) => {
    // 	process.stdout.write(`Mapping 2/2 - ${index}/${array.length -1 }${index < array.length - 1 ? '\r' : '\n'}`)
    // 	space.elementObjectIds = []
    // 	elementsData.forEach((element) => {
    // 		if (element.spaceObjectId === space.objectid) {
    // 			space.elementObjectIds.push(element.objectid)
    // 		}
    // 	})
    // 	if (space.elementObjectIds.length) {
    // 		spacesWithElementsCount++
    // 	}
    // })
    // console.log(`Found ${spacesWithElementsCount}/${spaces.length} spaces with elements`)

    this.headlessViewer.shutdown()

    return { elementsData }
  }

  // /**
  //  * Calculates element architecture storey's elementId by elevation
  //  * @param {number} elementElevation
  //  * @param {{ elevation: string, elementId: string }[]} storeys
  //  * @returns {string} elementId or '' if element is lower than a the lowest architecture storey's elevation
  //  */
  // getElementArchStoreyElementId(elementElevation, storeys) {
  // 	for (let i = 0; i < storeys.length; i++) {
  // 		const currentStorey = storeys[i]
  // 		const nextStorey = storeys[i + 1] || null
  // 		const currentStoreyElevation = parseFloat(currentStorey.elevation)
  // 		const nextStoreyElevation = nextStorey ? parseFloat(nextStorey.elevation) : null
  // 		if (nextStoreyElevation === null) {
  // 			return currentStorey.ifcGuid
  // 		} else {
  // 			if (elementElevation >= currentStoreyElevation && elementElevation < nextStoreyElevation) {
  // 				return currentStorey.ifcGuid
  // 			}
  // 		}
  // 	}
  // 	return '' // element is lower than a the lowest architecture storey elevation
  // }

  // /**
  //  * // TODO del this workaround
  //  * workaround for element <-> arch story mapping: there is a problem that the storey is always
  //  * 1 section higher than the needed one
  //  */
  // getStoreyMinusOne(ifcGuid, storeys) {
  // 	const storeyIndex = storeys.findIndex((storey) => storey.ifcGuid === ifcGuid)
  // 	const getStoreyIndexLowerWithSpaces = (storeyIndex) => {
  // 		if (storeyIndex === 0) {
  // 			return storeyIndex
  // 		}
  // 		return storeys[storeyIndex - 1].haveSpaces ? storeyIndex - 1 : getStoreyIndexLowerWithSpaces(storeyIndex - 1)
  // 	}

  // 	const indexMinusOne = getStoreyIndexLowerWithSpaces(storeyIndex)
  // 	return storeys[indexMinusOne].ifcGuid
  // }
}

module.exports = GeometryMapper