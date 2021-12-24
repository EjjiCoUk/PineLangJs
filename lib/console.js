funcs = Object.create(null)

funcs.input = (q) => {
  const prompt = require("prompt-sync")()
  return prompt(q)
}
funcs.repeat= (t) => {
  console.log(t)
}

exports.config = {
  input: "topScope",
  repeat: "topScope"
}

exports.funcs = funcs