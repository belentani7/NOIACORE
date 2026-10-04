/* ================================================================
   NEXUS OS — Virtual Filesystem
   ================================================================
   In-memory filesystem with tree structure, CRUD operations,
   path resolution, permissions, search, serialization,
   and trash/recycle bin support.
   ================================================================ */

(function (global) {
  'use strict';

  // ============================================================
  // SECTION 1: FILE SYSTEM NODE — Base class for files/folders
  // ============================================================

  /**
   * @typedef {'folder'|'text'|'json'|'image'|'audio'|'video'|'app'|'binary'} NodeType
   */

  class FSNode {
    /**
     * @param {object} config
     * @param {string} config.name - File/folder name
     * @param {NodeType} config.type - Node type
     * @param {FSNode|null} [config.parent] - Parent node
     * @param {string} [config.content] - File content (for text/json)
     * @param {object} [config.metadata] - Extra metadata
     */
    constructor(config) {
      /** @type {string} Unique ID */
      this.id = 'fs_' + Math.random().toString(36).substr(2, 9);

      /** @type {string} Display name */
      this.name = config.name;

      /** @type {NodeType} */
      this.type = config.type || 'text';

      /** @type {FSNode|null} Parent reference */
      this.parent = config.parent || null;

      /** @type {Map<string, FSNode>} Children (for folders) */
      this.children = new Map();

      /** @type {string} File content */
      this.content = config.content || '';

      /** @type {object} File metadata */
      this.metadata = {
        created: new Date(),
        modified: new Date(),
        size: 0,
        permissions: { read: true, write: true, execute: false },
        ...(config.metadata || {}),
      };

      // Calculate size from content
      if (this.content) {
        this.metadata.size = new Blob([this.content]).size;
      }
    }

    /** Is this a folder? */
    get isFolder() {
      return this.type === 'folder';
    }

    /** Is this a file? */
    get isFile() {
      return this.type !== 'folder';
    }

    /** Get full path */
    get path() {
      const parts = [];
      let node = this;
      while (node) {
        parts.unshift(node.name);
        node = node.parent;
      }
      return '/' + parts.join('/');
    }

    /** Get child count (folders only) */
    get childCount() {
      return this.children.size;
    }

    /** Get extension (for files) */
    get extension() {
      const parts = this.name.split('.');
      return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    }

    /**
     * Add a child node (folders only)
     * @param {FSNode} child
     * @returns {FSNode} The added child
     */
    addChild(child) {
      if (!this.isFolder) {
        throw new Error(`Cannot add child to non-folder node: ${this.name}`);
      }
      if (this.children.has(child.name)) {
        throw new Error(`Child "${child.name}" already exists in "${this.name}"`);
      }
      child.parent = this;
      this.children.set(child.name, child);
      this.metadata.modified = new Date();
      return child;
    }

    /**
     * Remove a child node (folders only)
     * @param {string} name - Child name
     * @returns {FSNode|null} The removed child
     */
    removeChild(name) {
      const child = this.children.get(name);
      if (child) {
        child.parent = null;
        this.children.delete(name);
        this.metadata.modified = new Date();
      }
      return child || null;
    }

    /**
     * Get a child by name
     * @param {string} name
     * @returns {FSNode|undefined}
     */
    getChild(name) {
      return this.children.get(name);
    }

    /**
     * Check if a child exists
     * @param {string} name
     * @returns {boolean}
     */
    hasChild(name) {
      return this.children.has(name);
    }

    /**
     * List all children
     * @returns {FSNode[]}
     */
    listChildren() {
      return Array.from(this.children.values());
    }

    /**
     * Rename this node
     * @param {string} newName
     */
    rename(newName) {
      if (!newName || !newName.trim()) {
        throw new Error('Name cannot be empty');
      }

      const oldName = this.name;
      this.name = newName.trim();
      this.metadata.modified = new Date();

      // Update parent's children map
      if (this.parent) {
        this.parent.children.delete(oldName);
        this.parent.children.set(this.name, this);
        this.parent.metadata.modified = new Date();
      }
    }

    /**
     * Get a serialized representation
     * @returns {object}
     */
    serialize() {
      const data = {
        id: this.id,
        name: this.name,
        type: this.type,
        content: this.content,
        metadata: {
          created: this.metadata.created.toISOString(),
          modified: this.metadata.modified.toISOString(),
          size: this.metadata.size,
          permissions: { ...this.metadata.permissions },
        },
        children: {},
      };

      if (this.isFolder) {
        for (const [name, child] of this.children) {
          data.children[name] = child.serialize();
        }
      }

      return data;
    }

    /**
     * Restore from serialized data
     * @param {object} data
     * @param {FSNode|null} parent
     * @returns {FSNode}
     */
    static deserialize(data, parent = null) {
      const node = new FSNode({
        name: data.name,
        type: data.type,
        parent: parent,
        content: data.content || '',
        metadata: {
          created: new Date(data.metadata?.created || Date.now()),
          modified: new Date(data.metadata?.modified || Date.now()),
          size: data.metadata?.size || 0,
          permissions: data.metadata?.permissions || { read: true, write: true, execute: false },
        },
      });

      node.id = data.id || node.id;

      if (data.children) {
        for (const [name, childData] of Object.entries(data.children)) {
          const child = FSNode.deserialize(childData, node);
          node.children.set(name, child);
        }
      }

      return node;
    }
  }


  // ============================================================
  // SECTION 2: VIRTUAL FILESYSTEM
  // ============================================================

  class VirtualFilesystem {
    constructor() {
      /** @type {FSNode} Root node */
      this.root = null;

      /** @type {FSNode[]} Trash bin */
      this._trash = [];

      /** @type {string} Storage key for localStorage */
      this._storageKey = 'nexus_filesystem';

      /** @type {number} Max localStorage size (bytes) */
      this._maxStorageSize = 5 * 1024 * 1024; // 5MB
    }

    /**
     * Initialize the filesystem — load from storage or create default structure
     */
    init() {
      // Try loading from localStorage
      if (!this._load()) {
        // Create default directory structure
        this._createDefaultStructure();
      }

      console.log('[Filesystem] Initialized. Root children:', this.root.childCount);
    }

    // ==========================================================
    // PATH RESOLUTION
    // ==========================================================

    /**
     * Resolve a path to a node
     * @param {string} path - Absolute path (e.g., "/Desktop/myfile.txt")
     * @returns {FSNode|null}
     */
    resolve(path) {
      if (!path || path === '/') return this.root;

      // Normalize path
      const parts = path.split('/').filter(p => p.length > 0);

      let current = this.root;

      for (const part of parts) {
        if (!current.isFolder) return null;

        // Handle . and ..
        if (part === '.') continue;
        if (part === '..') {
          current = current.parent || this.root;
          continue;
        }

        const child = current.getChild(part);
        if (!child) return null;
        current = child;
      }

      return current;
    }

    /**
     * Resolve a path relative to a base node
     * @param {string} path - Relative path
     * @param {FSNode} base - Base node
     * @returns {FSNode|null}
     */
    resolveRelative(path, base) {
      if (path.startsWith('/')) {
        return this.resolve(path);
      }

      const parts = path.split('/').filter(p => p.length > 0);
      let current = base;

      for (const part of parts) {
        if (part === '.') continue;
        if (part === '..') {
          current = current.parent || this.root;
          continue;
        }

        if (!current.isFolder) return null;
        const child = current.getChild(part);
        if (!child) return null;
        current = child;
      }

      return current;
    }

    // ==========================================================
    // CRUD OPERATIONS
    // ==========================================================

    /**
     * Create a new file or folder
     * @param {string} parentPath - Path of parent folder
     * @param {string} name - Name of new node
     * @param {NodeType} type - Type of node
     * @param {string} [content=''] - Initial content
     * @returns {FSNode|null} The created node, or null on failure
     */
    create(parentPath, name, type = 'text', content = '') {
      const parent = this.resolve(parentPath);
      if (!parent || !parent.isFolder) {
        console.warn(`[FS] Parent folder not found: ${parentPath}`);
        return null;
      }

      if (parent.hasChild(name)) {
        console.warn(`[FS] "${name}" already exists in ${parentPath}`);
        return null;
      }

      const node = new FSNode({
        name,
        type,
        parent,
        content,
      });

      parent.addChild(node);
      this._save();
      this._emit('create', node);
      return node;
    }

    /**
     * Create a folder
     * @param {string} parentPath
     * @param {string} name
     * @returns {FSNode|null}
     */
    mkdir(parentPath, name) {
      return this.create(parentPath, name, 'folder');
    }

    /**
     * Read file content
     * @param {string} path - File path
     * @returns {string|null} File content, or null
     */
    read(path) {
      const node = this.resolve(path);
      if (!node || node.isFolder) return null;
      return node.content;
    }

    /**
     * Update file content
     * @param {string} path - File path
     * @param {string} content - New content
     * @returns {boolean} Success
     */
    write(path, content) {
      const node = this.resolve(path);
      if (!node || node.isFolder) return false;
      if (!node.metadata.permissions.write) {
        console.warn(`[FS] Permission denied: write ${path}`);
        return false;
      }

      node.content = content;
      node.metadata.size = new Blob([content]).size;
      node.metadata.modified = new Date();
      this._save();
      this._emit('write', node);
      return true;
    }

    /**
     * Delete a node (moves to trash)
     * @param {string} path - Path to delete
     * @returns {boolean} Success
     */
    delete(path) {
      const node = this.resolve(path);
      if (!node || node === this.root) return false;

      // Move to trash
      this._trash.push({
        node,
        originalPath: node.path,
        deletedAt: new Date(),
      });

      // Remove from parent
      if (node.parent) {
        node.parent.removeChild(node.name);
      }

      this._save();
      this._emit('delete', node, path);
      return true;
    }

    /**
     * Permanently delete (no trash)
     * @param {string} path
     * @returns {boolean}
     */
    forceDelete(path) {
      const node = this.resolve(path);
      if (!node || node === this.root) return false;

      if (node.parent) {
        node.parent.removeChild(node.name);
      }

      this._save();
      this._emit('forceDelete', node, path);
      return true;
    }

    /**
     * Move/rename a node
     * @param {string} sourcePath - Current path
     * @param {string} destPath - Destination path (full new path including name)
     * @returns {boolean} Success
     */
    move(sourcePath, destPath) {
      const source = this.resolve(sourcePath);
      if (!source || source === this.root) return false;

      // Parse destination
      const destParts = destPath.split('/').filter(p => p.length > 0);
      const newName = destParts.pop();
      const destParentPath = '/' + destParts.join('/');

      const destParent = this.resolve(destParentPath || '/');
      if (!destParent || !destParent.isFolder) return false;

      // Prevent moving into self
      let check = destParent;
      while (check) {
        if (check === source) return false;
        check = check.parent;
      }

      // Remove from old parent
      if (source.parent) {
        source.parent.removeChild(source.name);
      }

      // Rename and add to new parent
      source.name = newName;
      destParent.addChild(source);

      this._save();
      this._emit('move', source, sourcePath, destPath);
      return true;
    }

    /**
     * Copy a node
     * @param {string} sourcePath
     * @param {string} destPath - Destination directory
     * @param {string} [newName] - Optional new name
     * @returns {FSNode|null}
     */
    copy(sourcePath, destPath, newName) {
      const source = this.resolve(sourcePath);
      if (!source) return null;

      const destParent = this.resolve(destPath);
      if (!destParent || !destParent.isFolder) return null;

      // Deep clone via serialization
      const serialized = source.serialize();
      const clone = FSNode.deserialize(serialized, destParent);
      clone.id = 'fs_' + Math.random().toString(36).substr(2, 9);

      if (newName) {
        clone.name = newName;
      } else {
        // Auto-generate unique name
        clone.name = this._uniqueName(destParent, source.name);
      }

      // Assign new IDs to all descendants
      this._reassignIds(clone);

      destParent.addChild(clone);
      this._save();
      this._emit('copy', clone, sourcePath, destPath);
      return clone;
    }

    /**
     * List contents of a directory
     * @param {string} path
     * @returns {Array<{name: string, type: NodeType, size: number, modified: Date}>}
     */
    list(path) {
      const node = this.resolve(path);
      if (!node || !node.isFolder) return [];

      return node.listChildren().map(child => ({
        name: child.name,
        type: child.type,
        size: child.metadata.size,
        modified: child.metadata.modified,
        path: child.path,
      }));
    }

    /**
     * Check if a path exists
     * @param {string} path
     * @returns {boolean}
     */
    exists(path) {
      return this.resolve(path) !== null;
    }

    /**
     * Get node info/metadata
     * @param {string} path
     * @returns {object|null}
     */
    info(path) {
      const node = this.resolve(path);
      if (!node) return null;

      return {
        id: node.id,
        name: node.name,
        type: node.type,
        path: node.path,
        isFolder: node.isFolder,
        extension: node.extension,
        size: node.metadata.size,
        created: node.metadata.created,
        modified: node.metadata.modified,
        permissions: node.metadata.permissions,
        childCount: node.isFolder ? node.childCount : 0,
      };
    }

    // ==========================================================
    // SEARCH
    // ==========================================================

    /**
     * Search for files by name
     * @param {string} query
     * @param {string} [basePath='/'] - Search scope
     * @param {number} [limit=50]
     * @returns {Array}
     */
    searchByName(query, basePath = '/', limit = 50) {
      const base = this.resolve(basePath);
      if (!base) return [];

      const q = query.toLowerCase();
      const results = [];

      this._walkTree(base, (node) => {
        if (node.name.toLowerCase().includes(q)) {
          results.push({
            name: node.name,
            path: node.path,
            type: node.type,
            size: node.metadata.size,
          });
        }
        return results.length < limit;
      });

      return results;
    }

    /**
     * Search for files by content
     * @param {string} query
     * @param {string} [basePath='/']
     * @param {number} [limit=50]
     * @returns {Array}
     */
    searchByContent(query, basePath = '/', limit = 50) {
      const base = this.resolve(basePath);
      if (!base) return [];

      const q = query.toLowerCase();
      const results = [];

      this._walkTree(base, (node) => {
        if (node.isFile && node.content && node.content.toLowerCase().includes(q)) {
          results.push({
            name: node.name,
            path: node.path,
            type: node.type,
            size: node.metadata.size,
            matchPreview: this._getMatchPreview(node.content, q),
          });
        }
        return results.length < limit;
      });

      return results;
    }

    /**
     * Search by both name and content
     * @param {string} query
     * @param {string} [basePath='/']
     * @param {number} [limit=50]
     * @returns {Array}
     */
    search(query, basePath = '/', limit = 50) {
      const byName = this.searchByName(query, basePath, limit);
      const byContent = this.searchByContent(query, basePath, limit);

      // Merge and deduplicate by path
      const seen = new Set();
      const merged = [];

      for (const r of byName) {
        if (!seen.has(r.path)) {
          seen.add(r.path);
          merged.push({ ...r, matchType: 'name' });
        }
      }

      for (const r of byContent) {
        if (!seen.has(r.path)) {
          seen.add(r.path);
          merged.push({ ...r, matchType: 'content' });
        }
      }

      return merged.slice(0, limit);
    }

    // ==========================================================
    // TRASH / RECYCLE BIN
    // ==========================================================

    /**
     * Get all items in trash
     * @returns {Array}
     */
    getTrash() {
      return this._trash.map(item => ({
        node: item.node,
        name: item.node.name,
        originalPath: item.originalPath,
        deletedAt: item.deletedAt,
        type: item.node.type,
      }));
    }

    /**
     * Restore an item from trash
     * @param {number} index - Index in trash array
     * @returns {boolean}
     */
    restoreFromTrash(index) {
      if (index < 0 || index >= this._trash.length) return false;

      const item = this._trash[index];
      const originalParent = item.originalPath.split('/').slice(0, -1).join('/') || '/';
      const parent = this.resolve(originalParent);

      if (!parent || !parent.isFolder) {
        // Original location gone — restore to root
        this.root.addChild(item.node);
      } else {
        // Check for name conflict
        if (parent.hasChild(item.node.name)) {
          item.node.name = this._uniqueName(parent, item.node.name);
        }
        parent.addChild(item.node);
      }

      this._trash.splice(index, 1);
      this._save();
      this._emit('restore', item.node);
      return true;
    }

    /**
     * Empty the trash permanently
     */
    emptyTrash() {
      this._trash = [];
      this._save();
      this._emit('emptyTrash');
    }

    /**
     * Get trash count
     * @returns {number}
     */
    get trashCount() {
      return this._trash.length;
    }

    // ==========================================================
    // SERIALIZATION
    // ==========================================================

    /**
     * Serialize entire filesystem to JSON
     * @returns {object}
     */
    serialize() {
      return {
        root: this.root.serialize(),
        trash: this._trash.map(t => ({
          node: t.node.serialize(),
          originalPath: t.originalPath,
          deletedAt: t.deletedAt.toISOString(),
        })),
      };
    }

    /**
     * Save to localStorage
     * @private
     */
    _save() {
      try {
        const data = JSON.stringify(this.serialize());
        if (data.length > this._maxStorageSize) {
          console.warn('[FS] Data exceeds storage limit, skipping save');
          return;
        }
        localStorage.setItem(this._storageKey, data);
      } catch (e) {
        console.warn('[FS] Failed to save to localStorage:', e);
      }
    }

    /**
     * Load from localStorage
     * @returns {boolean} True if loaded successfully
     * @private
     */
    _load() {
      try {
        const raw = localStorage.getItem(this._storageKey);
        if (!raw) return false;

        const data = JSON.parse(raw);
        this.root = FSNode.deserialize(data.root, null);

        // Restore trash
        this._trash = (data.trash || []).map(t => ({
          node: FSNode.deserialize(t.node, null),
          originalPath: t.originalPath,
          deletedAt: new Date(t.deletedAt),
        }));

        return true;
      } catch (e) {
        console.warn('[FS] Failed to load from localStorage:', e);
        return false;
      }
    }

    // ==========================================================
    // DEFAULT STRUCTURE
    // ==========================================================

    /**
     * Create the default directory structure
     * @private
     */
    _createDefaultStructure() {
      // Root
      this.root = new FSNode({ name: '', type: 'folder' });

      // Top-level directories
      const desktop = this.mkdir('/', 'Desktop');
      const documents = this.mkdir('/', 'Documents');
      const music = this.mkdir('/', 'Music');
      const pictures = this.mkdir('/', 'Pictures');
      const videos = this.mkdir('/', 'Videos');
      const apps = this.mkdir('/', 'Apps');
      const system = this.mkdir('/', 'System');
      const downloads = this.mkdir('/', 'Downloads');

      // Sample files
      this.create('/Desktop', 'welcome.txt', 'text',
        'Welcome to NEXUS OS!\n\n' +
        'This is your desktop. You can:\n' +
        '- Right-click for context menu\n' +
        '- Double-click icons to open apps\n' +
        '- Press Ctrl+K to search\n' +
        '- Press Ctrl+L to lock screen\n\n' +
        'Explore the Start Menu for all applications.\n' +
        'Enjoy the neon glass experience!'
      );

      this.create('/Desktop', 'readme.txt', 'text',
        'NEXUS OS v1.0\n' +
        '─────────────────\n' +
        'A web-based operating system with neon glassmorphism aesthetic.\n' +
        'Built with vanilla JavaScript, CSS, and HTML5.\n\n' +
        'Features:\n' +
        '• Window management (drag, resize, snap, maximize)\n' +
        '• Virtual filesystem with persistence\n' +
        '• Multiple workspaces\n' +
        '• Notification system\n' +
        '• Global search (Ctrl+K)\n' +
        '• 35+ applications\n'
      );

      this.create('/Documents', 'notes.txt', 'text',
        'My Notes\n========\n\n- Explore all NEXUS apps\n- Customize themes\n- Try window snapping'
      );

      this.create('/Documents', 'project-plan.json', 'json',
        JSON.stringify({
          project: 'NEXUS OS',
          version: '1.0.0',
          status: 'active',
          features: [
            'Window Manager',
            'Virtual Filesystem',
            'Taskbar & Start Menu',
            'Notification System',
            'Multiple Workspaces',
            'Context Menus',
            'Search Overlay',
          ],
          priorities: {
            high: ['Performance', 'Stability'],
            medium: ['New apps', 'Themes'],
            low: ['Easter eggs', 'Animations'],
          }
        }, null, 2)
      );

      this.create('/System', 'config.json', 'json',
        JSON.stringify({
          os: 'NEXUS OS',
          version: '1.0.0',
          build: '2026.09.01',
          kernel: 'NexusKernel v4.2',
          architecture: 'web',
        }, null, 2)
      );

      this.create('/System', 'log.txt', 'text',
        '[BOOT] System initialized successfully\n' +
        '[FS] Virtual filesystem mounted\n' +
        '[WM] Window manager started\n' +
        '[NET] Network interfaces detected\n' +
        '[UI] Desktop environment loaded\n'
      );

      this._save();
    }

    // ==========================================================
    // INTERNAL HELPERS
    // ==========================================================

    /**
     * Walk the file tree, calling callback for each node
     * @param {FSNode} node
     * @param {Function} callback - Return false to stop
     * @private
     */
    _walkTree(node, callback) {
      const shouldContinue = callback(node);
      if (shouldContinue === false) return;

      if (node.isFolder) {
        for (const child of node.children.values()) {
          this._walkTree(child, callback);
        }
      }
    }

    /**
     * Generate a unique name in a directory
     * @param {FSNode} parent
     * @param {string} baseName
     * @returns {string}
     * @private
     */
    _uniqueName(parent, baseName) {
      if (!parent.hasChild(baseName)) return baseName;

      const ext = baseName.includes('.') ? '.' + baseName.split('.').pop() : '';
      const nameWithoutExt = ext ? baseName.slice(0, -ext.length) : baseName;

      let counter = 1;
      let candidate;
      do {
        candidate = `${nameWithoutExt} (${counter})${ext}`;
        counter++;
      } while (parent.hasChild(candidate));

      return candidate;
    }

    /**
     * Get a preview snippet of content around a match
     * @param {string} content
     * @param {string} query
     * @param {number} [context=40]
     * @returns {string}
     * @private
     */
    _getMatchPreview(content, query, context = 40) {
      const idx = content.toLowerCase().indexOf(query);
      if (idx === -1) return content.substring(0, 80);

      const start = Math.max(0, idx - context);
      const end = Math.min(content.length, idx + query.length + context);

      let preview = '';
      if (start > 0) preview += '...';
      preview += content.substring(start, end);
      if (end < content.length) preview += '...';

      return preview;
    }

    /**
     * Reassign IDs for a cloned tree
     * @param {FSNode} node
     * @private
     */
    _reassignIds(node) {
      node.id = 'fs_' + Math.random().toString(36).substr(2, 9);
      if (node.isFolder) {
        for (const child of node.children.values()) {
          this._reassignIds(child);
        }
      }
    }

    /**
     * Emit a filesystem event
     * @param {string} event
     * @param  {...any} args
     * @private
     */
    _emit(event, ...args) {
      if (typeof NexusKernel !== 'undefined' && NexusKernel.events) {
        NexusKernel.events.emit(`fs:${event}`, ...args);
      }
    }

    // ==========================================================
    // CONVENIENCE METHODS
    // ==========================================================

    /**
     * Get total size of all files
     * @returns {number} bytes
     */
    getTotalSize() {
      let total = 0;
      this._walkTree(this.root, (node) => {
        if (node.isFile) total += node.metadata.size;
      });
      return total;
    }

    /**
     * Count all files (not folders)
     * @returns {number}
     */
    getFileCount() {
      let count = 0;
      this._walkTree(this.root, (node) => {
        if (node.isFile) count++;
      });
      return count;
    }

    /**
     * Count all folders
     * @returns {number}
     */
    getFolderCount() {
      let count = 0;
      this._walkTree(this.root, (node) => {
        if (node.isFolder && node !== this.root) count++;
      });
      return count;
    }

    /**
     * Get tree as a flat array
     * @returns {Array<{name, path, type, depth}>}
     */
    flatten() {
      const result = [];
      const walk = (node, depth) => {
        result.push({
          name: node.name || '/',
          path: node.path,
          type: node.type,
          depth,
        });
        if (node.isFolder) {
          for (const child of node.children.values()) {
            walk(child, depth + 1);
          }
        }
      };
      walk(this.root, 0);
      return result;
    }

    /**
     * Format bytes to human readable
     * @param {number} bytes
     * @returns {string}
     */
    formatSize(bytes) {
      if (bytes === 0) return '0 B';
      const units = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
    }
  }


  // ============================================================
  // SECTION 3: CREATE AND EXPOSE GLOBAL INSTANCE
  // ============================================================

  const fs = new VirtualFilesystem();

  // Expose globally
  global.NexusFS = fs;

  // Initialize immediately (before kernel, since kernel may use it)
  fs.init();

})(window);
