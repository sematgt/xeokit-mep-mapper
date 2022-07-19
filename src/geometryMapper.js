const BimServiceClient = require('./bimServiceClient')
const HeadlessViewer = require('./headlessViewer')
const { intersectsBox, Vector } = require('./helpers')


class GeometryMapper {
  /**
   * 
   * @param {*} architectureModelId exon model id
   * @param {*} engineeringModelId
   */
  constructor(architectureModelId, engineeringModelId, bimServiceUrl) {
    this.architectureModelId = architectureModelId
    this.engineeringModelId = engineeringModelId
    this.bimServiceUrl = bimServiceUrl
    this.viewer = new HeadlessViewer(bimServiceUrl)
  }

  /**
   * Returns object with elementIds as keys and corresponding spaceIds as values
   * 
   * @returns {{
   * [elementId]: string,
   * }}
   */
  async mapElementsToSpaces() {
    this.page = await this.viewer.launch(this.architectureModelId, this.engineeringModelId)

    const bimServiceClient = new BimServiceClient(this.bimServiceUrl)
    const spaces = await bimServiceClient.getAttributes(this.architectureModelId, { 'Category': 'IfcSpace' })
    const elements = await bimServiceClient.getAttributes(this.engineeringModelId, {
      "Category": {
        "$nin": [
          "IfcDistributionPort",
          "IfcBuildingStorey"
        ]
      },
      "$or": [
        {
          "Attributes.Прочее (IFC Type).Категория": "Оборудование"
        },
        {
          "Attributes.Прочее.Категория": "Оборудование"
        },
        {
          "Attributes.Прочее.id_Vyzhimov": {
            "$exists": true
          }
        },
        {
          "Attributes.Текст.Technological_map": {
            "$exists": true
          }
        },
        {
          "Attributes.Текст.МСК_Код по классификатору": {
            "$in": [
              "ЭЛ 40 55 20",
              "ЭЛ 40 55 10",
              "ЭЛ 40 50 60",
              "ЭЛ 40 50 50",
              "ЭЛ 40 50 30",
              "ЭЛ 40 50 20",
              "ЭЛ 40 50 10",
              "ЭЛ 40 30 20",
              "ЭЛ 40 25 10",
              "ЭЛ 40 20 50"
            ]
          }
        }
      ]
    })
    console.log({ spaces, elements })
    // const elementBboxes = await Promise.all(this.elements.map((element) =>
    //   this.viewer.getElementBoundingBox(element.objectid, this.engineeringModelId)))

    // const spaceBboxes = await Promise.all(this.spaces.map((space) =>
    //   this.viewer.getElementBoundingBox(space.objectid, this.architectureModelId)))

    // const elements = this.elements.map((element, index) => {
    //   return { ...element, bbox: elementBboxes[index] }
    // })
    // const spaces = this.spaces.map((space, index) => {
    //   return { ...space, bbox: spaceBboxes[index] }
    // })

    // // map elements to spaces and filter multiple spaces inclusion
    // let mappedElementsCount = 0
    // elements.forEach((element, index, array) => {
    //   process.stdout.write(`Mapping 1/2 - ${index}/${array.length - 1}${index < array.length - 1 ? '\r' : '\n'}`)
    //   const { bbox: elementBbox } = element

    //   const elementArchStoreyIfcGuid = this.getElementArchStoreyifcGuid(element, this.archStoreys)
    //   element.architectureStoreyIfcGuid = this.getStoreyMinusOne(elementArchStoreyIfcGuid, this.archStoreys)

    //   spaces.forEach((space) => {
    //     const { bbox: spaceBbox } = space
        
    //     if (intersectsBox(spaceBbox, elementBbox)) {
    //       if (element.architectureStoreyIfcGuid) {
    //         delete element.architectureStoreyIfcGuid
    //       }

    //       if (element.spaceObjectId) {
    //         const existingSpaceVectorLength = element.spaceVectorLength
    //         const newSpaceVector = new Vector(spaceBbox.min, spaceBbox.max)
            
    //         if (newSpaceVector.length < existingSpaceVectorLength) {
    //           element.spaceObjectId = space.objectid
    //           element.spaceIfcGuid = space.ifcGuid
    //           element.spaceVectorLength = newSpaceVector.length
    //         }
    //       } else {
    //         element.spaceObjectId = space.objectid
    //         element.spaceIfcGuid = space.ifcGuid
    //         mappedElementsCount++

    //         const spaceVector = new Vector(spaceBbox.min, spaceBbox.max)
    //         element.spaceVectorLength = spaceVector.length
    //       }
    //     }
    //   })

    //   delete element.bbox
    //   delete element.spaceVectorLength
    // })
    // console.log(`Mapped ${mappedElementsCount}/${elements.length} elements to spaces`)

    // // map spaces to elements
    // let spacesWithElementsCount = 0
    // spaces.forEach((space, index, array) => {
    //   process.stdout.write(`Mapping 2/2 - ${index}/${array.length -1 }${index < array.length - 1 ? '\r' : '\n'}`)
    //   space.elementObjectIds = []
    //   elements.forEach((element) => {
    //     if (element.spaceObjectId === space.objectid) {
    //       space.elementObjectIds.push(element.objectid)
    //     }
    //   })
    //   if (space.elementObjectIds.length) {
    //     spacesWithElementsCount++
    //   }
    // })
    // console.log(`Found ${spacesWithElementsCount}/${spaces.length} spaces with elements`)

    // this.viewer.shutdown()

    // return { elements, spaces }
  }

  /**
   * Calculates element architecture storey ifcGuid by elevation
   * @param {{ elevation: string }} element 
   * @param {{ elevation: string, ifcGuid: string }[]} storeys
   * @returns {string} ifcGuid or '' if element is lower than a the lowest architecture storey elevation
   */
  getElementArchStoreyifcGuid(element, storeys) {
    for (let i = 0; i < storeys.length; i++) {
      const elementElevation = parseFloat(element.elevation)
      const currentStorey = storeys[i]
      const nextStorey = storeys[i + 1] || null
      const currentStoreyElevation = parseFloat(currentStorey.elevation)
      const nextStoreyElevation = nextStorey ? parseFloat(nextStorey.elevation) : null
      if (nextStoreyElevation === null) {
        return currentStorey.ifcGuid
      } else {
        if (elementElevation >= currentStoreyElevation && elementElevation < nextStoreyElevation) {
          return currentStorey.ifcGuid
        }
      }
    }
    return '' // element is lower than a the lowest architecture storey elevation
  }

  /** 
   * // TODO del this workaround 
   * workaround for element <-> arch story mapping: there is a problem that the storey is always
   * 1 section higher than the needed one
   */
  getStoreyMinusOne(ifcGuid, storeys) {
    const storeyIndex = storeys.findIndex((storey) => storey.ifcGuid === ifcGuid)
    const getStoreyIndexLowerWithSpaces = (storeyIndex) => {
      if (storeyIndex === 0) {
        return storeyIndex
      }
      return storeys[storeyIndex - 1].haveSpaces ? storeyIndex - 1 : getStoreyIndexLowerWithSpaces(storeyIndex - 1)
    }

    const indexMinusOne = getStoreyIndexLowerWithSpaces(storeyIndex)
    return storeys[indexMinusOne].ifcGuid
  }
}

module.exports = GeometryMapper