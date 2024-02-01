class Ld2021Excel {
  defaultKeys = [
    21, 22, 23, 24, 31, 32, 33, 41, 42, 43, 44, 45, 46, 47, 51, 52, 53, 61, 62,
    63, 64, 65, 66, 67, 111, 112, 113, 114, 121, 122, 123, 124,
  ]

  async init(fileList, extra) {
    const ld20List = {
      keys: this.defaultKeys,
      info: [],
      title: '2020',
    }
    const ld21List = {
      keys: this.defaultKeys,
      info: [],
      title: '2021',
    }
    this.common2021Excel(fileList, ld20List, 0, extra)
    this.common2021Excel(fileList, ld21List, 1, extra)
    self.postMessage({
      key: 'ld2021Excel',
      type: 'data',
      data: {
        ld20List,
        ld21List,
      },
    })
  }

  common2021Excel(fileList, resultInfo, index, extra) {
    const ldKeys = [
      ['ld20', 'ld21'],
      ['ld2020', 'ld2021'],
      ['f2020', 'f2021'],
    ]
    if (extra.keys) {
      ldKeys.unshift(extra.keys.split(','))
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
        console.log(`xlsx to JSON:`, fileId, res.length)
        if (res.length > 0) {
          res.forEach(item => {
            const curKey = ldKeys.find(keys =>
              Object.keys(item).some(k => keys.includes(k.toLowerCase()))
            )
            curKey && this.formatLdInfo(item, curKey[index], resultInfo, obj, fileId)
          })
        }
        resultInfo.info.push(obj)
        const progress = Math.floor(
          (index * 0.5 + (resultInfo.info.length / fileList.length) * 0.5) * 100
        )
        self.postMessage({
          key: 'ld2021Excel',
          type: 'message',
          data: `当前处理进度: ${progress}%`,
        })
        console.log(`当前处理进度: ${progress}%`)
      })
    })
    resultInfo.info = resultInfo.info.sort((a, b) => a.fileId - b.fileId)
    return resultInfo
  }

  formatLdInfo(data, sheetKey, container, obj, fileId) {
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
      const areaKey = this.findAreaKey(data)
      if (areaKey) {
        obj[ldKey] += Number(data[areaKey])
      }
    } else {
      if (fileId.startsWith('110')) {
        this.formatLdInfo(data, `dt${fileId}id`, container, obj, fileId)
      }
    }
  }

  findAreaKey(data) {
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
}

self.ld2021Excel = new Ld2021Excel()
