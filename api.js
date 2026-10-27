
const API_URL = "https://jsonplaceholder.typicode.com/todos";

export async function fetchTasksFromAPI() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("No se pudieron cargar las tareas del servidor.");
        }

        const data = await response.json();

        return data.map((task) => ({
            id: crypto.randomUUID(),
            apiId: task.id,
            title: task.title,
            description: "Tarea importada desde JSONPlaceholder.",
            priority: "Media",
            completed: task.completed,
            createdAt: new Date().toISOString(),
            source: "api"
        }));
    } catch (error) {
        console.error("Error al consultar la API:", error);
        throw error;
    }
}
