ext_mods = Object.create(null)
fs = require("fs")
function parseExpression(program) {
  program = skipSpace(program);
  let match, expr;
  if (match = /^#([^#]*)#/.exec(program)) {
    expr = {type: "ignore", value: match[1]}
  } else if (match = /^"([^"]*)"/.exec(program)) {
    expr = {type: "value", value: match[1]};
  } else if (match = /^'([^']*)'/.exec(program)){
    expr = {type: "value", value: match[1]};
  } else if (match = /^`([^`]*)`/.exec(program)) {
    expr = {type: "value", value: match[1]};
  } else if (match = /^\d+\b/.exec(program)) {
    expr = {type: "value", value: Number(match[0])};
  } else if (match = /^[^\s(),#"]+/.exec(program)) {
    expr = {type: "word", name: match[0]};
  } else {
    console.log("Unexpected syntax: " + program);
  }
  return parseApply(expr, program.slice(match[0].length));
}
const topScope = Object.create(null);
class PineError extends Error {
  constructor(message) {
    super(message)
  }
}
topScope.topScope = () => {
  return topScope
}
topScope.specialForms = () => {
  return specialForms
}
const prompt = require("prompt-sync")({ sigint: true });
function skipSpace(string) {
  string.replace("\n", ";");
  let first = string.search(/\S/);
  if (first == -1) return "";
  return string.slice(first);
}
skipSpace(`HEY
Bro`)
function parseApply(expr, program) {
  program = skipSpace(program);
  if (program[0] != "(") {
    return {expr: expr, rest: program};
  }
  program = skipSpace(program.slice(1));
  expr = {type: "apply", operator: expr, args: []};
  while (program[0] != ")") {
    let arg = parseExpression(program);
    expr.args.push(arg.expr);
    program = skipSpace(arg.rest);
    if (program[0] == "," || program[0]==";" || program[0]=="\n") {
      program = skipSpace(program.slice(1));
    } else if (program[0] != ")" && program[0]!="\n") {
      console.log("Expected ',' or ')'");
    }
  }
  return parseApply(expr, program.slice(1));
}

function parse(program) {
  let {expr, rest} = parseExpression(program);
  if (skipSpace(rest).length > 0) {
    console.log("Unexpected text after program");
  }
  return expr;
}
exports.use = (file) => {
  ext_mods[file.name] = {
    funcs: file.funcs,
    config: file.config
  }
}
var toReturn
const specialForms = Object.create(null);

function evaluate(expr, scope) {
  if (expr.type == "ignore") {
    return
  }
  else if (expr.type == "return") {
    return evaluate(specialForms.return(expr.args, scope), scope)
  }
  else if (expr.type == "value") {
    return expr.value;
  } else if (expr.type == "word") {
    if(expr.name == "return") return;
    else if(expr.name in scope) {
      return scope[expr.name]
    } else {
      console.log(
        `Undefined binding: ${expr.name}`);
    }
  } else if (expr.type == "apply") {
    let {operator, args} = expr;
    if (operator.type == "word" && operator.name == "return") {
      val = evaluate(specialForms.return(expr.args, scope), scope)
      return val
    }
    if (operator.type == "word" &&
        operator.name in specialForms) {
      return specialForms[operator.name](expr.args, scope);
    } else {
      let op = evaluate(operator, scope);
      if (typeof op == "function") {
        return op(...args.map(arg => evaluate(arg, scope)));
      } else {
        console.log("Applying a non-function.");
      }
    }
  }
}
module.exports.evaluate = evaluate
specialForms.if = (args, scope) => {
  if (args.length != 3) {
    throw new SyntaxError("Wrong number of args to if");
  } else if (evaluate(args[0], scope) !== false) {
    return evaluate(args[1], scope);
  } else {
    return evaluate(args[2], scope);
  }
};

specialForms.while = (args, scope) => {
  if (args.length != 2) {
    console.log("Wrong number of args to while");
  }
  while (evaluate(args[0], scope) !== false) {
    evaluate(args[1], scope);
  }

  // Since undefined does not exist in Egg, we return false,
  // for lack of a meaningful result.
  return false;
};

specialForms.run = (args, scope) => {
  let value = false;
  for (let arg of args) {
    value = evaluate(arg, scope);
  }
  return value;
};

specialForms.dictionaries = () => {
  ls=[]
  for(const i in specialForms){
    ls.push(i)
  }
  return ls
}

specialForms.scope = (args, scope) => {
  console.log(scope)
}
module.exports.evaluate = evaluate
specialForms.def = (args, scope) => {
  if (args.length != 2 || args[0].type != "word") {
    console.log("Incorrect use of define");
  }
  cantUse = ["pass", "true", "false", "null"]
  let value = evaluate(args[1], scope);
  specialForms[args[0].name]= (args, scope) => {
    return value
  }
  topScope[`${args[0].name}`] = value
  i=args[0].name
  if(i in cantUse) return console.log("Defining to a locked value or function")
  specialForms[`${i}.set`] = (argsy, scope) => {
    let value = evaluate(argsy[0], scope);
    specialForms[i]= (args, scope) => {
      return value
    }
    scope[i] = value;
    return value;
  }
  if(typeof(value) == "undefined") valuee = value
  else if(typeof(value) == "boolean") valuee="."
  else valuee=value.toString()
  if(valuee.startsWith("[") && valuee.endsWith("]")){
    value=value.split()
    value=value[0].split("[")
    value.shift()
    value[value.length-1]=value[value.length-1].split("]")[0]
    value.join()
    value=value[0].split(",")
    for(let i in value){
      if(value[i] == '') value.splice(i)
    }
  }
  specialForms[`${i}.add`] = (args, scope) => {
    let value = specialForms[i]()
    let toAdd = evaluate(args[0], scope)
    try {
      value=value.toArray()
    } catch {
      //
    }
    try {
      value.push(toAdd)
    } catch (err) {
      console.log(err)
    }
    specialForms[i]= (args, scope) => {
      return value
    }
    specialForms[i] = (args, scope) => {
      return value
    }
    scope[i] = value
    topScope[i] = value
    return value
  }
  specialForms[`${i}.remove`] = (args, scope) => {
    let value = specialForms[i]()
    let toRemove = evaluate(args[0], scope)
    try {
      value=value.toArray()
    } catch {
      console.log()
    }
    try {
      value.splice(value.indexOf(toRemove))
    } catch (err) {
      console.log(err)
    }
    specialForms[i]= value
    scope[i] = value
    topScope[i] = value
    return value
  }
  specialForms[`${i}.startsWith`] = (a, scope) => {
    return value.startsWith(a[0].value)
  }
  specialForms[`${i}.Int`] = (argsyy, scope) => {
    let value = topScope[i]
    console.log(value)
    try {
      value=parseInt(value)
    } catch (err) {
      console.log(err)
    }
    specialForms[i]= (args, scope) => {
      return value
    }
    specialForms[i] = (args, scope) => {
      return value
    }
    scope[i] = value
    topScope[i] = value
    return value
  }
  topScope[`${i}.includes`] = (include) => {
    return value.includes(include)
  }
  topScope[`${i}.Str`] = (argsyyy, scope) => {
    let value = specialForms[i]()
    try {
      value=value.toString()
    } catch (err) {
      console.log(err)
    }
    specialForms[i]= (args, scope) => {
      return value
    };
    scope[i] = value
    topScope[i] = value
  }
  specialForms[`${i}.split`] = (split) => {
    if(!split[0]) value = value.split()
    else value = value.split(split[0].value)
    topScope[i] = value
    return value
  }
  specialForms[`${i}.join`] = (split) => {
    return value.join(split[0].value)
    if(!split[0]) topScope[i] = value.join()
    else value.join(split[0].value)
    topScope[i] = value
  }

  topScope[`${i}.`] = (index) => {
    return value[index]
  }
  topScope[`${i}.shift`] = () => {
    value.shift()
    topScope[i] = value
    return value
  }
  topScope[i] = value
  return value
  scope[args[0].name] = value;
};
topScope.return = () => {
  return
}
topScope.load = (value, aas) => {
  var lib
  if(aas in ext_mods){
    var lib = ext_mods[aas]
  }
  else {
    try{
      lib = require(`./lib/${value}.js`)
    }
    catch(err){
      if(false){
        lib = ext_mods[value]
      }
      else {
        console.log("this file doesn't exist")
        console.log(err)
        return
      }
    }
  }
  for(let i in lib.funcs){
    if(lib.config[i] == "specialForms") specialForms[`${value}.${i}`]= lib.funcs[i]
    else topScope[`${value}.${i}`]= lib.funcs[i]
  }
}
specialForms.import = (args, scope) => {
    ls = []
  for(let i in args) {
    if(args[i].type == "value") ls.push(args[i].value)
    else if (args[i].type == "word") ls.push(evaluate(args[i], scope));
  }
  filename = ls.join("")
  fs.readFile(filename, "utf-8", (err, program) => {
    evaluate(parse(program), Object.create(topScope), Object.create(variables));
  })
}
topScope["__dirname"] = __dirname
topScope.true = true;
topScope.false = false;
topScope.null = null
module.exports.addTopScope = (name, func) => {
  topScope[name] = func
}
module.exports.addSpecialForms = (name, func) => {
  specialForms[name] = func
}
module.exports.topScope = () => {
  console.log(topScope)
}

// → false

for (let op of ["+", "-", "*", "/", "==", "<", ">", "^"]) {
  topScope[op] = Function("a, b", `return a ${op} b;`);
}


specialForms.func = (args, scope) => {
  if (!args.length) {
    throw new SyntaxError("Functions need a body");
  }
  let body = args[args.length - 1];
  let params = args.slice(0, args.length - 1).map(expr => {
    if (expr.type != "word") {
      console.log("Parameter names must be words");
    }
    return expr.name;
  });
  return function () {
    if (arguments.length != params.length) {
      throw new TypeError("Wrong number of arguments");
    }
    let localScope = Object.create(scope);
    for (let i = 0; i < arguments.length; i++) {
      localScope[params[i]] = arguments[i];
    }
    return evaluate(body, localScope);
  };
};
String.prototype.splitBy = function (delimiter) {
  var
    delimiterPATTERN = '(' + delimiter + ')',
    delimiterRE = new RegExp(delimiterPATTERN, 'g');

  return this.split(delimiterRE).reduce((chunks, item) => {
    if (item.match(delimiterRE)){
      chunks.push(item)
    } else {
      chunks[chunks.length - 1] += item
    };
    return chunks
  }, [])
};
Array.prototype.insert = function ( index, item ) {
    this.splice( index, 0, item );
};
Array.prototype.append = Array.prototype.push
specialForms.print = (args, scope) => {
  ls = []
  for(let i in args) {
    if(args[i].type == "value") ls.push(args[i].value)
    else if (args[i].type == "word") ls.push(evaluate(args[i], scope));
  }
  ls = ls.join("")
  console.log(ls)
}
/*topScope.print = val => {
  v=val
  ls=v.split("{")
  for(let i in ls){
    if (typeof(ls[i]) == "function") {
      ls.splice(i)
      continue
    }
    if(!ls[i].includes("}")) continue
    newLs = ls[i]
    newLs=newLs.split("}")
    ls[i]=newLs[0]
    ls.insert(i+1, newLs[1])
    valy = evaluate(parse(ls[i]), topScope)
    console.log(valy)
    ls[i] = valy
    console.log(ls)
  }
  ls.join()
  console.log(ls)
} */
topScope.between = val => {
  v=val
  d = v.split("}")
  for(let i in d){
    console.log(d[i])
    valy = d[i].split("{")[1]
    console.log(valy)
    d[i] = valy
  }
  for(let i in d){
    if(d[i] == null) d.splice(i)
  }
  for(let i in d) {
    console.log(d[i])
    d[i] = evaluate(parse(d[i]), topScope)
  }
  console.log(d)
  console.log(val)
  val = val.split(/\[{}\]/)//Doe
  console.log(val)
  for(let i in val){
    if(val[i] == '') val.splice(i)
  }
  console.log(val)
}
topScope.say = value => {
  console.log(value)
  return value
};
topScope.ask = value => {
  return input(value)
}
topScope.eval = string => {
  evaluate(parse(string), topScope)
}
specialForms.list = (args, scope) => {
  list = []
  for(let i in args){
    if (args[i].type == "word") list.push(evaluate(args[i], scope))
    else if (args[i].type == "value") list.push(args[i].value)
  }
  return list
}
topScope.newList = () => {
  return "[]"
}
topScope.sqrt = value => {
  return Math.sqrt(value)
}
const variables = Object.create(null)

variables.dad = value => {
  console.log("HEY")
}

module.exports.run = function run(program) {
  val=evaluate(parse("run(" +program + ")"), Object.create(topScope), Object.create(variables));
  return val
}
module.exports.runFrom = (path) => {
  let fs = require("fs")
  fs.readFile(path, "utf-8", (err, data) => {
    if(err) console.log(err)
    else module.exports.run(data)
  })
}
specialForms.return = (args, scope) => {
  return args[0]
}
function input(q){
  variable=prompt(q)
  return variable
}
specialForms.class = (args, scope) => {
  name = args[0].name;
  specialForms[`__${name}:init__`] = (argsy, scope) => {
    specialForms[name] = (args, scope) => {
      for(i in args){
        topScope[argsy[i].name] = args[i].value
      }
      return evaluate(argsy[argsy.length-1], scope)
    }
  };
  specialForms[`__${name}:func__`] = (argsy, scope) => {
    specialForms[`${name}.${argsy[0].name}`] = (args, scope) => {
      argsy.shift()
      for(i in args){
        topScope[argsy[i].name] = args[i].value
      }
      return evaluate(argsy[argsy.length-1], scope)
    }
  }
  args.shift();
  for(let i in args){
    evaluate(args[i], scope)
  }
}
variabley=2
topScope.pass = 1
topScope.includes = (value, include) => {
  if(value.includes(include)) return true;
  else return false
}

variable=true
