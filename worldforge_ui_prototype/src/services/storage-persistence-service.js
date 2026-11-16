export async function requestStoragePersistence(navigatorLike = globalThis.navigator) {
    try {
        const storage = navigatorLike && navigatorLike.storage;
        if (!storage || typeof storage.persist !== 'function') {
            return { status: 'unsupported', persisted: false };
        }
        if (typeof storage.persisted === 'function' && await storage.persisted()) {
            return { status: 'already-persistent', persisted: true };
        }
        const persisted = await storage.persist();
        return { status: persisted ? 'granted' : 'denied', persisted: Boolean(persisted) };
    } catch (error) {
        return { status: 'error', persisted: false, error };
    }
}

export function isQuotaExceededError(error) {
    return error?.name === 'QuotaExceededError' || error?.code === 22 ||
        error?.code === 'QUOTA_ERR' || error?.code === 'STORAGE_QUOTA_EXCEEDED';
}

export function formatPersistenceError(error) {
    if (!error?.persistenceFailure && !isQuotaExceededError(error)) {
        return error?.message || 'Không thể lưu dự án.';
    }
    const backupReminder = 'Bản lưu trước đó vẫn được giữ. Hãy xuất bản sao lưu hoặc giải phóng dung lượng trình duyệt thủ công rồi thử lại.';
    if (isQuotaExceededError(error)) {
        return `Bộ nhớ trình duyệt có thể đã đầy. ${backupReminder}`;
    }
    const detail = error?.message ? ` Chi tiết: ${error.message}` : '';
    return `Không thể ghi dữ liệu vào bộ nhớ trình duyệt.${detail} ${backupReminder}`;
}
