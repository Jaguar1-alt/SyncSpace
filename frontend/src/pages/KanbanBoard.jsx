import React, { useState, useEffect } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import io from "socket.io-client";
import { FiTrash2 } from "react-icons/fi";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BACKEND_BASE = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:5000';
const socket = io(BACKEND_BASE);

function KanbanBoard({ workspaceId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [members, setMembers] = useState([]);
  const [user, setUser] = useState(null);

  // Fetch workspace details and user info
  useEffect(() => {
    const fetchWorkspaceDetails = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(`${API_BASE}/workspaces/${workspaceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMembers(res.data.members);
        const userRes = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userRes.data);
      } catch (err) {
        console.error("Error fetching workspace details:", err);
        setError("Failed to load workspace details.");
      }
    };
    fetchWorkspaceDetails();
  }, [workspaceId]);

  // Socket.IO real-time updates (The correct way to handle auto-refresh)
  useEffect(() => {
    socket.emit("join_workspace", workspaceId);
    socket.on("task_created", (newTask) => {
      setTasks((prevTasks) => [...prevTasks, newTask]);
    });
    socket.on("task_updated", (updatedTask) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task._id === updatedTask._id ? updatedTask : task))
      );
    });
    socket.on("task_deleted", (taskId) => {
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
    });
    return () => {
      socket.off("task_created");
      socket.off("task_updated");
      socket.off("task_deleted");
    };
  }, [workspaceId]);

  // Initial fetch on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchTasks = async () => {
      try {
        const res = await axios.get(`${API_BASE}/tasks/${workspaceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(res.data);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [workspaceId]);

  // Drag and drop handler
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    const newStatus = destination.droppableId;
    const taskId = draggableId;
    const token = localStorage.getItem("token");

    try {
      await axios.put(
        `${API_BASE}/tasks/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !newTaskTitle.trim()) {
      alert("Task title cannot be empty.");
      return;
    }
    try {
      await axios.post(
        `${API_BASE}/tasks`,
        { title: newTaskTitle, workspaceId, assignedTo: selectedMembers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewTaskTitle("");
      setSelectedMembers([]);
    } catch (err) {
      console.error("Error creating task:", err.response?.data || err);
      alert(err.response?.data?.msg || "Failed to create task.");
    }
  };
  
  const handleMemberSelect = (memberId) => {
    setSelectedMembers((prevSelected) => {
      if (prevSelected.includes(memberId)) {
        return prevSelected.filter((id) => id !== memberId);
      } else {
        return [...prevSelected, memberId];
      }
    });
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_BASE}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Task deleted successfully.");
    } catch (err) {
      console.error("Failed to delete task:", err);
      alert("Failed to delete task.");
    }
  };

  const getTasksByStatus = (status) => tasks.filter((task) => task.status === status);
  const getBackgroundColor = (status) => {
    if (status === "To Do") return "bg-gray-200";
    if (status === "In Progress") return "bg-blue-200";
    if (status === "Done") return "bg-green-200";
    return "bg-gray-200";
  };
  const getAssignedNames = (assignedTo) => {
    if (!assignedTo || assignedTo.length === 0) return "Unassigned";
    return assignedTo.map(member => member.name || member.email).join(', ');
  };

  return (
    <div>
      <h3 className="text-3xl font-bold mb-4 text-center">Kanban Board</h3>
      {user && user.role === "admin" && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-sm">
          <h4 className="text-xl font-semibold text-gray-800 mb-4">Create a New Task</h4>
          <form onSubmit={handleCreateTask}>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input
                type="text"
                placeholder="Enter task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-grow border border-gray-300 focus:border-blue-500 rounded-lg px-4 py-3 text-gray-700"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md"
              >
                Add Task
              </button>
            </div>
            
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <h5 className="text-sm font-medium text-gray-600 mr-2">Assign to:</h5>
              {members.map((member) => (
                <label key={member._id} className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member._id)}
                    onChange={() => handleMemberSelect(member._id)}
                    className="form-checkbox text-blue-600 rounded"
                  />
                  {member.name || member.email}
                </label>
              ))}
            </div>
          </form>
        </div>
      )}
      {error && <p className="text-red-500 text-center">{error}</p>}
      {loading ? (
        <p className="text-center">Loading tasks...</p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["To Do", "In Progress", "Done"].map((status) => (
              <Droppable droppableId={status} key={status}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`${getBackgroundColor(status)} rounded-lg p-4`}
                  >
                    <h3 className="text-xl font-semibold mb-4">{status}</h3>
                    {getTasksByStatus(status).map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white shadow rounded-lg p-4 mb-3"
                          >
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold">{task.title}</h4>
                                {user && user.role === "admin" && (
                                    <button
                                      onClick={() => handleDeleteTask(task._id)}
                                      className="text-red-500 hover:text-red-700"
                                      title="Delete Task"
                                    >
                                      <FiTrash2 size={16} />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-gray-600">{task.description}</p>
                            {task.assignedTo && task.assignedTo.length > 0 && (
                              <p className="text-xs text-gray-500 mt-2">
                                Assigned to: {getAssignedNames(task.assignedTo)}
                              </p>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}

export default KanbanBoard;