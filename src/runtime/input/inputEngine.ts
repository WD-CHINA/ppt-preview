import type { PresentationRuntime } from '../createPresentationRuntime'

export type PresentationInputCommandType =
  | 'none'
  | 'advance'
  | 'retreat'
  | 'next-slide'
  | 'previous-slide'
  | 'toggle-play'
  | 'toggle-fullscreen'
  | 'exit-fullscreen'
  | 'toggle-presenter-mode'

export interface PresentationInputCommand {
  type: PresentationInputCommandType
  preventDefault: boolean
}

export interface KeyboardInputDescriptor {
  key: string
  code?: string
  targetTagName?: string
  isContentEditable?: boolean
  altKey?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
}

export interface PointerInputDescriptor {
  button: number
}

export interface TouchInputDescriptor {
  startX: number
  startY: number
  endX: number
  endY: number
}

export interface InputCommandHandlers {
  toggleFullscreen?: () => void | Promise<void>
  exitFullscreen?: () => void | Promise<void>
}

const NONE_COMMAND: PresentationInputCommand = { type: 'none', preventDefault: false }
const ACTIVE_COMMANDS = new Set<PresentationInputCommandType>([
  'advance',
  'retreat',
  'next-slide',
  'previous-slide',
  'toggle-play',
  'toggle-fullscreen',
  'exit-fullscreen',
  'toggle-presenter-mode',
])
const EDITABLE_TAG_NAMES = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'])
const HORIZONTAL_SWIPE_THRESHOLD_PX = 48
const MAX_VERTICAL_TO_HORIZONTAL_RATIO = 0.65

function command(type: PresentationInputCommandType): PresentationInputCommand {
  return ACTIVE_COMMANDS.has(type) ? { type, preventDefault: true } : NONE_COMMAND
}

export function getKeyboardInputCommand(event: KeyboardInputDescriptor): PresentationInputCommand {
  if (isEditableKeyboardTarget(event) || event.altKey || event.ctrlKey || event.metaKey) {
    return NONE_COMMAND
  }

  const normalizedKey = event.key.length === 1 ? event.key.toLowerCase() : event.key
  const keyOrCode = event.code || event.key

  switch (normalizedKey) {
    case 'ArrowRight':
    case 'PageDown':
      return command('next-slide')
    case 'ArrowLeft':
    case 'PageUp':
      return command('previous-slide')
    case 'Enter':
      return command('advance')
    case 'Backspace':
      return command('retreat')
    case 'Escape':
      return command('exit-fullscreen')
    case 'f':
      return command('toggle-fullscreen')
    case 'p':
      return command('toggle-presenter-mode')
    default:
      if (normalizedKey === ' ' || normalizedKey === 'Spacebar' || keyOrCode === 'Space') {
        return command('toggle-play')
      }
      return NONE_COMMAND
  }
}

export function getPointerInputCommand(event: PointerInputDescriptor): PresentationInputCommand {
  return event.button === 0 ? command('advance') : NONE_COMMAND
}

export function getTouchInputCommand(event: TouchInputDescriptor): PresentationInputCommand {
  const deltaX = event.endX - event.startX
  const deltaY = event.endY - event.startY
  const absX = Math.abs(deltaX)
  const absY = Math.abs(deltaY)

  if (absX < HORIZONTAL_SWIPE_THRESHOLD_PX || absY > absX * MAX_VERTICAL_TO_HORIZONTAL_RATIO) {
    return NONE_COMMAND
  }

  return command(deltaX < 0 ? 'next-slide' : 'previous-slide')
}

export function executeInputCommand(
  runtime: PresentationRuntime,
  inputCommand: PresentationInputCommand,
  handlers: InputCommandHandlers = {},
) {
  switch (inputCommand.type) {
    case 'advance':
      runtime.advance()
      break
    case 'retreat':
      runtime.retreat()
      break
    case 'next-slide':
      runtime.nextSlide()
      break
    case 'previous-slide':
      runtime.previousSlide()
      break
    case 'toggle-play':
      runtime.togglePlay()
      break
    case 'toggle-fullscreen':
      void handlers.toggleFullscreen?.()
      break
    case 'exit-fullscreen':
      void handlers.exitFullscreen?.()
      break
    case 'toggle-presenter-mode':
      runtime.setPresenterMode(!runtime.state.presenterMode)
      break
    case 'none':
      break
  }
}

function isEditableKeyboardTarget(event: KeyboardInputDescriptor) {
  const tagName = event.targetTagName?.toUpperCase()
  return Boolean(event.isContentEditable || (tagName && EDITABLE_TAG_NAMES.has(tagName)))
}
