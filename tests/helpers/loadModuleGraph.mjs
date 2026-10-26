// Loads a src/ module and its '@/…' and relative imports (transpiled with `typescript`, run in vm),
// so data modules that import other data modules can be tested without a bundler. Any other
// import (React, icon packages, …) becomes a stub whose properties are harmless functions.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const SRC = resolvePath(dirname(fileURLToPath(import.meta.url)), '../../src')
const stub = () => new Proxy(function () {}, { get: (_t, key) => (key === '__esModule' ? true : stub()), apply: () => stub() })

function findFile(base) {
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
    if (existsSync(candidate) && !candidate.endsWith('/')) {
      try {
        readFileSync(candidate)
        return candidate
      } catch {
        // a directory: try the next candidate
      }
    }
  }
  return null
}

export function createLoader(overrides = {}) {
  const cache = new Map()
  const load = (file) => {
    if (cache.has(file)) return cache.get(file)
    const module = { exports: {} }
    cache.set(file, module.exports)
    if (file.endsWith('.json')) {
      module.exports = JSON.parse(readFileSync(file, 'utf8'))
      cache.set(file, module.exports)
      return module.exports
    }
    const source = readFileSync(file, 'utf8').replace(/import\.meta\.env/g, '({})')
    const { outputText } = ts.transpileModule(source, {
      fileName: file,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    })
    const require = (name) => {
      if (name in overrides) return overrides[name]
      let base = null
      if (name.startsWith('@/')) base = join(SRC, name.slice(2))
      else if (name.startsWith('.')) base = resolvePath(dirname(file), name)
      const target = base && findFile(base)
      return target ? load(target) : stub()
    }
    runInNewContext(outputText, { exports: module.exports, module, require, URL, URLSearchParams, Intl, Date, Error, console, crypto, localStorage: { getItem: () => null } })
    cache.set(file, module.exports)
    return module.exports
  }
  return (path) => load(findFile(join(SRC, path)))
}
