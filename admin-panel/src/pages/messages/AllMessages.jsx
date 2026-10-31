import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import API from "../../Api/API";
import toast from "react-hot-toast";
import { MessageSquare, CheckCircle, Trash2, Mail, Clock } from "lucide-react";

const AllMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await API.get("/webmessage/get-all");
      if (res.data?.success) {
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      toast.error("Failed to load contact messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleMarkResolved = async (id) => {
    try {
      const res = await API.patch(`/webmessage/update-status/${id}`, { status: "resolved" });
      if (res.data?.success) {
        toast.success("Enquiry marked as resolved");
        fetchMessages();
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this enquiry?")) return;
    try {
      const res = await API.delete(`/webmessage/delete/${id}`);
      if (res.data?.success) {
        toast.success("Message deleted");
        fetchMessages();
      }
    } catch (err) {
      toast.error("Failed to delete message");
    }
  };

  return (
    <Layout>
      <div className="p-4">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="fw-bold mb-1">Patient Inquiries & Contact Messages</h2>
            <p className="text-muted small mb-0">Review questions submitted through the public website portal.</p>
          </div>
          <button onClick={fetchMessages} className="btn btn-outline-secondary btn-sm rounded-pill px-3">
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : messages.length === 0 ? (
          <div className="card shadow-sm border-0 rounded-4 text-center p-5 bg-white">
            <MessageSquare size={44} className="text-muted mx-auto mb-2" />
            <h5 className="fw-bold">No Contact Inquiries</h5>
            <p className="text-muted small">All patient messages have been handled or none have been submitted yet.</p>
          </div>
        ) : (
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Patient</th>
                    <th>Contact Info</th>
                    <th>Message</th>
                    <th>Received</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr key={msg._id}>
                      <td className="fw-semibold">{msg.name}</td>
                      <td className="text-muted small">{msg.contact}</td>
                      <td style={{ maxWidth: "300px" }}>
                        <span className="small text-dark">{msg.message}</span>
                      </td>
                      <td className="text-muted small">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <span
                          className={`badge rounded-pill ${
                            msg.status === "resolved" ? "bg-success" : "bg-warning text-dark"
                          }`}
                        >
                          {msg.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          {msg.status !== "resolved" && (
                            <button
                              onClick={() => handleMarkResolved(msg._id)}
                              className="btn btn-sm btn-outline-success rounded-pill d-inline-flex align-items-center gap-1"
                              title="Mark as resolved"
                            >
                              <CheckCircle size={14} /> Resolve
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(msg._id)}
                            className="btn btn-sm btn-outline-danger rounded-pill"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AllMessages;
