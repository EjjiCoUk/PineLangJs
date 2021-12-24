const fs = require("fs")

funcs = Object.create(null)
d= Object.create(null)
funcs.readFile = (path) => {
  data=fs.readFile(path, "utf-8", (err, data) => {
    d.data = data
    console.log(data)
  })
  return d.data
}

exports.funcs = funcs

exports.config = {
  readFile: "topScope"
}