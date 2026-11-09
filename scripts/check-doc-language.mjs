import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const files = [...new Set(execFileSync('git', [
  'ls-files', '--cached', '--others', '--exclude-standard', '-z',
], { cwd: root, encoding: 'utf8' }).split('\0'))]
  .filter((file) => /\.mdx?$/i.test(file))
  .sort()

const letter = /\p{Letter}/u
const allowedLetter = /[A-Za-z]|\p{Script=Hangul}/u
const unsupportedSymbol = /[\u3000-\u303f\uff00-\uffef]|\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u
let violations = 0

for (const file of files) {
  let contents
  try {
    contents = readFileSync(resolve(root, file), 'utf8')
  } catch (error) {
    // Git에 아직 반영하지 않은 삭제 파일은 검사에서 건너뛴다.
    if (error.code === 'ENOENT') continue
    throw error
  }

  for (const [lineIndex, line] of contents.split(/\r?\n/).entries()) {
    for (const [columnIndex, character] of [...line].entries()) {
      if ((letter.test(character) && !allowedLetter.test(character)) || unsupportedSymbol.test(character)) {
        const codePoint = character.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')
        console.error(`${file}:${lineIndex + 1}:${columnIndex + 1} 허용하지 않는 문자 U+${codePoint}: 한글·영문자와 일반 기호만 사용할 수 있습니다.`)
        violations += 1
      }
    }
  }
}

if (violations > 0) {
  console.error(`문서 언어 검사 실패: ${violations}개 문자를 수정해 주세요.`)
  process.exitCode = 1
} else {
  console.log(`문서 언어 검사 통과: Markdown ${files.length}개 파일`)
}
