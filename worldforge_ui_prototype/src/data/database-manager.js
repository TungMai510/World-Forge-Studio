const DATABASE_NAME = 'worldforge-studio';
const DATABASE_VERSION = 1;

export class DatabaseManager {
    constructor() {
        this.databasePromise = null;
    }

    open() {
        if (!('indexedDB' in window)) {
            return Promise.reject(new Error('IndexedDB is not available in this browser.'));
        }

        if (!this.databasePromise) {
            this.databasePromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

                request.onupgradeneeded = () => {
                    const database = request.result;
                    if (!database.objectStoreNames.contains('projects')) {
                        database.createObjectStore('projects', { keyPath: 'id' });
                    }
                    if (!database.objectStoreNames.contains('recentProjects')) {
                        database.createObjectStore('recentProjects', { keyPath: 'projectId' });
                    }
                };

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => {
                    this.databasePromise = null;
                    reject(request.error || new Error('Unable to open the project database.'));
                };
                request.onblocked = () => {
                    this.databasePromise = null;
                    reject(new Error('The project database is blocked by another open window.'));
                };
            });
        }

        return this.databasePromise;
    }

    async request(storeName, mode, operation) {
        const database = await this.open();

        return new Promise((resolve, reject) => {
            let result;
            let settled = false;
            const transaction = database.transaction(storeName, mode);
            const request = operation(transaction.objectStore(storeName));

            request.onsuccess = () => {
                result = request.result;
            };
            request.onerror = () => {
                settled = true;
                reject(request.error || new Error(`Database request failed for "${storeName}".`));
            };
            transaction.oncomplete = () => {
                if (!settled) resolve(result);
            };
            transaction.onerror = () => {
                if (!settled) {
                    settled = true;
                    reject(transaction.error || new Error(`Database transaction failed for "${storeName}".`));
                }
            };
            transaction.onabort = () => {
                if (!settled) {
                    settled = true;
                    reject(transaction.error || new Error(`Database transaction was aborted for "${storeName}".`));
                }
            };
        });
    }

    getProject(id) {
        return this.request('projects', 'readonly', store => store.get(id));
    }

    getProjects() {
        return this.request('projects', 'readonly', store => store.getAll());
    }

    putProject(project) {
        return this.request('projects', 'readwrite', store => store.put(project));
    }

    addProject(project) {
        return this.request('projects', 'readwrite', store => store.add(project));
    }

    deleteProject(id) {
        return this.request('projects', 'readwrite', store => store.delete(id));
    }

    async deleteProjectAndRecent(id) {
        const database = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(['projects', 'recentProjects'], 'readwrite');
            transaction.objectStore('projects').delete(id);
            transaction.objectStore('recentProjects').delete(id);
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error || new Error('Unable to delete project records.'));
            transaction.onabort = () => reject(transaction.error || new Error('Project deletion was aborted.'));
        });
    }

    getRecentProjects() {
        return this.request('recentProjects', 'readonly', store => store.getAll());
    }

    putRecentProject(entry) {
        return this.request('recentProjects', 'readwrite', store => store.put(entry));
    }

    deleteRecentProject(id) {
        return this.request('recentProjects', 'readwrite', store => store.delete(id));
    }
}
