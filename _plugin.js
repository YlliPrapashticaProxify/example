// node_modules/just-safe-set/index.mjs
var objectSafeSet = set;
function set(obj, propsArg, value) {
  var props, lastProp;
  if (Array.isArray(propsArg)) {
    props = propsArg.slice(0);
  }
  if (typeof propsArg == "string") {
    props = propsArg.split(".");
  }
  if (typeof propsArg == "symbol") {
    props = [propsArg];
  }
  if (!Array.isArray(props)) {
    throw new Error("props arg must be an array, a string or a symbol");
  }
  lastProp = props.pop();
  if (!lastProp) {
    return false;
  }
  prototypeCheck(lastProp);
  var thisProp;
  while (thisProp = props.shift()) {
    prototypeCheck(thisProp);
    if (typeof obj[thisProp] == "undefined") {
      obj[thisProp] = {};
    }
    obj = obj[thisProp];
    if (!obj || typeof obj != "object") {
      return false;
    }
  }
  obj[lastProp] = value;
  return true;
}
function prototypeCheck(prop) {
  if (prop == "__proto__" || prop == "constructor" || prop == "prototype") {
    throw new Error("setting of prototype values not supported");
  }
}

// src/index.ts
console.log(0, "hello from plugin");
async function getLanguages(args) {
  const [pathBeforeLanguage, pathAfterLanguage] = args.pluginConfig.pathPattern.split("{language}");
  const pathAfterLanguageisDirectory = pathAfterLanguage.startsWith("/");
  const paths = await args.$fs.readdir(pathBeforeLanguage);
  const languages = [];
  for (const language of paths) {
    if (typeof language === "string" && language.endsWith(".json")) {
      languages.push(language.replace(".json", ""));
    }
  }
  return languages;
}
async function readResources(args) {
  const result = [];
  for (const language of args.config.languages) {
    const resourcePath = args.pluginConfig.pathPattern.replace(
      "{language}",
      language
    );
    const flatJson = flatten(
      JSON.parse(await args.$fs.readFile(resourcePath, "utf-8"))
    );
    result.push(parseResource(flatJson, language));
  }
  return result;
}
async function writeResources(args) {
  for (const resource of args.resources) {
    const resourcePath = args.pluginConfig.pathPattern.replace(
      "{language}",
      resource.languageTag.name
    );
    await args.$fs.writeFile(resourcePath, serializeResource(resource));
  }
}
function parseResource(flatJson, language) {
  return {
    type: "Resource",
    languageTag: {
      type: "LanguageTag",
      name: language
    },
    body: Object.entries(flatJson).map(
      ([id, value]) => parseMessage(id, value)
    )
  };
}
function parseMessage(id, value) {
  return {
    type: "Message",
    id: {
      type: "Identifier",
      name: id
    },
    pattern: { type: "Pattern", elements: [{ type: "Text", value }] }
  };
}
function serializeResource(resource) {
  console.log(1, resource);
  const obj = {};
  const flatObject = resource.body.forEach((message) => {
    objectSafeSet(obj, message.id.name, serializeMessage(message));
  });
  console.log(2, obj);
  return JSON.stringify(obj, null, 2);
}
function serializeMessage(message) {
  return [message.id.name, message.pattern.elements[0].value];
}
export {
  getLanguages,
  readResources,
  writeResources
};
