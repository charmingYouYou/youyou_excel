class Ld21ExcelInside {
  defaultKeys = [
    21, 22, 23, 24, 31, 32, 33, 41, 42, 43, 44, 45, 46, 47, 51, 52, 53, 61, 62,
    63, 64, 65, 66, 67, 111, 112, 113, 114, 121, 122, 123, 124,
  ]

  async init(fileList, extra) {
    const ld21List = {
      keys: this.defaultKeys,
      info: {},
      title: 'dt2021',
    }
    this.extra = {
      areaIdKey: 'pac',
      ...extra,
    }
    this.common2021Excel(fileList, ld21List, 0, this.extra)
    self.postMessage({
      key: 'ld21ExcelInside',
      type: 'data',
      data: {
        ld21List,
      },
    })
  }

  common2021Excel(fileList, resultInfo, index, extra) {
    const ldKeys = [['ld21'], ['ld2021'], ['f2021']]
    if (extra.keys) {
      ldKeys.push(extra.keys.split(','))
    }
    fileList.forEach(({ buffer, fileId }) => {
      // 每个文件
      const workbook = self.XLSX.read(
        buffer,
        {
          type: 'buffer'
        }
      )
      console.log(workbook.Sheets)
      workbook.SheetNames.forEach(sheetName => {
        const res = self.XLSX.utils.sheet_to_row_object_array(
          workbook.Sheets[sheetName]
        )
        console.log(`xlsx to JSON:`, fileId)
        if (res.length > 0) {
          res.forEach(item => {
            const pacValue = this.getValue(item, this.extra.areaIdKey)
            if (!resultInfo.info[pacValue]) {
              resultInfo.info[pacValue] = {
                pac: pacValue,
              }
            }
            const curKey = ldKeys.find(keys =>
              Object.keys(item).some(k => keys.includes(k.toLowerCase()))
            )
            curKey &&
              this.formatLdInfo(
                item,
                curKey[index],
                resultInfo,
                resultInfo.info[pacValue],
                fileId
              )
          })
        }
      })
    })
    self.postMessage({
      key: 'ld21ExcelInside',
      type: 'message',
      data: `当前处理进度: 100%`,
    })
    console.log(`当前处理进度: 100%`)
    resultInfo.info = Object.values(resultInfo.info).sort(
      (a, b) => a.pac - b.pac
    )
    return resultInfo
  }

  getValue(data, key) {
    return (
      data[key] ||
      data[key.toLowerCase()] ||
      data[key.toUpperCase()] ||
      data[
      key.replace(/^\S/, function (s) {
        return s.toUpperCase()
      })
      ]
    )
  }

  formatLdInfo(data, sheetKey, container, obj, fileId) {
    let ldKey = this.getValue(data, sheetKey)
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

self.ld21ExcelInside = new Ld21ExcelInside()
