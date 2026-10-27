
const STORAGE_KEY = "taskmanager_tasks";

export function getTasks() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);

        if (savedTasks === null) {
            return null;
        }

        const tasks = JSON.parse(savedTasks);

        return Array.isArray(tasks) ? tasks : null;
    } catch (error) {
        console.error("Error al recuperar las tareas:", error);
        return null;
    }
}

export function saveTasks(tasks) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Error al guardar las tareas:", error);
        return false;
    }
}
