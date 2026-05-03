import { describe, expect, it } from 'vitest'
import { createDiagramRenderModel } from './diagramModel'
import type { NormalizedDiagramMeta } from '../../types/presentation'

describe('createDiagramRenderModel', () => {
  it('lays out hierarchy nodes by depth and creates parent-child edges', () => {
    const diagram: NormalizedDiagramMeta = {
      layoutKind: 'urn:microsoft.com/office/officeart/2005/8/layout/hierarchy1',
      tree: [
        {
          id: '0',
          type: 'node',
          text: 'Root',
          children: [
            { id: '1', type: 'node', text: 'Child A', children: [] },
            { id: '2', type: 'node', text: 'Child B', children: [] },
          ],
        },
      ],
      textList: ['Root', 'Child A', 'Child B'],
      nodeCount: 3,
      relationCount: 2,
      drawingTargetNames: ['Root Shape'],
    }

    const model = createDiagramRenderModel(diagram)

    expect(model?.nodes).toHaveLength(3)
    expect(model?.edges).toHaveLength(2)
    expect(model?.nodes.map((node) => ({ text: node.text, depth: node.depth, kind: node.kind }))).toEqual([
      { text: 'Root', depth: 0, kind: 'root' },
      { text: 'Child A', depth: 1, kind: 'leaf' },
      { text: 'Child B', depth: 1, kind: 'leaf' },
    ])
    expect(model?.nodes[0]?.x).toBeCloseTo(0.39, 2)
    expect(model?.nodes[1]?.x).toBeCloseTo(0.18, 2)
    expect(model?.nodes[2]?.x).toBeCloseTo(0.6, 2)
    expect(model?.edges[0]?.path).toContain('L')
  })

  it('positions branch nodes by subtree center instead of flat per-level spacing', () => {
    const diagram: NormalizedDiagramMeta = {
      layoutKind: 'urn:microsoft.com/office/officeart/2005/8/layout/hierarchy1',
      tree: [
        {
          id: '0',
          type: 'node',
          text: 'Root',
          children: [
            {
              id: '1',
              type: 'node',
              text: 'Branch',
              children: [
                { id: '2', type: 'node', text: 'Leaf A', children: [] },
                { id: '3', type: 'node', text: 'Leaf B', children: [] },
              ],
            },
            { id: '4', type: 'node', text: 'Solo', children: [] },
          ],
        },
      ],
      textList: ['Root', 'Branch', 'Leaf A', 'Leaf B', 'Solo'],
      nodeCount: 5,
      relationCount: 4,
      drawingTargetNames: [],
    }

    const model = createDiagramRenderModel(diagram)
    const branchNode = model?.nodes.find((node) => node.text === 'Branch')
    const leafA = model?.nodes.find((node) => node.text === 'Leaf A')
    const leafB = model?.nodes.find((node) => node.text === 'Leaf B')
    const solo = model?.nodes.find((node) => node.text === 'Solo')

    expect(branchNode?.kind).toBe('branch')
    expect(branchNode?.x).toBeLessThan(solo?.x ?? 1)
    expect(branchNode?.x).toBeGreaterThan(leafA?.x ?? 0)
    expect(branchNode?.x).toBeLessThan(leafB?.x ?? 1)
  })

  it('uses circular placement for cycle layouts', () => {
    const diagram: NormalizedDiagramMeta = {
      layoutKind: 'urn:microsoft.com/office/officeart/2005/8/layout/cycle1',
      tree: [
        {
          id: '0',
          type: 'node',
          text: 'Plan',
          children: [
            { id: '1', type: 'node', text: 'Build', children: [] },
            { id: '2', type: 'node', text: 'Launch', children: [] },
          ],
        },
      ],
      textList: ['Plan', 'Build', 'Launch'],
      nodeCount: 3,
      relationCount: 3,
      drawingTargetNames: [],
    }

    const model = createDiagramRenderModel(diagram)
    const plan = model?.nodes.find((node) => node.text === 'Plan')
    const build = model?.nodes.find((node) => node.text === 'Build')
    const launch = model?.nodes.find((node) => node.text === 'Launch')

    expect(model?.nodes).toHaveLength(3)
    expect(model?.edges).toHaveLength(3)
    expect(plan?.y).toBeLessThan(build?.y ?? 1)
    expect(plan?.y).toBeLessThan(launch?.y ?? 1)
    expect(Math.abs((build?.x ?? 0) - (launch?.x ?? 0))).toBeGreaterThan(0.25)
    expect(model?.edges[0]?.path).toContain('Q')
  })
})
