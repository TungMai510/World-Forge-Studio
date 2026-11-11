import { UIController } from './ui/layout.js';
import { DatabaseManager } from './data/database-manager.js';
import { ProjectService } from './services/project-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    const database = new DatabaseManager();
    const ui = new UIController(new ProjectService(database));
    try {
        await database.open();
        await ui.init();
        console.log('WorldForge Studio Project Manager initialized.');
    } catch (error) {
        console.error('WorldForge Studio failed to initialize:', error);
        ui.notify(`Không thể khởi động Project Manager: ${error.message}`, true);
    }
});
