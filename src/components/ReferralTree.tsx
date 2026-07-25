import { ChevronDown, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatDate } from '../lib/format'
import type { ReferralNode } from '../types/api'

function countNodes(nodes: ReferralNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countNodes(node.children), 0)
}

function countByLevel(nodes: ReferralNode[], counts = new Map<number, number>()): Map<number, number> {
  for (const node of nodes) {
    counts.set(node.level, (counts.get(node.level) ?? 0) + 1)
    countByLevel(node.children, counts)
  }
  return counts
}

function TreeNode({
  node,
  depth,
  defaultOpen,
}: {
  node: ReferralNode
  depth: number
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const hasChildren = node.children.length > 0
  const initials = node.fullName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')

  return (
    <li className="tree-node">
      <div className="tree-row" style={{ paddingLeft: `${depth * 18}px` }}>
        <button
          type="button"
          className="tree-toggle"
          aria-expanded={hasChildren ? open : undefined}
          aria-label={hasChildren ? (open ? 'Collapse' : 'Expand') : 'No downline'}
          disabled={!hasChildren}
          onClick={() => setOpen((value) => !value)}
        >
          {hasChildren ? (
            open ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <span className="tree-leaf-dot" />
          )}
        </button>

        <span className="tree-avatar" aria-hidden="true">{initials}</span>

        <span className="tree-meta">
          <strong>{node.fullName}</strong>
          <small>
            {node.referralCode} · joined {formatDate(node.joinedAt)}
          </small>
        </span>

        <span className={`tree-level level-${Math.min(node.level, 3)}`}>L{node.level}</span>

        {hasChildren && (
          <span className="tree-children-count">{node.children.length} direct</span>
        )}
      </div>

      {hasChildren && open && (
        <ul className="tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              defaultOpen={child.level < 3}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function ReferralTree({ tree }: { tree: ReferralNode[] }) {
  const total = useMemo(() => countNodes(tree), [tree])
  const levelCounts = useMemo(() => countByLevel(tree), [tree])

  return (
    <section className="panel referral-tree-panel" id="network-tree">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Downline</p>
          <h2>Full referral tree</h2>
        </div>
        <div className="tree-summary">
          <span>{total} members</span>
          {[1, 2, 3].map((level) => (
            <span key={level} className={`tree-level-chip level-${level}`}>
              L{level}: {levelCounts.get(level) ?? 0}
            </span>
          ))}
        </div>
      </div>

      {tree.length === 0 ? (
        <p className="referral-empty">
          No network yet. Share your referral code — people who join under you appear here nested by level.
        </p>
      ) : (
        <ul className="referral-tree">
          {tree.map((node) => (
            <TreeNode key={node.id} node={node} depth={0} defaultOpen />
          ))}
        </ul>
      )}
    </section>
  )
}

export { countNodes }
