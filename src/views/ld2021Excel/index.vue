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
    <el-form ref="formRef" :model="from">
      <el-form-item label="额外表头名称">
        <el-input v-model="from.keys" placeholder="如: ld20,ld21"></el-input>
      </el-form-item>
    </el-form>
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

      <el-table
        :data="table.info"
        border
        max-height="800"
        :class="`table${table.title}`"
      >
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
import { onMounted, ref, reactive } from '@vue/runtime-core'
import JSZip from 'jszip'
import XLSX from 'xlsx'
import { getFileName } from '@/utils'
import { ElMessage } from 'element-plus'

const acceptArr = ['application/zip', 'application/x-zip-compressed']
const tableResult = ref<any[]>([])
let zipName = ''
const progress = ref('当前处理进度: 0/0')
const from = reactive({
  keys: '',
})
const downloadFileHeader = ref('')

const addFile = () => {
  console.log(123)
}

const uploadSuccess = (file: File) => {
  console.log(file)
  if (acceptArr.includes(file.type)) {
    tableResult.value = []
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
        const decoder = new TextDecoder("gbk");
        return decoder.decode(bytes)
      },
    })
    const fileList = Object.values(res.files).filter(
      value =>
        value.name.endsWith('.dbf') &&
        !value.dir &&
        !value.name.includes('__MACOSX')
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
      const fileId = getFileName(value.name).substring(2)
      downloadFileHeader.value = getFileName(value.name)
        .substring(0, 2)
        .toLowerCase()
      console.log(`解压文件:`, value, fileId)
      let buffer = null
      if ('async' in value) {
        // 解压文件转为buffer
        buffer = await value.async('arraybuffer')
      }
      return { buffer, fileId }
    })
  )
  const worker = new Worker('/youyou_excel/worker.js')
  worker.postMessage({
    key: 'ld2021Excel',
    type: 'data',
    data: bufferList,
    extra: {
      ...from,
    },
  })
  worker.addEventListener('message', e => {
    const { key, type, data } = e.data
    if (key === 'ld2021Excel') {
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
  const table = document.querySelector(`.table${className}`)
  const worksheet = XLSX.utils.table_to_sheet(table)
  XLSX.utils.book_append_sheet(workbook, worksheet, zipName)
  XLSX.writeFile(
    workbook,
    `${zipName}-${downloadFileHeader.value}${className}.xlsx`
  )
}

onMounted(() => {})
</script>

<style lang="scss" scoped>
.el-main * {
  margin: 20px;
}

.el-form * {
  margin: 0;

  .el-input {
    width: 50%;
  }
}

.table-header {
  display: flex;
  align-items: center;
  margin: 0;
}
</style>
