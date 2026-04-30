// To turn category list into a tree structure for easier navigation and display in the frontend

export interface CategoryNode {
  name: string;
  path: string;
  subcategories?: CategoryNode[];
}

export interface FlatCategoryItem {
  name: string;
  path: string;
  parentPath: string | null;
  isSubcategory: boolean;
}

/**
 * @param categories - Array of category paths (e.g., ["announcements", "announcements/births"])
 * @returns Hierarchical tree of categories with subcategories
 */
export function buildCategoryTree(categories: string[]): CategoryNode[] {
  const root: CategoryNode[] = [];
  const nodeMap = new Map<string, CategoryNode>();

  // Sort categories to ensure parents come before children
  const sortedCategories = [...categories].sort();

  for (const categoryPath of sortedCategories) {
    const parts = categoryPath.split('/');
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      // Skip if we've already processed this node
      if (nodeMap.has(currentPath)) {
        continue;
      }

      // Create the node
      const node: CategoryNode = {
        name: part,
        path: currentPath,
        subcategories: []
      };

      nodeMap.set(currentPath, node);

      // Add to parent or root
      if (parentPath && nodeMap.has(parentPath)) {
        const parent = nodeMap.get(parentPath)!;
        if (!parent.subcategories) {
          parent.subcategories = [];
        }
        parent.subcategories.push(node);
      } else if (i === 0) {
        // Top-level category
        root.push(node);
      }
    }
  }

  // Clean up empty subcategories arrays for leaf nodes
  const cleanEmptySubcategories = (nodes: CategoryNode[]) => {
    for (const node of nodes) {
      if (node.subcategories && node.subcategories.length > 0) {
        cleanEmptySubcategories(node.subcategories);
      } else {
        delete node.subcategories;
      }
    }
  };

  cleanEmptySubcategories(root);

  return root;
}

/**
 * Converts hierarchical category tree to a flat list with metadata
 * @param tree - Hierarchical category tree
 * @returns Flat list of categories with parent information
 */
export function flattenCategoryTree(tree: CategoryNode[]): FlatCategoryItem[] {
  const result: FlatCategoryItem[] = [];

  const traverse = (nodes: CategoryNode[], parentPath: string | null = null) => {
    for (const node of nodes) {
      const isSubcategory = parentPath !== null;
      result.push({
        name: node.name,
        path: node.path,
        parentPath,
        isSubcategory,
      });

      if (node.subcategories && node.subcategories.length > 0) {
        traverse(node.subcategories, node.path);
      }
    }
  };

  traverse(tree);
  return result;
}
