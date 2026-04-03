import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** ChatRoom 내부 렌더/훅 예외 시 전체 앱 대신 폴백 UI (하얀 화면 방지). */
export class ChatRoomErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ChatRoom]', error.message, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-[#f9fafb] px-4 text-center">
          <p className="text-sm font-medium text-gray-800">채팅 화면을 불러오지 못했습니다.</p>
          <p className="max-w-md break-words text-xs text-gray-500">{this.state.error.message}</p>
          <button
            type="button"
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-800"
            onClick={() => this.setState({ error: null })}
          >
            다시 시도
          </button>
          <a href="/posts" className="text-sm text-blue-600 underline">
            게시글 목록으로
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}
