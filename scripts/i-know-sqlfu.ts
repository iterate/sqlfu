#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const defaults = {
  input: 'tmp/giphy-matrix-i-know-kung-fu.gif',
  output: 'tmp/i-know-sqlfu.gif',
  label: 'sqlfu',
  boxColor: '#e7c18b',
  textColor: '#2f2416',
  fontFile: '/System/Library/Fonts/Menlo.ttc',
  fontSize: 22,
  boxWidth: 160,
  boxHeight: 28,
  x: 194,
  y: 154,
  rotationDeg: -2,
  start: 2.05,
  end: null,
}

const options = parseArgs(process.argv.slice(2))
const config = {
  ...defaults,
  ...options,
}

const inputPath = path.resolve(config.input)
const outputPath = path.resolve(config.output)
const palettePath = outputPath.replace(/\.gif$/i, '') + '.palette.png'

assertFileExists(inputPath)
assertFileExists(config.fontFile)
fs.mkdirSync(path.dirname(outputPath), { recursive: true })

const duration = Number(readStdout('ffprobe', [
  '-v',
  'error',
  '-select_streams',
  'v:0',
  '-show_entries',
  'format=duration',
  '-of',
  'default=noprint_wrappers=1:nokey=1',
  inputPath,
]).trim())

if (!Number.isFinite(duration) || duration <= 0) {
  throw new Error(`could not determine duration for ${inputPath}`)
}

const end = config.end == null ? duration : Number(config.end)
if (!Number.isFinite(end) || end <= config.start) {
  throw new Error(`invalid time window start=${config.start} end=${config.end}`)
}

const stickerFilter = buildStickerFilter({
  duration,
  label: config.label,
  boxColor: normalizeColor(config.boxColor),
  textColor: normalizeColor(config.textColor),
  fontFile: escapeFilterValue(config.fontFile),
  fontSize: Number(config.fontSize),
  boxWidth: Number(config.boxWidth),
  boxHeight: Number(config.boxHeight),
  x: Number(config.x),
  y: Number(config.y),
  rotationDeg: Number(config.rotationDeg),
  start: Number(config.start),
  end,
})

run('ffmpeg', [
  '-y',
  '-i',
  inputPath,
  '-filter_complex',
  `${stickerFilter},palettegen`,
  '-frames:v',
  '1',
  palettePath,
])

run('ffmpeg', [
  '-y',
  '-i',
  inputPath,
  '-i',
  palettePath,
  '-filter_complex',
  `${stickerFilter}[composite];[composite][1:v]paletteuse`,
  outputPath,
])

console.log(`wrote ${path.relative(process.cwd(), outputPath)}`)

function buildStickerFilter({
  duration,
  label,
  boxColor,
  textColor,
  fontFile,
  fontSize,
  boxWidth,
  boxHeight,
  x,
  y,
  rotationDeg,
  start,
  end,
}) {
  const rotationRad = (rotationDeg * Math.PI) / 180
  const escapedLabel = escapeDrawtext(label)
  return [
    `color=c=${boxColor}:s=${boxWidth}x${boxHeight}:r=33.333:d=${duration}[card]`,
    `[card]drawtext=fontfile=${fontFile}:text='${escapedLabel}':fontcolor=${textColor}:fontsize=${fontSize}:x=(w-text_w)/2:y=(h-text_h)/2-1[card_text]`,
    `[card_text]rotate=a=${rotationRad}:ow=rotw(iw):oh=roth(ih):fillcolor=none[sticker]`,
    `[0:v][sticker]overlay=x=${x}:y=${y}:enable='between(t,${start},${end})'`,
  ].join(';')
}

function parseArgs(args) {
  const parsed = {}
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (!arg.startsWith('--')) {
      throw new Error(`unexpected argument: ${arg}`)
    }

    const key = arg.slice(2)
    const next = args[index + 1]
    if (!next || next.startsWith('--')) {
      throw new Error(`missing value for --${key}`)
    }

    parsed[toCamelCase(key)] = next
    index += 1
  }

  for (const key of [
    'fontSize',
    'boxWidth',
    'boxHeight',
    'x',
    'y',
    'rotationDeg',
    'start',
    'end',
  ]) {
    if (parsed[key] != null) {
      parsed[key] = Number(parsed[key])
    }
  }

  return parsed
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

function normalizeColor(value) {
  if (!value.startsWith('#')) {
    return value
  }

  return `0x${value.slice(1)}`
}

function escapeFilterValue(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/,/g, '\\,')
    .replace(/'/g, "\\'")
}

function escapeDrawtext(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/,/g, '\\,')
    .replace(/'/g, "\\'")
}

function assertFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`missing file: ${filePath}`)
  }
}

function readStdout(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  if (result.status !== 0) {
    throw new Error(result.stderr || `${command} failed`)
  }

  return result.stdout
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}
