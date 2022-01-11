<template>
  <div class="bg">
    <el-upload
      class="upload-demo"
      drag
      action="https://jsonplaceholder.typicode.com/posts/"
      :multiple="false"
      :before-upload="uploadSuccess"
      :on-change="addFile"
      :accept="acceptArr.join(',')"
    >
      <i class="el-icon-upload"></i>
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip">只能上传{{ acceptArr.join(',') }}文件</div>
      </template>
    </el-upload>
    <p style="color: red">
      {{ progress }}
    </p>

    <template v-for="table in tableResult">
      <header class="table-header">
        <h1>{{ table.title }}表格数据</h1>
        <el-button
          type="primary"
          style="width: 100px"
          @click="clickDownloadSheet(table.title)"
        >
          下载表格
        </el-button>
      </header>

      <el-table :data="table.info" border max-height="800" :class="table.title">
        <el-table-column type="index"></el-table-column>
        <el-table-column prop="error" label="状态" align="center">
          <template #default="scope">
            {{ scope.row.error ? '失败' : '成功' }}
          </template>
        </el-table-column>
        <el-table-column prop="fileId" label="地区ID" align="center">
        </el-table-column>
        <el-table-column
          v-for="(item, index) in table.keys"
          :key="`ld2020_${index}`"
          :prop="String(item)"
          :label="String(item)"
          align="center"
        >
          <template #default="scope">
            {{ Number(scope.row[item] || 0).toFixed(3) }}
          </template>
        </el-table-column>
      </el-table>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from '@vue/runtime-core'
import JSZip from 'jszip'
import XLSX from 'xlsx'
import iconv from 'iconv-lite'
import { getFileName } from '@/utils'
import { ElMessage } from 'element-plus'

const acceptArr = ['application/zip', 'application/x-zip-compressed']
const tableResult = ref<any[]>([])
const LD2020List = ref<string[]>([])
let zipName = ''
const progress = ref('当前处理进度: 0/0')

const addFile = () => {
  console.log(123)
}

const uploadSuccess = (file: File) => {
  console.log(file)
  if (acceptArr.includes(file.type)) {
    zipName = getFileName(file.name)
    const fileReader = new FileReader()
    fileReader.readAsArrayBuffer(file)
    fileReader.onload = () => {
      const res = fileReader.result
      if (res instanceof ArrayBuffer) {
        unZipFile(new Blob([res]))
      }
    }
  } else {
    ElMessage.error('仅能上传zip压缩包')
  }
  return false
}
const unZipFile = async (blob: Blob) => {
  try {
    const res = await JSZip.loadAsync(blob, {
      // @ts-ignore
      decodeFileName: (bytes: Buffer) => {
        return iconv.decode(bytes, 'gbk')
      },
    })
    const fileList = Object.values(res.files).filter(
      value =>
        !(
          value.name.includes('__MACOSX') ||
          value.dir ||
          value.name.includes('.xml')
        )
    )
    fileProcess(fileList)
  } catch (error) {
    console.log(error)
    ElMessage.error('解压缩失败')
  }
}
const fileProcess = async (fileList: JSZip.JSZipObject[]) => {
  const bufferList = await Promise.all(
    fileList.map(async value => {
      const fileId = getFileName(value.name).replace('dt', '')
      console.log(`解压文件:`, value, fileId)
      let buffer = null
      if ('async' in value) {
        // 解压文件转为buffer
        buffer = await value.async('arraybuffer')
      }
      return { buffer, fileId }
    })
  )
  const worker = new Worker('/worker.js')
  worker.postMessage({
    key: 'areaId2021Excel',
    type: 'data',
    data: bufferList,
  })
  worker.addEventListener('message', e => {
    const { key, type, data } = e.data
    if (key === 'areaId2021Excel') {
      if (type === 'message') {
        progress.value = data
      } else if (type === 'data') {
        tableResult.value = [data.ld20List, data.ld21List]
        console.log(data, '----------')
        worker.terminate()
      }
    }
  })
}

const clickDownloadSheet = (className: string) => {
  const workbook = XLSX.utils.book_new()
  const table = document.querySelector(`.${className}`)
  const worksheet = XLSX.utils.table_to_sheet(table)
  XLSX.utils.book_append_sheet(workbook, worksheet, zipName)
  XLSX.writeFile(workbook, `${zipName}-${className}.xlsx`)
}

onMounted(() => {})
</script>

<style lang="scss" scoped>
.el-main * {
  margin: 20px;
}

.table-header {
  display: flex;
  align-items: center;
  margin: 0;
}
</style>
