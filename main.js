

import { getTasks, saveTasks } from "./storage.js";
import { fetchTasksFromAPI } from "./api.js";

const taskForm = document.querySelector("#taskForm");
const taskTitle = document.querySelector("#taskTitle");
const taskDescription = document.querySelector("#taskDescription");
const taskPriority = document.querySelector("#taskPriority");
const taskList = document.querySelector("#taskList");
const searchInput = document.querySelector("#searchInput");
const statusFilter = document.querySelector("#statusFilter");
const sortBy = document.querySelector("#sortBy");
const notification = document.querySelector("#notification");

const totalTasks = document.querySelector("#totalTasks");
const pendingTasks = document.querySelector("#pendingTasks");
const completedTasks = document.querySelector("#completedTasks");

let tasks = getTasks() ?? [];
let editingId = null;

function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.style.color = isError ? "#b91c1c" : "#166534";
}

function persistTasks() {
    const saved = saveTasks(tasks);

    if (!saved) {
        showNotification(
            "No se pudieron guardar los cambios en el navegador.",
            true
        );
    }
}

function updateDashboard() {
    totalTasks.textContent = tasks.length;
    pendingTasks.textContent = tasks.filter(
        task => !task.completed
    ).length;
    completedTasks.textContent = tasks.filter(
        task => task.completed
    ).length;
}

function renderTasks() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const filter = statusFilter.value;
    const order = sortBy.value;

    let visibleTasks = tasks.filter(task => {
        const matchesSearch = task.title
            .toLowerCase()
            .includes(searchTerm);

        const matchesStatus =
            filter === "all" ||
            (filter === "pending" && !task.completed) ||
            (filter === "completed" && task.completed);

        return matchesSearch && matchesStatus;
    });

    visibleTasks.sort((a, b) => {
        if (order === "priority") {
            const priorityValues = {
                Alta: 3,
                Media: 2,
                Baja: 1
            };

            return (
                (priorityValues[b.priority] ?? 0) -
                (priorityValues[a.priority] ?? 0)
            );
        }

        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    taskList.replaceChildren();

    if (visibleTasks.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.id = "emptyMessage";
        emptyMessage.textContent = tasks.length === 0
            ? "Todavía no hay tareas. ¡Agrega la primera!"
            : "No hay tareas que coincidan con tu búsqueda.";
        taskList.append(emptyMessage);
    }

    visibleTasks.forEach(task => {
        const card = document.createElement("article");
        card.className = task.completed
            ? "task-card completed"
            : "task-card";

        const title = document.createElement("h3");
        title.textContent = task.title;

        const description = document.createElement("p");
        description.textContent =
            task.description || "Sin descripción.";

        const priority = document.createElement("span");
        priority.className =
            `priority priority-${task.priority.toLowerCase()}`;
        priority.textContent = `Prioridad: ${task.priority}`;

        const status = document.createElement("p");
        status.textContent = task.completed
            ? "Estado: Completada"
            : "Estado: Pendiente";

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const completeButton = document.createElement("button");
        completeButton.textContent = task.completed
            ? "Marcar pendiente"
            : "Completar";

        completeButton.addEventListener("click", () => {
            task.completed = !task.completed;
            persistTasks();
            renderTasks();
        });

        const editButton = document.createElement("button");
        editButton.textContent = "Editar";

        editButton.addEventListener("click", () => {
            taskTitle.value = task.title;
            taskDescription.value = task.description || "";
            taskPriority.value = task.priority;
            editingId = task.id;

            taskForm.querySelector('button[type="submit"]')
                .textContent = "Guardar cambios";

            taskTitle.focus();
            showNotification("Edita los campos y guarda los cambios.");
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Eliminar";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", () => {
            tasks = tasks.filter(item => item.id !== task.id);
            persistTasks();
            renderTasks();
            showNotification("Tarea eliminada correctamente.");
        });

        actions.append(completeButton, editButton, deleteButton);
        card.append(title, description, priority, status, actions);
        taskList.append(card);
    });

    updateDashboard();
}

taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const title = taskTitle.value.trim();
    const description = taskDescription.value.trim();
    const priority = taskPriority.value;

    if (!title) {
        showNotification("El título es obligatorio.", true);
        taskTitle.focus();
        return;
    }

    if (!description) {
        showNotification("La descripción es obligatoria.", true);
        taskDescription.focus();
        return;
    }

    if (!["Alta", "Media", "Baja"].includes(priority)) {
        showNotification("Selecciona una prioridad válida.", true);
        taskPriority.focus();
        return;
    }

    if (editingId !== null) {
        const task = tasks.find(item => item.id === editingId);

        if (task) {
            task.title = title;
            task.description = description;
            task.priority = priority;
        }

        editingId = null;
        taskForm.querySelector('button[type="submit"]')
            .textContent = "Agregar tarea";

        showNotification("Tarea actualizada correctamente.");
    } else {
        tasks.push({
            id: crypto.randomUUID(),
            title,
            description,
            priority,
            completed: false,
            createdAt: new Date().toISOString(),
            source: "local"
        });

        showNotification("Tarea creada correctamente.");
    }

    persistTasks();
    taskForm.reset();
    taskPriority.value = "Media";
    renderTasks();
});

searchInput.addEventListener("input", renderTasks);
statusFilter.addEventListener("change", renderTasks);
sortBy.addEventListener("change", renderTasks);

async function initializeApp() {
    const storedTasks = getTasks();

    if (storedTasks !== null) {
        tasks = storedTasks;
        renderTasks();
        showNotification("Tareas recuperadas del almacenamiento local.");
        return;
    }

    showNotification("Cargando tareas iniciales desde la API...");

    try {
        tasks = await fetchTasksFromAPI();
        persistTasks();
        renderTasks();
        showNotification("Tareas importadas correctamente desde la API.");
    } catch (error) {
        tasks = [];
        renderTasks();
        showNotification(
            "No se pudieron cargar las tareas. Puedes crear tareas manualmente.",
            true
        );
    }
}

initializeApp();
