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

const defaultKeys = [
  21, 22, 23, 24, 31, 32, 33, 41, 42, 43, 44, 45, 46, 47, 51, 52, 53, 61, 62,
  63, 64, 65, 66, 67, 111, 112, 113, 114, 121, 122, 123, 124,
]
const areaId2021Excel = async (fileList, extra) => {
  const ld20List = {
    keys: defaultKeys,
    info: [],
    title: 'dt2020',
  }
  const ld21List = {
    keys: defaultKeys,
    info: [],
    title: 'dt2021',
  }
  common2021Excel(fileList, ld20List, 0, extra)
  common2021Excel(fileList, ld21List, 1, extra)
  self.postMessage({
    key: 'areaId2021Excel',
    type: 'data',
    data: {
      ld20List,
      ld21List,
    },
  })
}

const common2021Excel = (fileList, resultInfo, index, extra) => {
  const ldKeys = [
    ['ld20', 'ld21'],
    ['ld2020', 'ld2021'],
    ['f2020', 'f2021'],
  ]
  if (extra.keys) {
    ldKeys.push(extra.keys.split(','))
  }
  fileList.forEach(({ buffer, fileId }) => {
    // 每个文件
    const workbook = self.XLSX.read(buffer, {
      type: 'buffer',
    })
    const obj = {
      fileId,
    }
    workbook.SheetNames.forEach(sheetName => {
      const res = self.XLSX.utils.sheet_to_row_object_array(
        workbook.Sheets[sheetName]
      )
      console.log(`xlsx to JSON:`, fileId, res.length, JSON.stringify(ldKeys))
      if (res.length > 0) {
        res.forEach(item => {
          const curKey = ldKeys.find(keys =>
            Object.keys(item).some(k => keys.includes(k.toLowerCase()))
          )
          console.log(curKey)
          curKey && formatLdInfo(item, curKey[index], resultInfo, obj, fileId)
        })
      }
      resultInfo.info.push(obj)
      const progress = Math.floor(
        (index * 0.5 + (resultInfo.info.length / fileList.length) * 0.5) * 100
      )
      self.postMessage({
        key: 'areaId2021Excel',
        type: 'message',
        data: `当前处理进度: ${progress}%`,
      })
      console.log(`当前处理进度: ${progress}%`)
    })
  })
  resultInfo.info = resultInfo.info.sort((a, b) => a.fileId - b.fileId)
  return resultInfo
}

const formatLdInfo = (data, sheetKey, container, obj, fileId) => {
  let ldKey =
    data[sheetKey] ||
    data[sheetKey.toUpperCase()] ||
    data[
      sheetKey.replace(/^\S/, function (s) {
        return s.toUpperCase()
      })
    ]
  ldKey =
    String(ldKey).length === 6
      ? String(ldKey).substring(0, 3).replace(/^0+/, '').replace(/0+$/, '')
      : Math.floor(Number(ldKey))
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
  let areaKey = ''
  areaKey = Object.keys(data).find(key => {
    return key.toLowerCase() === 'area'
  })
  if (!areaKey) {
    areaKey = Object.keys(data).find(key => {
      return key.toLowerCase().includes('area')
    })
  }
  if (areaKey) {
    return areaKey
  } else {
    throw Error('找不到areaKey')
  }
}

self.addEventListener(
  'message',
  function (e) {
    const { key, data, extra } = e.data
    if (key === 'id_excel') {
      IdXlsxToJSON(data)
    } else if (key === 'areaId2021Excel') {
      areaId2021Excel(data, extra)
    }
    // self.postMessage('You said: ' + e.data);
  },
  false
)
