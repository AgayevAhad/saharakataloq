import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderTree,
  Folder,
  FolderPlus,
  ArrowUp,
  ArrowDown,
  Archive,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Move,
  ChevronRight,
  ChevronDown,
  Layers,
  Box,
  Eye,
} from 'lucide-react';

import { CategorySpecTemplateEditor } from './CategorySpecTemplateEditor';

interface ThemeColors {
  primary: string;
  bgCard: string;
  border: string;
  text: string;
  textMuted: string;
  danger?: string;
  success?: string;
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  parentId: string | null;
  depth: number;
  path: string;
  sortOrder: number;
  isArchived: boolean;
  version: number;
  productCount: number;
  totalDescendantProducts: number;
  children: CategoryNode[];
}

export const CategoryTreeManager: React.FC<{
  theme: ThemeColors;
  csrfToken: string;
  onViewCategoryProducts?: (categoryId: string) => void;
  onRefreshCatalog?: () => void;
}> = ({ theme, csrfToken, onViewCategoryProducts, onRefreshCatalog }) => {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [includeArchived, setIncludeArchived] = useState<boolean>(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [feedbackMsg, setFeedbackMsg] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [creatingParent, setCreatingParent] = useState<CategoryNode | null>(null);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatSlug, setNewCatSlug] = useState<string>('');
  const [newCatIcon, setNewCatIcon] = useState<string>('');

  const [movingCategory, setMovingCategory] = useState<CategoryNode | null>(null);
  const [targetParentId, setTargetParentId] = useState<string>('');

  const [archivingCategory, setArchivingCategory] = useState<CategoryNode | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');
  const [impactData, setImpactData] = useState<any | null>(null);
  const [_loadingImpact, setLoadingImpact] = useState<boolean>(false);

  const [specTemplateCategory, setSpecTemplateCategory] = useState<CategoryNode | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const fetchCategoryTree = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/tree?includeArchived=${includeArchived}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Kateqoriya ağacı yüklənə bilmədi.');
      const data = await res.json();
      setTree(data.tree || []);

      // Auto-expand all nodes on first load
      const allIds = new Set<string>();
      function collectIds(nodes: CategoryNode[]) {
        for (const n of nodes) {
          allIds.add(n.id);
          if (n.children?.length) collectIds(n.children);
        }
      }
      collectIds(data.tree || []);
      setExpandedNodes(allIds);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  useEffect(() => {
    fetchCategoryTree();
  }, [fetchCategoryTree]);

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Flatten tree for flat select lists
  const flattenTree = (nodes: CategoryNode[], result: CategoryNode[] = []) => {
    for (const node of nodes) {
      result.push(node);
      if (node.children?.length) flattenTree(node.children, result);
    }
    return result;
  };
  const flatCategories = flattenTree(tree);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('Kateqoriya adı mütləqdir.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          name: newCatName,
          slug: newCatSlug || undefined,
          icon: newCatIcon || undefined,
          parentId: creatingParent ? creatingParent.id : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Kateqoriya yaradıla bilmədi.');
      showToast(`"${newCatName}" kateqoriyası yaradıldı.`);
      setNewCatName('');
      setNewCatSlug('');
      setNewCatIcon('');
      setCreatingParent(null);
      setShowCreateModal(false);
      await fetchCategoryTree();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openArchiveModal = async (cat: CategoryNode) => {
    setArchivingCategory(cat);
    setReassignTargetId('');
    setImpactData(null);
    setLoadingImpact(true);
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}/impact`);
      if (res.ok) {
        const data = await res.json();
        setImpactData(data);
      }
    } catch {
    } finally {
      setLoadingImpact(false);
    }
  };

  const handleMoveCategory = async () => {
    if (!movingCategory) return;
    try {
      const version = movingCategory.version || 1;
      const res = await fetch(`/api/admin/categories/${movingCategory.id}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          'If-Match': `"v${version}"`,
        },
        body: JSON.stringify({
          newParentId: targetParentId === 'ROOT' ? null : targetParentId,
          expectedVersion: version,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.error || 'Kateqoriyanın daşınması uğursuz oldu.');
      showToast(`"${movingCategory.name}" uğurla daşındı.`);
      setMovingCategory(null);
      await fetchCategoryTree();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleArchiveCategory = async () => {
    if (!archivingCategory) return;
    try {
      const version = archivingCategory.version || 1;
      const res = await fetch(`/api/admin/categories/${archivingCategory.id}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          'If-Match': `"v${version}"`,
        },
        body: JSON.stringify({
          reassignToCategoryId: reassignTargetId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.error || 'Kateqoriyanı arxivləmək mümkün olmadı.');
      showToast(`"${archivingCategory.name}" kateqoriyası arxivləndi.`);
      setArchivingCategory(null);
      setReassignTargetId('');
      setImpactData(null);
      await fetchCategoryTree();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRestoreCategory = async (cat: CategoryNode) => {
    try {
      const version = cat.version || 1;
      const res = await fetch(`/api/admin/categories/${cat.id}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          'If-Match': `"v${version}"`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Kateqoriya bərpa edilə bilmədi.');
      showToast(`"${cat.name}" kateqoriyası bərpa edildi.`);
      await fetchCategoryTree();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleReorder = async (siblings: CategoryNode[], fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= siblings.length) return;
    const reordered = [...siblings];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const reorderPayload = reordered.map((item, index) => ({
      id: item.id,
      sortOrder: index,
    }));

    const parentId = siblings[0]?.parentId || null;
    let ifMatchHeader = '*';
    if (parentId) {
      const findInTree = (nodes: CategoryNode[]): CategoryNode | null => {
        for (const n of nodes) {
          if (n.id === parentId) return n;
          if (n.children && n.children.length) {
            const found = findInTree(n.children);
            if (found) return found;
          }
        }
        return null;
      };
      const parentNode = findInTree(tree);
      if (parentNode) {
        ifMatchHeader = `"v${parentNode.version || 1}"`;
      }
    }

    try {
      const res = await fetch('/api/admin/categories/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          'If-Match': ifMatchHeader,
        },
        body: JSON.stringify({ parentId, items: reorderPayload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Sıralama yenilənmədi.');
      await fetchCategoryTree();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Render a recursive tree node
  const renderTreeNode = (node: CategoryNode, siblings: CategoryNode[], index: number) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isRoot = node.depth === 1;

    return (
      <div
        key={node.id}
        className="category-tree-node"
        style={{ marginLeft: (node.depth - 1) * 20, marginBottom: 6 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: 8,
            background: node.isArchived ? 'rgba(0,0,0,0.03)' : theme.bgCard,
            border: `1px solid ${node.isArchived ? 'rgba(0,0,0,0.1)' : theme.border}`,
            opacity: node.isArchived ? 0.6 : 1,
            gap: 10,
          }}
        >
          {/* Left Title & Hierarchy */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(node.id)}
                aria-label={isExpanded ? 'Qrupu bağla' : 'Qrupu aç'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                }}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <div style={{ width: 16 }} />
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: isRoot ? 700 : 500,
              }}
            >
              <Folder size={16} color={theme.primary} />
              <span>{node.name}</span>
            </div>

            <span
              style={{
                fontSize: '0.75rem',
                color: theme.textMuted,
                background: 'rgba(0,0,0,0.05)',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              Dərinlik: {node.depth} | {node.path}
            </span>

            {node.isArchived && (
              <span
                style={{
                  fontSize: '0.72rem',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontWeight: 600,
                }}
              >
                Arxivlənib
              </span>
            )}
          </div>

          {/* Product Counts Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.8rem',
              color: theme.textMuted,
            }}
          >
            <span title="Birbaşa bu kateqoriyadakı məhsullar">
              <Box size={13} style={{ verticalAlign: 'middle', marginRight: 2 }} />
              {node.productCount} məhsul
            </span>
            {hasChildren && (
              <span
                title="Alt-kateqoriyalar daxil cəmi məhsullar"
                style={{ color: theme.primary, fontWeight: 600 }}
              >
                (Cəmi: {node.totalDescendantProducts})
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* View Products */}
            {onViewCategoryProducts && (
              <button
                onClick={() => onViewCategoryProducts(node.id)}
                aria-label="Bu kateqoriyanın məhsullarına bax"
                title="Bu kateqoriyanın məhsullarına bax"
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                <Eye size={13} />
              </button>
            )}

            {/* Reorder Up/Down */}
            <button
              disabled={index === 0}
              onClick={() => handleReorder(siblings, index, index - 1)}
              aria-label="Yuxarı daşı"
              title="Yuxarı daşı"
              style={{
                padding: '4px 6px',
                borderRadius: 6,
                border: `1px solid ${theme.border}`,
                background: 'transparent',
                cursor: index === 0 ? 'not-allowed' : 'pointer',
                opacity: index === 0 ? 0.3 : 1,
              }}
            >
              <ArrowUp size={13} />
            </button>
            <button
              disabled={index === siblings.length - 1}
              onClick={() => handleReorder(siblings, index, index + 1)}
              aria-label="Aşağı daşı"
              title="Aşağı daşı"
              style={{
                padding: '4px 6px',
                borderRadius: 6,
                border: `1px solid ${theme.border}`,
                background: 'transparent',
                cursor: index === siblings.length - 1 ? 'not-allowed' : 'pointer',
                opacity: index === siblings.length - 1 ? 0.3 : 1,
              }}
            >
              <ArrowDown size={13} />
            </button>

            {/* Add Subcategory (if depth < 4) */}
            {node.depth < 4 && !node.isArchived && (
              <button
                onClick={() => {
                  setCreatingParent(node);
                  setNewCatName('');
                  setNewCatSlug('');
                  setShowCreateModal(true);
                }}
                aria-label="Alt-kateqoriya əlavə et"
                title="Alt-kateqoriya əlavə et"
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <FolderPlus size={13} /> + Alt
              </button>
            )}

            {/* Move / Reparent */}
            {!node.isArchived && (
              <button
                onClick={() => {
                  setMovingCategory(node);
                  setTargetParentId(node.parentId || 'ROOT');
                }}
                aria-label="Valideyn kateqoriyanı dəyiş (Daşı)"
                title="Valideyn kateqoriyanı dəyiş (Daşı)"
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                <Move size={13} /> Daşı
              </button>
            )}

            {/* Spec Templates */}
            <button
              onClick={() => setSpecTemplateCategory(node)}
              aria-label="Xüsusiyyət şablonlarını idarə et"
              title="Xüsusiyyət şablonlarını idarə et"
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: `1px solid ${theme.border}`,
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Layers size={13} /> Şablonlar
            </button>

            {/* Archive / Restore */}
            {node.isArchived ? (
              <button
                onClick={() => handleRestoreCategory(node)}
                aria-label="Arxivdən bərpa et"
                title="Arxivdən bərpa et"
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#10b981',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <RotateCcw size={13} /> Bərpa et
              </button>
            ) : (
              <button
                onClick={() => openArchiveModal(node)}
                aria-label="Kateqoriyanı arxivlə"
                title="Kateqoriyanı arxivlə"
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                <Archive size={13} /> Arxivlə
              </button>
            )}
          </div>
        </div>

        {/* Recursive Children */}
        {hasChildren && isExpanded && (
          <div style={{ marginTop: 4 }}>
            {node.children.map((child, cIdx) => renderTreeNode(child, node.children, cIdx))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="category-tree-manager" style={{ color: theme.text }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <FolderTree size={24} color={theme.primary} />
            Çoxsəviyyəli Kateqoriya Taksonomiyası (PIM v2)
          </h2>
          <p style={{ margin: '4px 0 0', color: theme.textMuted, fontSize: '0.88rem' }}>
            Maksimum 4 dərinlikli iyerarxiya, dövrə (cycle) qoruması və təhlükəsiz arxivləmə.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />
            Arxivlənmişləri göstər
          </label>

          <button
            onClick={() => {
              setCreatingParent(null);
              setNewCatName('');
              setNewCatSlug('');
              setShowCreateModal(true);
            }}
            className="admin-action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: theme.primary,
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <FolderPlus size={16} /> Yeni Əsas Kateqoriya
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            marginBottom: 16,
            background:
              feedbackMsg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            color: feedbackMsg.type === 'error' ? '#ef4444' : '#10b981',
            border: `1px solid ${feedbackMsg.type === 'error' ? '#ef4444' : '#10b981'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.9rem',
          }}
        >
          {feedbackMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {feedbackMsg.text}
        </div>
      )}

      {/* Tree View Container */}
      <div
        style={{
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          padding: 16,
        }}
      >
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: theme.textMuted }}>
            Kateqoriya strukturu yüklənir...
          </div>
        ) : tree.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: theme.textMuted }}>
            Heç bir kateqoriya tapılmadı.
          </div>
        ) : (
          <div>{tree.map((rootNode, index) => renderTreeNode(rootNode, tree, index))}</div>
        )}
      </div>

      {/* Create / Subcategory Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <div
            style={{
              background: theme.bgCard,
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              padding: 24,
              width: '100%',
              maxWidth: 440,
            }}
          >
            <h3 style={{ margin: '0 0 14px', fontSize: '1.2rem' }}>
              {creatingParent
                ? `"${creatingParent.name}" altına alt-kateqoriya`
                : 'Yeni Əsas Kateqoriya'}
            </h3>
            <form
              onSubmit={handleCreateCategory}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <label>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Kateqoriya Adı *</span>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="məs. Daxili quraşdırılan plitələr"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid ${theme.border}`,
                    marginTop: 4,
                  }}
                />
              </label>
              <label>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Slug (URL hissəsi)</span>
                <input
                  type="text"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  placeholder="avtomatik generasiya olunur"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid ${theme.border}`,
                    marginTop: 4,
                  }}
                />
              </label>
              <label>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>İkon adı (Lucide)</span>
                <input
                  type="text"
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  placeholder="Flame, Snowflake, Wind, Box..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid ${theme.border}`,
                    marginTop: 4,
                  }}
                />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: `1px solid ${theme.border}`,
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: theme.primary,
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Yarat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move / Reparent Modal */}
      {movingCategory && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <div
            style={{
              background: theme.bgCard,
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              padding: 24,
              width: '100%',
              maxWidth: 440,
            }}
          >
            <h3 style={{ margin: '0 0 14px', fontSize: '1.2rem' }}>Kateqoriyanı Daşı</h3>
            <p style={{ fontSize: '0.85rem', color: theme.textMuted, margin: '0 0 12px' }}>
              <b>"{movingCategory.name}"</b> kateqoriyasının yeni valideynini seçin:
            </p>
            <select
              value={targetParentId}
              onChange={(e) => setTargetParentId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${theme.border}`,
                marginBottom: 16,
              }}
            >
              <option value="ROOT">📁 Əsas Səviyyə (Root - Valideyinsiz)</option>
              {flatCategories
                .filter((c) => c.id !== movingCategory.id && !c.isArchived)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {'- '.repeat(c.depth - 1)} {c.name} ({c.path})
                  </option>
                ))}
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setMovingCategory(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                İmtina
              </button>
              <button
                onClick={handleMoveCategory}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: theme.primary,
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Daşımanı Təsdiqlə
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Archive Modal (Active Products Protection) */}
      {archivingCategory && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <div
            style={{
              background: theme.bgCard,
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              padding: 24,
              width: '100%',
              maxWidth: 460,
            }}
          >
            <h3
              style={{
                margin: '0 0 10px',
                fontSize: '1.2rem',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Archive size={20} /> Kateqoriyanı Arxivlə
            </h3>
            <p style={{ fontSize: '0.85rem', margin: '0 0 12px' }}>
              <b>"{archivingCategory.name}"</b> kateqoriyası arxivlənəcək. (Tam silinmə
              təhlükəsizlik qaydalarına əsasən qadağandır).
            </p>

            {impactData?.totalAffectedProducts > 0 || archivingCategory.productCount > 0 ? (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#ef4444',
                    marginBottom: 6,
                  }}
                >
                  ⚠️ Təsir Analizi:{' '}
                  {impactData ? impactData.totalAffectedProducts : archivingCategory.productCount}{' '}
                  aktiv məhsul aşkarlandı!
                </div>
                {impactData && (
                  <div style={{ fontSize: '0.78rem', color: theme.text, marginBottom: 8 }}>
                    • Birbaşa məhsullar: <b>{impactData.directProductCount}</b>
                    <br />• Alt-kateqoriyalar: <b>{impactData.descendantCount}</b> (Məhsullar:{' '}
                    <b>{impactData.descendantProductCount}</b>)
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', color: theme.textMuted, marginBottom: 8 }}>
                  Məhsulların yetim (orfan) qalmaması üçün onların köçürüləcəyi hədəf kateqoriyanı
                  seçin:
                </div>
                <select
                  required
                  value={reassignTargetId}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <option value="">-- Hədəf Kateqoriya Seçin --</option>
                  {flatCategories
                    .filter((c) => {
                      if (c.id === archivingCategory.id || c.isArchived) return false;
                      if (impactData?.descendantIds?.includes(c.id)) return false;
                      return true;
                    })
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.path})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: theme.textMuted, marginBottom: 16 }}>
                Bu kateqoriyada və alt-kateqoriyalarında aktiv məhsul yoxdur. Birbaşa arxivlənə
                bilər.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setArchivingCategory(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                İmtina
              </button>
              <button
                disabled={
                  (impactData
                    ? impactData.totalAffectedProducts > 0
                    : archivingCategory.productCount > 0) && !reassignTargetId
                }
                onClick={handleArchiveCategory}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  cursor:
                    (impactData
                      ? impactData.totalAffectedProducts > 0
                      : archivingCategory.productCount > 0) && !reassignTargetId
                      ? 'not-allowed'
                      : 'pointer',
                  fontWeight: 600,
                  opacity:
                    (impactData
                      ? impactData.totalAffectedProducts > 0
                      : archivingCategory.productCount > 0) && !reassignTargetId
                      ? 0.5
                      : 1,
                }}
              >
                Arxivlə
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Spec Template Editor Modal */}
      {specTemplateCategory && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: 16,
          }}
        >
          <div style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
            <CategorySpecTemplateEditor
              categoryId={specTemplateCategory.id}
              categoryName={specTemplateCategory.name}
              theme={theme}
              csrfToken={csrfToken}
              onClose={() => setSpecTemplateCategory(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
