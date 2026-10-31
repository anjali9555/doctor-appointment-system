import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import API from "../../Api/API";
import toast from "react-hot-toast";
import { BookOpen, Plus, Trash2, Sparkles, RefreshCw, CheckCircle, Tag } from "lucide-react";

const KnowledgeBaseManager = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Article Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("faq");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await API.get("/ai/knowledge");
      if (res.data?.success) {
        setArticles(res.data.articles || []);
      }
    } catch (err) {
      toast.error("Failed to fetch knowledge base articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      return toast.error("Title and content are required");
    }

    setSaving(true);
    try {
      const res = await API.post("/ai/knowledge", {
        title,
        category,
        content,
        tags,
      });

      if (res.data?.success) {
        toast.success("Article added to MediAssist AI Knowledge Base!");
        setShowAddModal(false);
        setTitle("");
        setContent("");
        setTags("");
        fetchArticles();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add article");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm("Remove this article from MediAssist AI knowledge retrieval?")) return;
    try {
      const res = await API.delete(`/ai/knowledge/${id}`);
      if (res.data?.success) {
        toast.success("Article removed");
        fetchArticles();
      }
    } catch (err) {
      toast.error("Failed to delete article");
    }
  };

  const handleSeedDefaults = async () => {
    try {
      const res = await API.post("/ai/seed-knowledge");
      if (res.data?.success) {
        toast.success(res.data.message || "Knowledge base seeded!");
        fetchArticles();
      }
    } catch (err) {
      toast.error("Failed to seed knowledge base");
    }
  };

  return (
    <Layout>
      <div className="p-4">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
              <Sparkles size={24} className="text-primary" />
              MediAssist AI Knowledge Base
            </h2>
            <p className="text-muted small mb-0">
              Manage clinical FAQs, policies, and guidelines retrieved by the RAG AI chatbot.
            </p>
          </div>

          <div className="d-flex gap-2">
            <button
              onClick={handleSeedDefaults}
              className="btn btn-outline-primary btn-sm rounded-pill d-flex align-items-center gap-1 px-3"
            >
              <RefreshCw size={15} /> Seed Defaults
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-sm rounded-pill d-flex align-items-center gap-1 px-3"
            >
              <Plus size={16} /> Add Article
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : articles.length === 0 ? (
          <div className="card shadow-sm border-0 rounded-4 text-center p-5 bg-white">
            <BookOpen size={44} className="text-muted mx-auto mb-2" />
            <h5 className="fw-bold">No Articles in Knowledge Base</h5>
            <p className="text-muted small">
              Click &quot;Seed Defaults&quot; above to immediately load default clinic policies and FAQs into the RAG pipeline.
            </p>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 g-3">
            {articles.map((art) => (
              <div className="col" key={art._id}>
                <div className="card h-100 shadow-sm border-0 rounded-4 p-4 bg-white d-flex flex-column">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 text-uppercase small">
                      {art.category}
                    </span>
                    <button
                      onClick={() => handleDeleteArticle(art._id)}
                      className="btn btn-sm btn-link text-danger p-0"
                      title="Delete article"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h5 className="fw-bold text-dark mb-2">{art.title}</h5>
                  <p className="text-muted small flex-grow-1" style={{ whiteSpace: "pre-line" }}>
                    {art.content}
                  </p>

                  {art.tags && art.tags.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mt-3 pt-2 border-top">
                      {art.tags.map((t, idx) => (
                        <span key={idx} className="badge bg-light text-secondary border small">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Article Modal */}
        {showAddModal && (
          <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4 border-0 shadow">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">Add Document to AI Knowledge Base</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} />
                </div>
                <form onSubmit={handleCreateArticle}>
                  <div className="modal-body py-3">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Title:</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="E.g., Telemedicine Guidelines, Holiday Schedule..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Category:</label>
                      <select
                        className="form-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="faq">FAQ</option>
                        <option value="policy">Clinic Policy</option>
                        <option value="specialty">Medical Specialty</option>
                        <option value="appointment">Appointment Instructions</option>
                        <option value="general">General Information</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Content / Answer (Grounded text for AI):</label>
                      <textarea
                        rows={4}
                        className="form-control"
                        placeholder="Detailed instructions or answer that MediAssist AI will use to respond..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Keywords / Tags (comma separated):</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. telemedicine, video call, pricing, weekend"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="modal-footer border-0 pt-0">
                    <button
                      type="button"
                      className="btn btn-light rounded-pill px-3"
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary rounded-pill px-4 fw-semibold"
                    >
                      {saving ? "Saving..." : "Add to Knowledge Base"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default KnowledgeBaseManager;
