// afterPack.js - 打包后跳过签名步骤，避免 winCodeSign 符号链接错误
exports.default = async function afterPack(context) {
  // 空实现，跳过所有签名逻辑
}
