funcs =Object.create(null)
const http = require("http")
funcs.start = (port) => {
  e=require("express")
  app=e();
  app.get("*", (req, res) => {
    res.status(404).send("hey")
  })
 app.listen(port)
}


module.exports.funcs = funcs
module.exports.config = {}