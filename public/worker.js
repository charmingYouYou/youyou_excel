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

const areaId2021Excel = async data => {
  const ld20List = {
    keys: [],
    info: [],
    title: 'dt2020'
  }
  const ld21List = {
    keys: [],
    info: [],
    title: 'dt2021'
  }
  const ldKeys = [
    ['ld20', 'ld21'],
    ['ld2020', 'ld2021'],
  ]
  data.forEach(({ buffer, fileId }) => {
    // 每个文件
    const workbook = self.XLSX.read(buffer, {
      type: 'buffer',
    })
    const obj20 = {
      fileId,
    }
    const obj21 = {
      fileId,
    }
    workbook.SheetNames.forEach(sheetName => {
      const res = self.XLSX.utils.sheet_to_row_object_array(
        workbook.Sheets[sheetName]
      )
      console.log(`xlsx to JSON:`, fileId, res.length)
      if (res.length > 0) {
        res.forEach(item => {
          const curKey = ldKeys.find(keys => {
            return Object.keys(item).some(k => keys.includes(k.toLowerCase()))
          })
          if (curKey) {
            formatLdInfo(item, curKey[0], ld20List, obj20, fileId)
            formatLdInfo(item, curKey[1], ld21List, obj21, fileId)
          }
        })
      }
      ld20List.info.push(obj20)
      ld21List.info.push(obj21)
      self.postMessage({
        key: 'areaId2021Excel',
        type: 'message',
        data: `当前处理进度: ${ld21List.info.length}/${data.length}`,
      })
      console.log(`当前处理进度: ${ld21List.info.length}/${data.length}`)
    })
  })
  ld20List.keys = ld20List.keys.sort((a, b) => a - b)
  ld21List.keys = ld21List.keys.sort((a, b) => a - b)
  ld20List.info = ld20List.info.sort((a, b) => a.fileId - b.fileId)
  ld21List.info = ld21List.info.sort((a, b) => a.fileId - b.fileId)
  console.log(`当前处理结果: `, ld20List, ld21List)
  self.postMessage({
    key: 'areaId2021Excel',
    type: 'data',
    data: {
      ld20List,
      ld21List,
    },
  })
}

const formatLdInfo = (data, sheetKey, container, obj, fileId) => {
  let ldKey = data[sheetKey]
  if (String(ldKey).length === 6) {
    ldKey = String(ldKey).substring(0, 3).replace('0', '')
  }
  if (ldKey) {
    if (!container.keys.includes(ldKey)) {
      container.keys.push(ldKey)
    }
    if (!obj[ldKey]) {
      obj[ldKey] = 0
    }
    const areaKey = findAreaKey(data)
    if (areaKey) {
      obj[ldKey] += Number(data[areaKey])
    }
  } else {
    if (fileId.startsWith('110')) {
      formatLdInfo(data, `dt${fileId}id`, container, obj, fileId)
    }
  }
}

const findAreaKey = data => {
  return Object.keys(data).find(key => {
    return key.toLowerCase().includes('area')
  })
}

self.addEventListener(
  'message',
  function (e) {
    const { key, data } = e.data
    if (key === 'id_excel') {
      IdXlsxToJSON(data)
    } else if (key === 'areaId2021Excel') {
      areaId2021Excel(data)
    }
    // self.postMessage('You said: ' + e.data);
  },
  false
)
