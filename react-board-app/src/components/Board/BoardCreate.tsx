import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { boardAPI } from "../../api";
import "./Board.css";

const BoardCreate: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!title.trim() || !description.trim()) {
      setError("제목과 내용을 모두 입력해주세요.");
      setLoading(false);
      return;
    }

    try {
      await boardAPI.createBoard({ 
        title, 
        description, 
        file: selectedFile 
      });
      navigate("/boards");
    } catch (err: any) {
      setError(err.response?.data?.message || "게시글 작성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="board-container">
      <div className="board-header">
        <Link to="/boards" className="btn btn-secondary">
          ← 목록으로
        </Link>
        <h1>새 글 작성</h1>
      </div>

      <div className="board-form">
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">제목</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">내용</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={10}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="file">파일 첨부 (선택사항)</label>
            <input
              id="file"
              type="file"
              onChange={handleFileSelect}
              className="file-input"
              accept=".txt,.js,.ts,.jsx,.tsx,.json,.md,.css,.html,.py,.java,.cpp,.c"
            />
            {selectedFile && (
              <div className="file-info">
                <span>선택된 파일: {selectedFile.name}</span>
              </div>
            )}
          </div>

          <div className="form-actions">
            <Link to="/boards" className="btn btn-secondary">
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "작성 중..." : "작성 완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BoardCreate;
