import { describe, expect, it } from 'vitest'
import {
  getKeyboardInputCommand,
  getPointerInputCommand,
  getTouchInputCommand,
  type KeyboardInputDescriptor,
} from './inputEngine'

function key(overrides: Partial<KeyboardInputDescriptor>): KeyboardInputDescriptor {
  return {
    key: '',
    code: '',
    targetTagName: 'DIV',
    isContentEditable: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    ...overrides,
  }
}

describe('input engine', () => {
  it('maps keyboard shortcuts to runtime commands', () => {
    expect(getKeyboardInputCommand(key({ key: 'ArrowRight' }))).toEqual({ type: 'next-slide', preventDefault: true })
    expect(getKeyboardInputCommand(key({ key: 'ArrowLeft' }))).toEqual({ type: 'previous-slide', preventDefault: true })
    expect(getKeyboardInputCommand(key({ key: 'Enter' }))).toEqual({ type: 'advance', preventDefault: true })
    expect(getKeyboardInputCommand(key({ key: ' ' }))).toEqual({ type: 'toggle-play', preventDefault: true })
    expect(getKeyboardInputCommand(key({ key: 'f' }))).toEqual({ type: 'toggle-fullscreen', preventDefault: true })
    expect(getKeyboardInputCommand(key({ key: 'p' }))).toEqual({ type: 'toggle-presenter-mode', preventDefault: true })
    expect(getKeyboardInputCommand(key({ key: 'Escape' }))).toEqual({ type: 'exit-fullscreen', preventDefault: true })
  })

  it('ignores shortcuts from editable targets or modified key combinations', () => {
    expect(getKeyboardInputCommand(key({ key: 'ArrowRight', targetTagName: 'INPUT' }))).toEqual({ type: 'none', preventDefault: false })
    expect(getKeyboardInputCommand(key({ key: 'ArrowRight', isContentEditable: true }))).toEqual({ type: 'none', preventDefault: false })
    expect(getKeyboardInputCommand(key({ key: 'ArrowRight', metaKey: true }))).toEqual({ type: 'none', preventDefault: false })
    expect(getKeyboardInputCommand(key({ key: 'ArrowRight', ctrlKey: true }))).toEqual({ type: 'none', preventDefault: false })
  })

  it('maps stage pointer clicks to advance without hijacking non-primary clicks', () => {
    expect(getPointerInputCommand({ button: 0 })).toEqual({ type: 'advance', preventDefault: true })
    expect(getPointerInputCommand({ button: 1 })).toEqual({ type: 'none', preventDefault: false })
  })

  it('maps horizontal touch swipes to slide navigation and ignores taps or vertical gestures', () => {
    expect(getTouchInputCommand({ startX: 20, startY: 120, endX: 160, endY: 130 })).toEqual({ type: 'previous-slide', preventDefault: true })
    expect(getTouchInputCommand({ startX: 160, startY: 120, endX: 20, endY: 130 })).toEqual({ type: 'next-slide', preventDefault: true })
    expect(getTouchInputCommand({ startX: 20, startY: 120, endX: 45, endY: 128 })).toEqual({ type: 'none', preventDefault: false })
    expect(getTouchInputCommand({ startX: 20, startY: 120, endX: 160, endY: 280 })).toEqual({ type: 'none', preventDefault: false })
  })
})
