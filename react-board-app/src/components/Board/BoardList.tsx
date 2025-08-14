import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { boardAPI } from "../../api";
import { Board } from "../../types";
import { useAuth } from "../../context/AuthContext";
import "./Board.css";

const BoardList: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const data = await boardAPI.getAllBoards();
      setBoards(data);
    } catch (err: any) {
      setError("게시글을 불러오는데 실패했습니다.");
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await boardAPI.deleteBoard(id);
      setBoards(boards.filter((board) => board.id !== id));
    } catch (err: any) {
      alert("삭제에 실패했습니다.");
    }
  };

  const handleStatusToggle = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLIC" ? "PRIVATE" : "PUBLIC";

    try {
      const updatedBoard = await boardAPI.updateBoardStatus(
        id,
        newStatus as any
      );
      setBoards(
        boards.map((board) => (board.id === id ? updatedBoard : board))
      );
    } catch (err: any) {
      alert("상태 변경에 실패했습니다.");
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="board-container">
      <div className="board-header">
        <h1>게시판</h1>
        <div className="header-actions">
          <span>환영합니다, {user?.username}님!</span>
          <Link to="/boards/create" className="btn btn-primary">
            새 글
          </Link>
          <button onClick={logout} className="btn btn-secondary">
            로그아웃
          </button>
        </div>
      </div>

      {boards.length === 0 ? (
        <div className="empty-state">
          <p>게시글이 없습니다. 첫 번째 글을 작성해보세요!</p>
          <Link to="/boards/create" className="btn btn-primary">
            글 작성하기
          </Link>
        </div>
      ) : (
        <div className="board-list">
          {boards.map((board) => (
            <div key={board.id} className="board-item">
              <div className="board-content">
                <h3>
                  <Link to={`/boards/${board.id}`}>{board.title}</Link>
                </h3>
                <p>{board.description}</p>
                <div className="board-meta">
                  <span className={`status ${board.status.toLowerCase()}`}>
                    {board.status}
                  </span>
                  <span>작성자: {board.user.username}</span>
                </div>
              </div>
              {user?.username === board.user.username && (
                <div className="board-actions">
                  <button
                    onClick={() => handleStatusToggle(board.id, board.status)}
                    className="btn btn-sm btn-outline"
                  >
                    {board.status === "PUBLIC" ? "비공개로" : "공개로"}
                  </button>
                  <button
                    onClick={() => handleDelete(board.id)}
                    className="btn btn-sm btn-danger"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BoardList;
