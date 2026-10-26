// Transpiles one src/ module with the installed `typescript` package and runs it in a fresh vm
// context. Imports are answered by `resolve(name)`; anything it does not handle becomes `{}`.
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

export function loadSource(path, resolve = () => undefined, globals = {}) {
  const exports = {}
  const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    fileName: path,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  })
  runInNewContext(outputText, {
    // Host Error so `instanceof Error` holds for errors thrown by test mocks.
    exports, URL, Intl, Date, Error, crypto, console, ...globals,
    require: (name) => resolve(name) ?? {},
  })
  return exports
}
