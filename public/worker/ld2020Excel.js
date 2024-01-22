class Ld2020Excel {
  init(data, extra) {
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
            if (!LD2020List.includes(String(item[extra.keys]))) {
              console.log(item[extra.keys], fileId)
              LD2020List.push(String(item[extra.keys]))
            }
            const areaKey = this.findAreaKey(item)
            obj[item[extra.keys]] = item[areaKey]
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
