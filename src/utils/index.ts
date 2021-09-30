export const removeFilePath = (path: string) => {
  return path.substr(path.lastIndexOf('/') + 1)
}

export const removeFileExtension = (path: string) => {
  return path.substring(0, path.indexOf('.'))
}

export const getFileName = (path: string, removeExtension = true) => {
  const fileName = removeFilePath(path)
  if (removeExtension) {
    return removeFileExtension(fileName)
  }
  return fileName
}
