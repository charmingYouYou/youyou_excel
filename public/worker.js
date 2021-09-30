console.log('start')
self.importScripts(
  'https://cdn.jsdelivr.net/npm/xlsx@0.16.9/dist/xlsx.full.min.js'
)

const IdXlsxToJSON = async data => {
  const LD2020List = []
  const areaJSON = []
  data.forEach(({ buffer, fileId }) => {
    const workbook = self.XLSX.read(buffer, {
      type: 'buffer',
    })
    workbook.SheetNames.forEach(sheetName => {
      const res = self.XLSX.utils.sheet_to_row_object_array(
        workbook.Sheets[sheetName]
      )
      const obj = {
        fileId,
      }
      console.log(`xlsx to JSON:`, res.length)
      if (res.length > 0) {
        res.forEach(item => {
          if (!LD2020List.includes(String(item['LD2020']))) {
            console.log(item['LD2020'], fileId)
            LD2020List.push(String(item['LD2020']))
          }
          obj[item['LD2020']] = item.SHAPE_AREA || item.AREA
        })
      } else {
        obj.areaLength = 0
        obj.areaSum = 0
      }
      areaJSON.push(obj)
      self.postMessage({
        key: 'id_excel',
        type: 'message',
        data: `当前处理进度: ${areaJSON.length}/${data.length}`,
      })
      console.log(`当前处理进度: ${areaJSON.length}/${data.length}`)
      console.log(`当前处理结果: `, obj)
    })
  })
  self.postMessage({
    key: 'id_excel',
    type: 'data',
    data: {
      LD2020List,
      areaJSON,
    },
  })
}

self.addEventListener(
  'message',
  function (e) {
    const { key, data } = e.data
    if (key === 'id_excel') {
      IdXlsxToJSON(data)
    }
    // self.postMessage('You said: ' + e.data);
  },
  false
)
