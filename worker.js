console.log('worker start')
self.importScripts(
  'https://cdn.jsdelivr.net/npm/xlsx@0.16.9/dist/xlsx.full.min.js',
  './worker/ld2020Excel.js',
  './worker/ld2021Excel.js',
  './worker/ld21ExcelInside.js'
)

self.addEventListener(
  'message',
  function (e) {
    const { key, data, extra } = e.data
    console.log(self[key], key)
    self[key].init(data, extra)
  },
  false
)
