import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { boardAPI } from "../../api";
import { Board } from "../../types";
import { useAuth } from "../../context/AuthContext";
import "./Board.css";

const BoardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBoardEditing, setIsBoardEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
  });
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      fetchBoard(parseInt(id));
    }
  }, [id]);

  const fetchBoard = async (boardId: number) => {
    try {
      const data = await boardAPI.getBoardById(boardId);
      setBoard(data);
      setEditForm({
        title: data.title,
        description: data.description,
      });
    } catch (err: any) {
      setError("게시글을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!board || !window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await boardAPI.deleteBoard(board.id);
      navigate("/boards");
    } catch (err: any) {
      alert("삭제에 실패했습니다.");
    }
  };

  const handleStatusToggle = async () => {
    if (!board) return;

    const newStatus = board.status === "PUBLIC" ? "PRIVATE" : "PUBLIC";

    try {
      const updatedBoard = await boardAPI.updateBoardStatus(
        board.id,
        newStatus as any
      );
      setBoard(updatedBoard);
    } catch (err: any) {
      alert("상태 변경에 실패했습니다.");
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  };

  const handleSaveBoard = async () => {
    if (!board) return;

    try {
      const updatedBoard = await boardAPI.updateBoard(board.id, {
        title: editForm.title,
        description: editForm.description,
        file: selectedFile,
      });

      setBoard(updatedBoard);
      setIsBoardEditing(false);
      alert("게시글이 수정되었습니다.");
    } catch (err: any) {
      alert("게시글 수정에 실패했습니다.");
    }
  };

  const handleDownloadServerFile = async () => {
    if (!board?.filePath || !board?.fileName) return;

    try {
      const blob = await boardAPI.downloadFile(board.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = board.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("파일 다운로드에 실패했습니다.");
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      title: board?.title || "",
      description: board?.description || "",
    });
    setIsBoardEditing(false);
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!board) return <div className="error">게시글을 찾을 수 없습니다.</div>;

  return (
    <div className="board-container">
      <div className="board-header">
        <Link to="/boards" className="btn btn-secondary">
          ← 목록으로
        </Link>
        <div className="header-actions">
          {user?.username === board.user.username && (
            <>
              <button
                onClick={() => setIsBoardEditing(!isBoardEditing)}
                className="btn btn-primary"
              >
                {isBoardEditing ? "취소" : "수정"}
              </button>
              <button onClick={handleStatusToggle} className="btn btn-outline">
                {board.status === "PUBLIC" ? "비공개로 변경" : "공개로 변경"}
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                삭제
              </button>
            </>
          )}
        </div>
      </div>

      <div className="board-detail">
        {isBoardEditing ? (
          <div className="board-edit-form">
            <div className="form-group">
              <label htmlFor="title">제목</label>
              <input
                id="title"
                type="text"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">내용</label>
              <textarea
                id="description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                className="form-control"
                rows={10}
              />
            </div>
            <div className="form-actions">
              <button onClick={handleCancelEdit} className="btn btn-secondary">
                취소
              </button>
              <button onClick={handleSaveBoard} className="btn btn-primary">
                저장
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="board-detail-header">
              <h1>{board.title}</h1>
              <div className="board-meta">
                <span className={`status ${board.status.toLowerCase()}`}>
                  {board.status}
                </span>
                <span>작성자: {board.user.username}</span>
              </div>
            </div>

            <div className="board-detail-content">
              <p>{board.description}</p>
            </div>
          </>
        )}

        {board.fileName && board.filePath && (
          <div className="server-file-section">
            <h3>첨부된 파일</h3>
            <div className="server-file-info">
              <div className="file-details">
                <span className="file-name">📄 {board.fileName}</span>
                <span className="file-size">
                  (
                  {board.fileSize
                    ? `${(board.fileSize / 1024).toFixed(1)} KB`
                    : "크기 불명"}
                  )
                </span>
              </div>
              <div className="file-actions">
                <button
                  onClick={handleDownloadServerFile}
                  className="btn btn-primary"
                >
                  다운로드
                </button>
              </div>
            </div>
          </div>
        )}

        {isBoardEditing && (
          <div className="file-section">
            <h3>새 파일 업로드</h3>
            <div className="file-controls">
              <input
                type="file"
                className="file-input"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardDetail;
