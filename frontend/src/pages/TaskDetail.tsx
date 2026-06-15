import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Task, User, STATUS_COLORS } from "../types";

export function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedTechs, setSelectedTechs] = useState<number[]>([]);
  const [leadTech, setLeadTech] = useState<number | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [progressNotes, setProgressNotes] = useState("");
  const [clarificationNotes, setClarificationNotes] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const fetchTask = async () => {
    try {
      const res = await axios.get(`/api/tasks/${id}`);
      setTask(res.data);
      setEditForm({
        clientName: res.data.clientName,
        contactPerson: res.data.contactPerson || "",
        mobileNumber: res.data.mobileNumber || "",
        location: res.data.location || "",
        jobType: res.data.jobType,
        description: res.data.description || "",
        specialInstructions: res.data.specialInstructions || "",
        priority: res.data.priority,
      });
    } catch (err) {
      setError("Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await axios.get("/api/auth/users");
      setUsers(res.data.filter((u: User) => u.role === "TECHNICIAN"));
    } catch {}
  };

  useEffect(() => {
    fetchTask();
    if (user?.role === "ADMIN") fetchTechnicians();
  }, [id]);

  const handleAssign = async () => {
    if (!selectedTechs.length) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/tasks/${id}/assign`, {
        userIds: selectedTechs,
        leadUserId: leadTech,
      });
      setTask(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to assign");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await axios.post(`/api/tasks/${id}/accept`);
      await fetchTask();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to accept");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClarification = async () => {
    if (!clarificationNotes) return;
    setActionLoading(true);
    try {
      await axios.post(`/api/tasks/${id}/clarification`, { notes: clarificationNotes });
      setClarificationNotes("");
      await fetchTask();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to request clarification");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await axios.post(`/api/tasks/${id}/start`);
      await fetchTask();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to start");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProgress = async () => {
    if (!progressNotes) return;
    setActionLoading(true);
    try {
      await axios.post(`/api/tasks/${id}/progress`, { notes: progressNotes });
      setProgressNotes("");
      await fetchTask();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update progress");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!completionNotes) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/tasks/${id}/complete`, { notes: completionNotes });
      setTask(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to complete");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReview = async (approved: boolean) => {
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/tasks/${id}/review`, {
        approved,
        reason: approved ? undefined : reviewReason,
      });
      setTask(res.data);
      setReviewReason("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to review");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    setActionLoading(true);
    try {
      const res = await axios.put(`/api/tasks/${id}`, editForm);
      setTask(res.data);
      setEditMode(false);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to edit");
    } finally {
      setActionLoading(false);
    }
  };

  const isAssignedToMe = task?.assignments?.some((a) => a.userId === user?.id);
  const myAssignment = task?.assignments?.find((a) => a.userId === user?.id);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Task not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{task.taskId}</h1>
              <span
                className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                  STATUS_COLORS[task.status]
                }`}
              >
                {task.status}
              </span>
              <span
                className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                  task.priority === "High"
                    ? "bg-red-100 text-red-800"
                    : task.priority === "Medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {task.priority}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Created by {task.createdBy.name} on{" "}
              {new Date(task.createdAt).toLocaleString()}
            </p>
          </div>
          {user?.role === "ADMIN" && !editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
          )}
        </div>

        {editMode ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={editForm.clientName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, clientName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Type
                </label>
                <input
                  type="text"
                  value={editForm.jobType}
                  onChange={(e) =>
                    setEditForm({ ...editForm, jobType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={editForm.contactPerson}
                  onChange={(e) =>
                    setEditForm({ ...editForm, contactPerson: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={editForm.mobileNumber}
                  onChange={(e) =>
                    setEditForm({ ...editForm, mobileNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm({ ...editForm, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  rows={3}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Instructions
                </label>
                <textarea
                  value={editForm.specialInstructions}
                  onChange={(e) =>
                    setEditForm({ ...editForm, specialInstructions: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={editForm.priority}
                  onChange={(e) =>
                    setEditForm({ ...editForm, priority: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                disabled={actionLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Customer Information
              </h3>
              <dl className="space-y-2">
                <div className="flex">
                  <dt className="text-sm text-gray-500 w-32">Client Name:</dt>
                  <dd className="text-sm text-gray-900">{task.clientName}</dd>
                </div>
                <div className="flex">
                  <dt className="text-sm text-gray-500 w-32">Contact:</dt>
                  <dd className="text-sm text-gray-900">
                    {task.contactPerson || "-"}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="text-sm text-gray-500 w-32">Mobile:</dt>
                  <dd className="text-sm text-gray-900">
                    {task.mobileNumber || "-"}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="text-sm text-gray-500 w-32">Location:</dt>
                  <dd className="text-sm text-gray-900">{task.location || "-"}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Task Information
              </h3>
              <dl className="space-y-2">
                <div className="flex">
                  <dt className="text-sm text-gray-500 w-32">Job Type:</dt>
                  <dd className="text-sm text-gray-900">{task.jobType}</dd>
                </div>
                <div className="flex">
                  <dt className="text-sm text-gray-500 w-32">Description:</dt>
                  <dd className="text-sm text-gray-900">
                    {task.description || "-"}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="text-sm text-gray-500 w-32">Instructions:</dt>
                  <dd className="text-sm text-gray-900">
                    {task.specialInstructions || "-"}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="text-sm text-gray-500 w-32">Assigned By:</dt>
                  <dd className="text-sm text-gray-900">
                    {task.assignedBy?.name || "-"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>

      {task.status === "CREATED" && user?.role === "ADMIN" && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assign Technicians</h2>
          <div className="space-y-3">
            {users.map((tech) => (
              <label
                key={tech.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTechs.includes(tech.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTechs([...selectedTechs, tech.id]);
                    } else {
                      setSelectedTechs(selectedTechs.filter((t) => t !== tech.id));
                      if (leadTech === tech.id) setLeadTech(null);
                    }
                  }}
                  className="rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{tech.name}</p>
                  <p className="text-xs text-gray-500">{tech.username}</p>
                </div>
                <label className="flex items-center gap-1 text-sm text-gray-500">
                  <input
                    type="radio"
                    name="lead"
                    checked={leadTech === tech.id}
                    onChange={() => setLeadTech(tech.id)}
                    disabled={!selectedTechs.includes(tech.id)}
                    className="mr-1"
                  />
                  Lead
                </label>
              </label>
            ))}
            <button
              onClick={handleAssign}
              disabled={actionLoading || selectedTechs.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? "Assigning..." : "Assign Selected"}
            </button>
          </div>
        </div>
      )}

      {(task.status === "ASSIGNED" || task.status === "ACCEPTED") &&
        isAssignedToMe &&
        user?.role === "TECHNICIAN" && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Task Actions
            </h2>
            <div className="flex gap-3">
              {myAssignment?.status === "ASSIGNED" && (
                <>
                  <button
                    onClick={handleAccept}
                    disabled={actionLoading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading ? "Processing..." : "Accept Task"}
                  </button>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={clarificationNotes}
                      onChange={(e) => setClarificationNotes(e.target.value)}
                      placeholder="Reason for clarification..."
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none flex-1"
                    />
                    <button
                      onClick={handleClarification}
                      disabled={actionLoading || !clarificationNotes}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 disabled:opacity-50"
                    >
                      Request Clarification
                    </button>
                  </div>
                </>
              )}
              {(myAssignment?.status === "ACCEPTED" && task.status === "ACCEPTED") && (
                <button
                  onClick={handleStart}
                  disabled={actionLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "Start Work"}
                </button>
              )}
            </div>
          </div>
        )}

      {task.status === "IN_PROGRESS" && isAssignedToMe && user?.role === "TECHNICIAN" && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Progress</h2>
          <div className="space-y-3">
            <textarea
              value={progressNotes}
              onChange={(e) => setProgressNotes(e.target.value)}
              placeholder="Enter progress notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={handleProgress}
                disabled={actionLoading || !progressNotes}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? "Updating..." : "Update Progress"}
              </button>
              <button
                onClick={() => {
                  const notes = prompt("Enter completion notes:");
                  if (notes) {
                    setCompletionNotes(notes);
                    handleComplete();
                  }
                }}
                disabled={actionLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
              >
                Mark Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {task.status === "COMPLETED" && user?.role === "ADMIN" && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Task</h2>
          <div className="space-y-3">
            {task.completedNotes && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Completion Notes:</p>
                <p className="text-sm text-gray-600 mt-1">{task.completedNotes}</p>
              </div>
            )}
            {task.completedAt && (
              <p className="text-sm text-gray-500">
                Completed on: {new Date(task.completedAt).toLocaleString()}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => handleReview(true)}
                disabled={actionLoading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Approve & Close"}
              </button>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Reason for reopening..."
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
                <button
                  onClick={() => handleReview(false)}
                  disabled={actionLoading || !reviewReason}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  Reopen Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {task.assignments && task.assignments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Assigned Technicians
          </h2>
          <div className="space-y-3">
            {task.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      assignment.status === "ACCEPTED"
                        ? "bg-green-500"
                        : assignment.status === "ASSIGNED"
                        ? "bg-blue-500"
                        : "bg-gray-400"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {assignment.user.name}
                      {assignment.isLead && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Lead
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">Status: {assignment.status}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {assignment.acceptedAt
                    ? `Accepted: ${new Date(assignment.acceptedAt).toLocaleString()}`
                    : `Assigned: ${new Date(assignment.assignedAt).toLocaleString()}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h2>
        <div className="space-y-3">
          {task.activityLogs?.map((log) => (
            <div key={log.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{log.user.name}</span> - {log.action}
                </p>
                {log.details && (
                  <p className="text-sm text-gray-500 mt-0.5">{log.details}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {(!task.activityLogs || task.activityLogs.length === 0) && (
            <p className="text-sm text-gray-500">No activity recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
