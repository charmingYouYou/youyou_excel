class Ld2020Excel {
  defaultKeys = [
    21, 22, 23, 24, 31, 32, 33, 41, 42, 43, 44, 45, 46, 47, 51, 52, 53, 61, 62,
    63, 64, 65, 66, 67, 111, 112, 113, 114, 121, 122, 123, 124,
  ]

  init(data, extra) {
    const LD2020List = this.defaultKeys;
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
            const ldKey = item[extra.keys];
            if (!LD2020List.includes(ldKey)) {
              LD2020List.push(ldKey)
            }
            if (!obj[ldKey]) {
              obj[ldKey] = 0
            }
            const areaKey = this.findAreaKey(item)
            if (areaKey) {
              obj[ldKey] += Number(item[areaKey])
            }
          })
        } else {
          obj.areaLength = 0
          obj.areaSum = 0
        }
        areaJSON.push(obj)
        self.postMessage({
          key: 'ld2020Excel',
          type: 'message',
          data: `当前处理进度: ${areaJSON.length}/${data.length}`,
        })
        console.log(`当前处理进度: ${areaJSON.length}/${data.length}`)
        console.log(`当前处理结果: `, obj)
      })
    })
    self.postMessage({
      key: 'ld2020Excel',
      type: 'data',
      data: {
        LD2020List,
        areaJSON,
      },
    })
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

self.ld2020Excel = new Ld2020Excel()
